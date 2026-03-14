import { getOrders, getTodayPizzaCounts } from "@/app/(dashboard)/pedidos/actions"
import { OrdersClient } from "./orders-client"

export const dynamic = "force-dynamic"

export default async function PedidosPage() {
  const [orders, pizzaCounts] = await Promise.all([
    getOrders(),
    getTodayPizzaCounts(),
  ])
  return (
    <OrdersClient
      orders={orders}
      pizzaCount={pizzaCounts.pizzas}
      pizzetaCount={pizzaCounts.pizzetas}
    />
  )
}
