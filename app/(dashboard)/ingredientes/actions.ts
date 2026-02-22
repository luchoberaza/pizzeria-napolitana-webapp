"use server"

import { dbAll, dbRun, dbRunReturn } from "@/lib/db"
import { revalidatePath, unstable_noStore } from "next/cache"

export type Ingredient = {
  id: number
  name: string
  extra_cost: string
  created_at: string
  updated_at: string
}

export async function getIngredients(): Promise<Ingredient[]> {
  unstable_noStore()
  try {
    return await dbAll<Ingredient>("SELECT * FROM ingredients ORDER BY name ASC")
  } catch (e) {
    console.error("[getIngredients]", e)
    return []
  }
}

export async function createIngredient(formData: FormData) {
  try {
    const name = (formData.get("name") as string)?.trim()
    const extraCost = parseFloat(formData.get("extra_cost") as string) || 0

    if (!name || name.length === 0) {
      return { error: "El nombre es requerido" }
    }
    if (extraCost < 0) {
      return { error: "El costo extra no puede ser negativo" }
    }

    await dbRun(
      "INSERT INTO ingredients (name, extra_cost) VALUES (?, ?)",
      [name, extraCost]
    )
    revalidatePath("/ingredientes")
    revalidatePath("/productos")
    revalidatePath("/pedidos/nuevo")
    return { success: true }
  } catch (e) {
    console.error("[createIngredient]", e)
    return { error: "Error al crear el ingrediente." }
  }
}

export async function updateIngredient(formData: FormData) {
  try {
    const idRaw = formData.get("id") as string
    const id = parseInt(idRaw, 10)
    if (isNaN(id)) return { error: "ID de ingrediente inválido" }

    const name = (formData.get("name") as string)?.trim()
    const extraCost = parseFloat(formData.get("extra_cost") as string) || 0

    if (!name || name.length === 0) {
      return { error: "El nombre es requerido" }
    }
    if (extraCost < 0) {
      return { error: "El costo extra no puede ser negativo" }
    }

    const { changes } = await dbRunReturn(
      "UPDATE ingredients SET name = ?, extra_cost = ?, updated_at = datetime('now') WHERE id = ?",
      [name, extraCost, id]
    )
    revalidatePath("/ingredientes")
    revalidatePath("/productos")
    revalidatePath("/pedidos/nuevo")
    if (changes === 0) return { error: "Ingrediente no encontrado" }
    return { success: true }
  } catch (e) {
    console.error("[updateIngredient]", e)
    return { error: "Error al actualizar el ingrediente." }
  }
}

export async function deleteIngredient(id: number) {
  try {
    const { changes } = await dbRunReturn("DELETE FROM ingredients WHERE id = ?", [id])
    revalidatePath("/ingredientes")
    revalidatePath("/productos")
    revalidatePath("/pedidos/nuevo")
    if (changes === 0) return { error: "Ingrediente no encontrado" }
    return { success: true }
  } catch (e) {
    console.error("[deleteIngredient]", e)
    return { error: "Error al eliminar el ingrediente." }
  }
}
