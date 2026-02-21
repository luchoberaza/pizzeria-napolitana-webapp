import { getProducts } from "@/app/(dashboard)/productos/actions"
import { getIngredients } from "@/app/(dashboard)/ingredientes/actions"
import { NewOrderClient } from "@/app/(dashboard)/pedidos/nuevo/new-order-client"

export default async function NuevoPedidoPage() {
  const [products, ingredients] = await Promise.all([
    getProducts(),
    getIngredients(),
  ])
  return <NewOrderClient products={products} allIngredients={ingredients} />
}
