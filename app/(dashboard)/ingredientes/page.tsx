import { getIngredients } from "./actions"
import { IngredientsClient } from "./ingredients-client"

export default async function IngredientesPage() {
  const ingredients = await getIngredients()
  return <IngredientsClient ingredients={ingredients} />
}
