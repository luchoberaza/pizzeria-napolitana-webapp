"use server"

import { dbAll, dbRun, dbRunReturn } from "@/lib/db"
import { revalidatePath, unstable_noStore } from "next/cache"

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
  unstable_noStore()
  try {
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
  } catch (e) {
    console.error("[getProducts]", e)
    return []
  }
}

export async function createProduct(data: {
  name: string
  price: number
  ingredientIds: number[]
}) {
  try {
    if (!data.name.trim()) return { error: "El nombre es requerido" }
    if (data.price < 0) return { error: "El precio no puede ser negativo" }

    const { lastInsertRowid: productId } = await dbRunReturn(
      "INSERT INTO products (name, price) VALUES (?, ?)",
      [data.name.trim(), data.price]
    )

    for (const ingredientId of data.ingredientIds) {
      await dbRun(
        "INSERT INTO product_ingredients (product_id, ingredient_id) VALUES (?, ?)",
        [productId, ingredientId]
      )
    }

    revalidatePath("/productos")
    revalidatePath("/pedidos/nuevo")
    return { success: true }
  } catch (e) {
    console.error("[createProduct]", e)
    return { error: "Error al crear el producto." }
  }
}

export async function updateProduct(data: {
  id: number
  name: string
  price: number
  ingredientIds: number[]
}) {
  try {
    if (!data.name.trim()) return { error: "El nombre es requerido" }
    if (data.price < 0) return { error: "El precio no puede ser negativo" }

    const { changes } = await dbRunReturn(
      "UPDATE products SET name = ?, price = ?, updated_at = datetime('now') WHERE id = ?",
      [data.name.trim(), data.price, data.id]
    )
    if (changes === 0) return { error: "Producto no encontrado" }

    await dbRun("DELETE FROM product_ingredients WHERE product_id = ?", [data.id])

    for (const ingredientId of data.ingredientIds) {
      await dbRun(
        "INSERT INTO product_ingredients (product_id, ingredient_id) VALUES (?, ?)",
        [data.id, ingredientId]
      )
    }

    revalidatePath("/productos")
    revalidatePath("/pedidos/nuevo")
    return { success: true }
  } catch (e) {
    console.error("[updateProduct]", e)
    return { error: "Error al actualizar el producto." }
  }
}

export async function deleteProduct(id: number) {
  try {
    const { changes } = await dbRunReturn("DELETE FROM products WHERE id = ?", [id])
    revalidatePath("/productos")
    revalidatePath("/pedidos/nuevo")
    if (changes === 0) return { error: "Producto no encontrado" }
    return { success: true }
  } catch (e) {
    console.error("[deleteProduct]", e)
    return { error: "Error al eliminar el producto." }
  }
}
