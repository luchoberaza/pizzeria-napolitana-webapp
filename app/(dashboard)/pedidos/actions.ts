"use server"

import Database from "better-sqlite3"
import { dbRunReturn, dbTransaction } from "@/lib/db"
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
  status_delivered: number
  discount_amount: number
  discount_reason: string
  total_snapshot: number
  created_at: string
  items: OrderItemDB[]
}

export type OrderItemDB = {
  id: number
  order_id: number
  product_id: number | null
  product_name_snapshot: string
  base_price_snapshot: number
  quantity: number
  note: string
  removed_ingredients: { id: number; ingredient_name_snapshot: string }[]
  extra_ingredients: {
    id: number
    ingredient_name_snapshot: string
    extra_cost_snapshot: number
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
  try {
    if (!data.addressStreet.trim()) return { error: "La dirección es requerida" }
    if (data.items.length === 0) return { error: "Agrega al menos un item" }

    const discountAmount = Math.max(0, data.discountAmount)
    const total = calculateTotal(data.items, discountAmount)

    const orderId = await dbTransaction((database: Database.Database) => {
      const insertOrder = database.prepare(
        `INSERT INTO orders (address_street, address_floor_apt, address_reference, discount_amount, discount_reason, total_snapshot)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      const orderResult = insertOrder.run(
        data.addressStreet.trim(),
        data.addressFloorApt.trim(),
        data.addressReference.trim(),
        discountAmount,
        data.discountReason.trim(),
        total
      )
      const orderId = Number((orderResult as { lastInsertRowid: number }).lastInsertRowid)

      const insertItem = database.prepare(
        `INSERT INTO order_items (order_id, product_id, product_name_snapshot, base_price_snapshot, quantity, note)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      const insertRemoved = database.prepare(
        "INSERT INTO order_item_removed_ingredients (order_item_id, ingredient_id, ingredient_name_snapshot) VALUES (?, ?, ?)"
      )
      const insertExtra = database.prepare(
        "INSERT INTO order_item_extra_ingredients (order_item_id, ingredient_id, ingredient_name_snapshot, extra_cost_snapshot) VALUES (?, ?, ?, ?)"
      )

      for (const item of data.items) {
        const itemResult = insertItem.run(
          orderId,
          item.productId,
          item.productName,
          item.basePrice,
          item.quantity,
          item.note.trim()
        )
        const itemId = Number((itemResult as { lastInsertRowid: number }).lastInsertRowid)

        for (const ri of item.removedIngredients) {
          insertRemoved.run(itemId, ri.id, ri.name)
        }
        for (const ei of item.extraIngredients) {
          insertExtra.run(itemId, ei.id, ei.name, ei.extraCost)
        }
      }

      return orderId
    })

    revalidatePath("/pedidos")
    return { success: true, orderId }
  } catch (e) {
    console.error("[createOrder]", e)
    return { error: "Error al guardar el pedido. Intenta de nuevo." }
  }
}

export async function getOrders(): Promise<Order[]> {
  try {
    return await dbTransaction((database: Database.Database) => {
      try {
        database.prepare("DELETE FROM orders WHERE created_at < datetime('now', '-30 days')").run()
      } catch (e) {
        console.error("[getOrders] Limpieza automática:", e)
      }

      const orders = database.prepare("SELECT * FROM orders ORDER BY created_at DESC").all() as Order[]

      if (orders.length === 0) return []

      const orderIds = orders.map((o) => o.id)
      const orderPlaceholders = orderIds.map(() => "?").join(", ")

      const items = database
        .prepare(
          `SELECT * FROM order_items WHERE order_id IN (${orderPlaceholders}) ORDER BY id ASC`
        )
        .all(...orderIds) as Record<string, unknown>[]

      const itemIds = items.map((i) => i.id as number)

      let removedIngs: Record<string, unknown>[] = []
      let extraIngs: Record<string, unknown>[] = []

      if (itemIds.length > 0) {
        const itemPlaceholders = itemIds.map(() => "?").join(", ")
        removedIngs = database
          .prepare(
            `SELECT * FROM order_item_removed_ingredients WHERE order_item_id IN (${itemPlaceholders})`
          )
          .all(...itemIds) as Record<string, unknown>[]
        extraIngs = database
          .prepare(
            `SELECT * FROM order_item_extra_ingredients WHERE order_item_id IN (${itemPlaceholders})`
          )
          .all(...itemIds) as Record<string, unknown>[]
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
            base_price_snapshot: Number(i.base_price_snapshot) || 0,
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
                extra_cost_snapshot: Number(e.extra_cost_snapshot) || 0,
              })),
          })),
      }))
    })
  } catch (e) {
    console.error("[getOrders]", e)
    return []
  }
}

export async function toggleDelivered(orderId: number, delivered: boolean) {
  try {
    const { changes } = await dbRunReturn(
      "UPDATE orders SET status_delivered = ? WHERE id = ?",
      [delivered ? 1 : 0, orderId]
    )
    revalidatePath("/pedidos")
    if (changes === 0) return { error: "Pedido no encontrado" }
    return { success: true }
  } catch (e) {
    console.error("[toggleDelivered]", e)
    return { error: "Error al actualizar el pedido." }
  }
}

export async function deleteOrder(id: number) {
  try {
    const { changes } = await dbRunReturn("DELETE FROM orders WHERE id = ?", [id])
    revalidatePath("/pedidos")
    if (changes === 0) return { error: "Pedido no encontrado" }
    return { success: true }
  } catch (e) {
    console.error("[deleteOrder]", e)
    return { error: "Error al eliminar el pedido." }
  }
}
