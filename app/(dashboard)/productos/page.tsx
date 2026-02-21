import { getProducts } from "./actions"
import { getIngredients } from "../ingredientes/actions"
import { ProductsClient } from "./products-client"

export default async function ProductosPage() {
  const [products, ingredients] = await Promise.all([
    getProducts(),
    getIngredients(),
  ])
  return <ProductsClient products={products} allIngredients={ingredients} />
}
