"use server"

import { dbAll, dbRun } from "@/lib/db"
import { revalidatePath } from "next/cache"

export type Product = {
  id: number
  name: string
  price: string
  created_at: string
  updated_at: string
  ingredients: { id: number; name: string; extra_cost: string }[]
}

export type ProductRow = {
  id: number
  name: string
  price: string
  created_at: string
  updated_at: string
}

export async function getProducts(): Promise<Product[]> {
  const products = await dbAll<ProductRow>("SELECT * FROM products ORDER BY name ASC")

  if (products.length === 0) return []

  const productIds = products.map((p) => p.id)
  const placeholders = productIds.map(() => "?").join(", ")

  const relations = await dbAll<{
    product_id: number
    id: number
    name: string
    extra_cost: string
  }>(
    `SELECT pi.product_id, i.id, i.name, i.extra_cost 
     FROM product_ingredients pi 
     JOIN ingredients i ON pi.ingredient_id = i.id 
     WHERE pi.product_id IN (${placeholders})
     ORDER BY i.name ASC`,
    productIds
  )

  return products.map((p) => ({
    ...p,
    ingredients: relations
      .filter((r) => r.product_id === p.id)
      .map((r) => ({
        id: r.id,
        name: r.name,
        extra_cost: r.extra_cost,
      })),
  }))
}

export async function createProduct(data: {
  name: string
  price: number
  ingredientIds: number[]
}) {
  if (!data.name.trim()) return { error: "El nombre es requerido" }
  if (data.price < 0) return { error: "El precio no puede ser negativo" }

  await dbRun(
    "INSERT INTO products (name, price) VALUES (?, ?)",
    [data.name.trim(), data.price]
  )

  const rows = await dbAll<{ id: number }>(
    "SELECT id FROM products WHERE name = ? ORDER BY id DESC LIMIT 1",
    [data.name.trim()]
  )
  const productId = rows[0].id

  for (const ingredientId of data.ingredientIds) {
    await dbRun(
      "INSERT INTO product_ingredients (product_id, ingredient_id) VALUES (?, ?)",
      [productId, ingredientId]
    )
  }

  revalidatePath("/productos")
  return { success: true }
}

export async function updateProduct(data: {
  id: number
  name: string
  price: number
  ingredientIds: number[]
}) {
  if (!data.name.trim()) return { error: "El nombre es requerido" }
  if (data.price < 0) return { error: "El precio no puede ser negativo" }

  await dbRun(
    "UPDATE products SET name = ?, price = ?, updated_at = datetime('now') WHERE id = ?",
    [data.name.trim(), data.price, data.id]
  )

  await dbRun("DELETE FROM product_ingredients WHERE product_id = ?", [data.id])

  for (const ingredientId of data.ingredientIds) {
    await dbRun(
      "INSERT INTO product_ingredients (product_id, ingredient_id) VALUES (?, ?)",
      [data.id, ingredientId]
    )
  }

  revalidatePath("/productos")
  return { success: true }
}

export async function deleteProduct(id: number) {
  await dbRun("DELETE FROM products WHERE id = ?", [id])
  revalidatePath("/productos")
  return { success: true }
}
