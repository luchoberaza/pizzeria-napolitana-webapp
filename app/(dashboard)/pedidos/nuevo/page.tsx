export const dynamic = "force-dynamic"

import { getProducts } from "@/app/(dashboard)/productos/actions"
import { getIngredients } from "@/app/(dashboard)/ingredientes/actions"
import { getTodayPizzaCounts } from "@/app/(dashboard)/pedidos/actions"
import { NewOrderClient } from "@/app/(dashboard)/pedidos/nuevo/new-order-client"

export default async function NuevoPedidoPage() {
  const [products, ingredients, pizzaCounts] = await Promise.all([
    getProducts(),
    getIngredients(),
    getTodayPizzaCounts(),
  ])
  return (
    <NewOrderClient
      products={products}
      allIngredients={ingredients}
      initialPizzaCount={pizzaCounts.pizzas}
      initialPizzetaCount={pizzaCounts.pizzetas}
    />
  )
}
