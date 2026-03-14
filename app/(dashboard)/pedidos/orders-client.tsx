"use client"

import { useState, useTransition } from "react"
import { format, isToday, isYesterday, getYear } from "date-fns"
import { es } from "date-fns/locale"
import {
  Search,
  Printer,
  ClipboardList,
  CheckCircle2,
  Clock,
  MapPin,
  Trash2,
  CalendarDays,
  Eye,
  Banknote,
  CreditCard,
  ArrowRightLeft,
} from "lucide-react"
import { cn, formatQty } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { type Order, toggleDelivered, deleteOrder } from "@/app/(dashboard)/pedidos/actions"
import { CustomerInvoice } from "@/components/customer-invoice"
import { printReceipt } from "@/lib/print-image"
import { OrderDetailSheet } from "@/components/order-detail-sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function OrdersClient({ orders, pizzaCount, pizzetaCount, mediaCount }: { orders: Order[]; pizzaCount: number; pizzetaCount: number; mediaCount: number }) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "pending" | "delivered">("all")
  const [isPending, startTransition] = useTransition()
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null)
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)

  const filtered = orders.filter((order) => {
    const orderDate = new Date(order.created_at.replace(' ', 'T') + 'Z')
    const formattedDate = format(orderDate, "d 'de' MMMM yyyy", { locale: es }).toLowerCase()

    const matchesSearch =
      order.id.toString().includes(search) ||
      order.address_street.toLowerCase().includes(search.toLowerCase()) ||
      formattedDate.includes(search.toLowerCase()) ||
      // Also match simple day number if search is just a number
      orderDate.getDate().toString() === search

    const matchesFilter =
      filter === "all" ||
      (filter === "pending" && !order.status_delivered) ||
      (filter === "delivered" && order.status_delivered)

    return matchesSearch && matchesFilter
  })

  // Grouping logic
  const currentYear = getYear(new Date())

  const groups = filtered.reduce((acc, order) => {
    const date = new Date(order.created_at.replace(' ', 'T') + 'Z')
    let title = ""

    if (isToday(date)) {
      title = "Hoy"
    } else if (isYesterday(date)) {
      title = "Ayer"
    } else {
      const orderYear = getYear(date)
      if (orderYear !== currentYear) {
        title = format(date, "yyyy - d 'de' MMMM", { locale: es })
      } else {
        title = format(date, "d 'de' MMMM", { locale: es })
      }
    }

    if (!acc[title]) {
      acc[title] = []
    }
    acc[title].push(order)
    return acc
  }, {} as Record<string, Order[]>)

  const groupTitles = Object.keys(groups)

  function handleToggleDelivered(orderId: number, delivered: boolean) {
    startTransition(async () => {
      try {
        const result = await toggleDelivered(orderId, delivered)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success(
            delivered ? "Pedido marcado como enviado" : "Pedido marcado como pendiente"
          )
        }
      } catch {
        toast.error("Error al actualizar el pedido")
      }
    })
  }

  async function handlePrint(order: Order) {
    setPrintingOrder(order)
    // Wait for React to render the CustomerInvoice into the DOM
    await new Promise((r) => setTimeout(r, 300))
    try {
      printReceipt()
    } catch (e) {
      console.error("[print]", e)
      toast.error("Error al imprimir la factura")
    }
  }

  function handleDelete() {
    if (!orderToDelete) return
    startTransition(async () => {
      try {
        const result = await deleteOrder(orderToDelete)
        if (result.error) {
          toast.error(result.error)
          setOrderToDelete(null)
          return
        }
        if (result.success) {
          toast.success("Pedido eliminado correctamente")
          setOrderToDelete(null)
        }
      } catch {
        toast.error("Error al eliminar el pedido")
      }
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Historial y seguimiento de pedidos
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 shadow-sm">
              <span className="text-xs font-medium text-muted-foreground">Pizzas hoy:</span>
              <span className="text-sm font-bold text-napoli-orange">{pizzaCount}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 shadow-sm">
              <span className="text-xs font-medium text-muted-foreground">Medias hoy:</span>
              <span className="text-sm font-bold text-napoli-orange">{mediaCount}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 shadow-sm">
              <span className="text-xs font-medium text-muted-foreground">Pizzetas hoy:</span>
              <span className="text-sm font-bold text-napoli-orange">{pizzetaCount}</span>
            </div>
          </div>
          <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className={
              filter === "all"
                ? "bg-primary text-primary-foreground hover:bg-napoli-red-dark"
                : ""
            }
          >
            Todos
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("pending")}
            className={
              filter === "pending"
                ? "bg-napoli-orange text-white hover:bg-napoli-orange/90"
                : ""
            }
          >
            <Clock className="mr-1 h-3.5 w-3.5" />
            Pendientes
          </Button>
          <Button
            variant={filter === "delivered" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("delivered")}
            className={
              filter === "delivered"
                ? "bg-napoli-green text-white hover:bg-napoli-green/90"
                : ""
            }
          >
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            Enviados
          </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mt-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por folio o dirección..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            {search || filter !== "all" ? "Sin resultados" : "Sin pedidos"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search || filter !== "all"
              ? "No se encontraron pedidos con ese criterio"
              : "Los pedidos aparecerán aquí"}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-10">
          {groupTitles.map((title) => {
            // Count pizzas/medias/pizzetas for this day group
            let dayPizzas = 0
            let dayMedias = 0
            let dayPizzetas = 0
            for (const order of groups[title]) {
              for (const item of order.items) {
                const name = item.product_name_snapshot.toLowerCase()
                if (name.includes("pizzeta")) {
                  dayPizzetas += item.quantity
                } else if (name.includes("media")) {
                  dayMedias += item.quantity
                } else if (name.includes("pizza")) {
                  dayPizzas += item.quantity
                }
              }
            }

            return (
            <div key={title} className="space-y-4">
              {/* Group Title */}
              <div className="sticky top-0 z-10 -mx-4 bg-background/95 px-4 py-2 backdrop-blur-sm sm:mx-0 sm:px-0">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    {title}
                  </h2>
                  <div className="h-px flex-1 bg-border/60" />
                  <Badge variant="outline" className="bg-secondary/30 font-mono text-[10px]">
                    {groups[title].length} {groups[title].length === 1 ? 'PEDIDO' : 'PEDIDOS'}
                  </Badge>
                </div>
                {(dayPizzas > 0 || dayMedias > 0 || dayPizzetas > 0) && (
                  <div className="mt-1.5 flex items-center gap-2">
                    {dayPizzas > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        Pizzas: <span className="font-semibold text-napoli-orange">{dayPizzas}</span>
                      </span>
                    )}
                    {dayMedias > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        Medias: <span className="font-semibold text-napoli-orange">{dayMedias}</span>
                      </span>
                    )}
                    {dayPizzetas > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        Pizzetas: <span className="font-semibold text-napoli-orange">{dayPizzetas}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Group Orders */}
              <div className="space-y-4">
                {groups[title].map((order) => {
                  const discount = Number(order.discount_amount) || 0
                  const total = Number(order.total_snapshot) || 0

                  return (
                    <div
                      key={order.id}
                      className={cn(
                        "rounded-xl p-5 shadow-sm transition-all duration-300 border-l-4 border-2",
                        order.status_delivered
                          ? "bg-red-100 border-red-400 border-l-napoli-red dark:bg-red-500/30 dark:border-red-400 dark:border-l-napoli-red"
                          : "bg-white dark:bg-card border-gray-300 dark:border-gray-700 border-l-napoli-orange"
                      )}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          {/* Header row */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="secondary"
                              className={
                                order.status_delivered
                                  ? "bg-napoli-red text-white shadow-md hover:bg-napoli-red ring-2 ring-napoli-red/20"
                                  : "bg-napoli-orange/10 text-napoli-orange"
                              }
                            >
                              {order.status_delivered ? "Enviado" : "Pendiente"}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                order.payment_method === "transferencia"
                                  ? "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                                  : order.payment_method === "pos"
                                  ? "border-purple-400 bg-purple-50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300"
                                  : "border-green-400 bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-300"
                              )}
                            >
                              {order.payment_method === "transferencia" && <ArrowRightLeft className="mr-1 h-3 w-3" />}
                              {order.payment_method === "pos" && <CreditCard className="mr-1 h-3 w-3" />}
                              {(order.payment_method === "efectivo" || !order.payment_method) && <Banknote className="mr-1 h-3 w-3" />}
                              {order.payment_method === "transferencia" ? "Transferencia" : order.payment_method === "pos" ? "POS" : "Efectivo"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(
                                new Date(order.created_at.replace(' ', 'T') + 'Z'),
                                "HH:mm",
                                { locale: es }
                              )}
                            </span>
                          </div>

                          {/* Address */}
                          <div className="mt-2 flex items-start gap-1.5">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              {order.address_street}
                              {order.address_floor_apt &&
                                `, ${order.address_floor_apt}`}
                            </p>
                          </div>

                          {/* Items summary */}
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {order.items.map((item) => (
                              <Badge
                                key={item.id}
                                variant="outline"
                                className="text-xs font-normal text-foreground"
                              >
                                {formatQty(item.quantity)}x {item.product_name_snapshot}
                              </Badge>
                            ))}
                          </div>

                          {/* Discount */}
                          {discount > 0 && (
                            <p className="mt-1 text-xs text-napoli-green">
                              Descuento: -${discount.toFixed(2)}
                              {order.discount_reason &&
                                ` (${order.discount_reason})`}
                            </p>
                          )}
                        </div>

                        {/* Right side: total + actions */}
                        <div className="flex flex-row items-center gap-4 sm:flex-col sm:items-end sm:gap-3">
                          <p className="text-xl font-bold text-foreground">
                            ${total.toFixed(2)}
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                              <Checkbox
                                id={`delivered-${order.id}`}
                                checked={!!order.status_delivered}
                                onCheckedChange={(checked) =>
                                  handleToggleDelivered(order.id, checked as boolean)
                                }
                                disabled={isPending}
                                aria-label="Marcar como enviado"
                              />
                              <label
                                htmlFor={`delivered-${order.id}`}
                                className="text-xs text-muted-foreground"
                              >
                                Enviado
                              </label>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDetailOrder(order)}
                              className="h-8"
                            >
                              <Eye className="mr-1 h-3.5 w-3.5" />
                              Detalles
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePrint(order)}
                              className="h-8"
                            >
                              <Printer className="mr-1 h-3.5 w-3.5" />
                              Factura
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setOrderToDelete(order.id)}
                              className="h-8 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            )
          })}
        </div>
      )}

      {/* Order Detail Sheet */}
      <OrderDetailSheet
        order={detailOrder}
        open={detailOrder !== null}
        onOpenChange={(open) => { if (!open) setDetailOrder(null) }}
      />

      {/* Print template (visible only via @media print) */}
      <div>
        {printingOrder && <CustomerInvoice order={printingOrder} />}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog
        open={orderToDelete !== null}
        onOpenChange={(open) => !open && setOrderToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el
              pedido de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
