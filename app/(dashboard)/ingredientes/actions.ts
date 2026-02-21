"use server"

import { dbAll, dbRun } from "@/lib/db"
import { revalidatePath } from "next/cache"

export type Ingredient = {
  id: number
  name: string
  extra_cost: string
  created_at: string
  updated_at: string
}

export async function getIngredients(): Promise<Ingredient[]> {
  return dbAll<Ingredient>("SELECT * FROM ingredients ORDER BY name ASC")
}

export async function createIngredient(formData: FormData) {
  const name = formData.get("name") as string
  const extraCost = parseFloat(formData.get("extra_cost") as string) || 0

  if (!name || name.trim().length === 0) {
    return { error: "El nombre es requerido" }
  }
  if (extraCost < 0) {
    return { error: "El costo extra no puede ser negativo" }
  }

  await dbRun(
    "INSERT INTO ingredients (name, extra_cost) VALUES (?, ?)",
    [name.trim(), extraCost]
  )
  revalidatePath("/ingredientes")
  return { success: true }
}

export async function updateIngredient(formData: FormData) {
  const id = parseInt(formData.get("id") as string)
  const name = formData.get("name") as string
  const extraCost = parseFloat(formData.get("extra_cost") as string) || 0

  if (!name || name.trim().length === 0) {
    return { error: "El nombre es requerido" }
  }
  if (extraCost < 0) {
    return { error: "El costo extra no puede ser negativo" }
  }

  await dbRun(
    "UPDATE ingredients SET name = ?, extra_cost = ?, updated_at = datetime('now') WHERE id = ?",
    [name.trim(), extraCost, id]
  )
  revalidatePath("/ingredientes")
  return { success: true }
}

export async function deleteIngredient(id: number) {
  await dbRun("DELETE FROM ingredients WHERE id = ?", [id])
  revalidatePath("/ingredientes")
  return { success: true }
}
