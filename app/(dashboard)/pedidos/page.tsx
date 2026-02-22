import { getOrders } from "@/app/(dashboard)/pedidos/actions"
import { OrdersClient } from "./orders-client"

export const dynamic = "force-dynamic"

export default async function PedidosPage() {
  const orders = await getOrders()
  return <OrdersClient orders={orders} />
}
