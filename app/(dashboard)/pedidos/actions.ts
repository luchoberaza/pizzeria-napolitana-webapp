"use server"

import { dbAll, dbRun } from "@/lib/db"
import { revalidatePath } from "next/cache"

export type OrderItem = {
  productId: number
  productName: string
  basePrice: number
  quantity: number
  note: string
  removedIngredients: { id: number; name: string }[]
  extraIngredients: { id: number; name: string; extraCost: number }[]
}

export type OrderData = {
  addressStreet: string
  addressFloorApt: string
  addressReference: string
  items: OrderItem[]
  discountAmount: number
  discountReason: string
}

export type Order = {
  id: number
  address_street: string
  address_floor_apt: string
  address_reference: string
  status_delivered: boolean
  discount_amount: string
  discount_reason: string
  total_snapshot: string
  created_at: string
  items: OrderItemDB[]
}

export type OrderItemDB = {
  id: number
  order_id: number
  product_id: number | null
  product_name_snapshot: string
  base_price_snapshot: string
  quantity: number
  note: string
  removed_ingredients: { id: number; ingredient_name_snapshot: string }[]
  extra_ingredients: {
    id: number
    ingredient_name_snapshot: string
    extra_cost_snapshot: string
  }[]
}

function calculateTotal(items: OrderItem[], discountAmount: number): number {
  const subtotal = items.reduce((sum, item) => {
    const extras = item.extraIngredients.reduce(
      (s, e) => s + e.extraCost,
      0
    )
    return sum + (item.basePrice + extras) * item.quantity
  }, 0)
  return Math.max(0, subtotal - discountAmount)
}

export async function createOrder(data: OrderData) {
  if (!data.addressStreet.trim()) return { error: "La dirección es requerida" }
  if (data.items.length === 0) return { error: "Agrega al menos un item" }

  const total = calculateTotal(data.items, data.discountAmount)

  await dbRun(
    `INSERT INTO orders (address_street, address_floor_apt, address_reference, discount_amount, discount_reason, total_snapshot)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.addressStreet.trim(),
      data.addressFloorApt.trim(),
      data.addressReference.trim(),
      data.discountAmount,
      data.discountReason.trim(),
      total,
    ]
  )

  const orderRows = await dbAll<{ id: number }>(
    "SELECT id FROM orders ORDER BY id DESC LIMIT 1"
  )
  const orderId = orderRows[0].id

  for (const item of data.items) {
    await dbRun(
      `INSERT INTO order_items (order_id, product_id, product_name_snapshot, base_price_snapshot, quantity, note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [orderId, item.productId, item.productName, item.basePrice, item.quantity, item.note.trim()]
    )

    const itemRows = await dbAll<{ id: number }>(
      "SELECT id FROM order_items WHERE order_id = ? ORDER BY id DESC LIMIT 1",
      [orderId]
    )
    const itemId = itemRows[0].id

    for (const ri of item.removedIngredients) {
      await dbRun(
        "INSERT INTO order_item_removed_ingredients (order_item_id, ingredient_id, ingredient_name_snapshot) VALUES (?, ?, ?)",
        [itemId, ri.id, ri.name]
      )
    }

    for (const ei of item.extraIngredients) {
      await dbRun(
        "INSERT INTO order_item_extra_ingredients (order_item_id, ingredient_id, ingredient_name_snapshot, extra_cost_snapshot) VALUES (?, ?, ?, ?)",
        [itemId, ei.id, ei.name, ei.extraCost]
      )
    }
  }

  revalidatePath("/pedidos")
  return { success: true, orderId }
}

export async function getOrders(): Promise<Order[]> {
  // Automatic cleanup of orders older than 30 days
  await dbRun("DELETE FROM orders WHERE created_at < datetime('now', '-30 days')")

  const orders = await dbAll<Order>("SELECT * FROM orders ORDER BY created_at DESC")

  if (orders.length === 0) return []

  const orderIds = orders.map((o) => o.id)
  const orderPlaceholders = orderIds.map(() => "?").join(", ")

  const items = await dbAll<Record<string, unknown>>(
    `SELECT * FROM order_items WHERE order_id IN (${orderPlaceholders}) ORDER BY id ASC`,
    orderIds
  )

  const itemIds = items.map((i) => i.id as number)

  let removedIngs: Record<string, unknown>[] = []
  let extraIngs: Record<string, unknown>[] = []

  if (itemIds.length > 0) {
    const itemPlaceholders = itemIds.map(() => "?").join(", ")
    removedIngs = await dbAll<Record<string, unknown>>(
      `SELECT * FROM order_item_removed_ingredients WHERE order_item_id IN (${itemPlaceholders})`,
      itemIds
    )
    extraIngs = await dbAll<Record<string, unknown>>(
      `SELECT * FROM order_item_extra_ingredients WHERE order_item_id IN (${itemPlaceholders})`,
      itemIds
    )
  }

  return orders.map((order) => ({
    ...order,
    items: items
      .filter((i) => i.order_id === order.id)
      .map((i) => ({
        id: i.id as number,
        order_id: i.order_id as number,
        product_id: i.product_id as number | null,
        product_name_snapshot: i.product_name_snapshot as string,
        base_price_snapshot: i.base_price_snapshot as string,
        quantity: i.quantity as number,
        note: (i.note as string) || "",
        removed_ingredients: removedIngs
          .filter((r) => r.order_item_id === i.id)
          .map((r) => ({
            id: r.id as number,
            ingredient_name_snapshot: r.ingredient_name_snapshot as string,
          })),
        extra_ingredients: extraIngs
          .filter((e) => e.order_item_id === i.id)
          .map((e) => ({
            id: e.id as number,
            ingredient_name_snapshot: e.ingredient_name_snapshot as string,
            extra_cost_snapshot: e.extra_cost_snapshot as string,
          })),
      })),
  }))
}

export async function toggleDelivered(orderId: number, delivered: boolean) {
  await dbRun(
    "UPDATE orders SET status_delivered = ? WHERE id = ?",
    [delivered ? 1 : 0, orderId]
  )
  revalidatePath("/pedidos")
  return { success: true }
}

export async function deleteOrder(id: number) {
  await dbRun("DELETE FROM orders WHERE id = ?", [id])
  revalidatePath("/pedidos")
  return { success: true }
}
