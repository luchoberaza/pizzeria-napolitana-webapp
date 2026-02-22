import { getIngredients } from "@/app/(dashboard)/ingredientes/actions"
import { IngredientsClient } from "@/app/(dashboard)/ingredientes/ingredients-client"

export const dynamic = "force-dynamic"

export default async function IngredientesPage() {
  const ingredients = await getIngredients()
  return <IngredientsClient ingredients={ingredients} />
}
