import { getProducts } from "../../productos/actions"
import { getIngredients } from "../../ingredientes/actions"
import { NewOrderClient } from "./new-order-client"

export default async function NuevoPedidoPage() {
  const [products, ingredients] = await Promise.all([
    getProducts(),
    getIngredients(),
  ])
  return <NewOrderClient products={products} allIngredients={ingredients} />
}
