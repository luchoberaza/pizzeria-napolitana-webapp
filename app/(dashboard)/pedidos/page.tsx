import { getOrders } from "./actions"
import { OrdersClient } from "./orders-client"

export default async function PedidosPage() {
  const orders = await getOrders()
  return <OrdersClient orders={orders} />
}
