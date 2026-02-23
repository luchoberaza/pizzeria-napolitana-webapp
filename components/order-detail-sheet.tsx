"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { MapPin, CalendarDays, ShoppingBag, Tag } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Order } from "@/app/(dashboard)/pedidos/actions"

export function OrderDetailSheet({
  order,
  open,
  onOpenChange,
}: {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!order) return null

  const discount = Number(order.discount_amount) || 0
  const total = Number(order.total_snapshot) || 0

  const subtotal = order.items.reduce((sum, item) => {
    const extras = item.extra_ingredients.reduce(
      (s, e) => s + e.extra_cost_snapshot,
      0
    )
    return sum + (item.base_price_snapshot + extras) * item.quantity
  }, 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-foreground">
            Pedido{" "}
            <span className="text-napoli-orange">#{order.id}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-5 py-4">
          {/* Date */}
          <div className="flex items-center gap-2 rounded-lg bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4 shrink-0 text-napoli-orange" />
            <span>
              {format(
                new Date(order.created_at),
                "d 'de' MMMM yyyy, HH:mm",
                { locale: es }
              )}
            </span>
          </div>

          {/* Address */}
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              Dirección
            </h3>
            <div className="mt-2 rounded-lg bg-secondary/40 px-3 py-2">
              <p className="text-sm font-medium text-foreground">
                {order.address_street}
              </p>
              {order.address_floor_apt && (
                <p className="text-sm text-muted-foreground">
                  {order.address_floor_apt}
                </p>
              )}
              {order.address_reference && (
                <p className="mt-0.5 text-xs italic text-muted-foreground">
                  Ref: {order.address_reference}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Products */}
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <ShoppingBag className="h-3.5 w-3.5" />
              Productos
            </h3>
            <div className="mt-2 space-y-3">
              {order.items.map((item) => {
                const extrasTotal = item.extra_ingredients.reduce(
                  (s, e) => s + e.extra_cost_snapshot,
                  0
                )
                const itemTotal =
                  (item.base_price_snapshot + extrasTotal) * item.quantity

                return (
                  <div
                    key={item.id}
                    className="rounded-lg border bg-card p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {item.quantity}x {item.product_name_snapshot}
                      </span>
                      <span className="shrink-0 text-sm font-bold text-foreground">
                        ${itemTotal.toFixed(2)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Precio base: ${item.base_price_snapshot.toFixed(2)} c/u
                    </p>

                    {item.removed_ingredients.length > 0 && (
                      <p className="mt-1.5 text-xs text-destructive">
                        <span className="font-medium">Sin: </span>
                        {item.removed_ingredients
                          .map((r) => r.ingredient_name_snapshot)
                          .join(", ")}
                      </p>
                    )}

                    {item.extra_ingredients.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {item.extra_ingredients.map((e) => (
                          <Badge
                            key={e.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            +{e.ingredient_name_snapshot} ($
                            {e.extra_cost_snapshot.toFixed(2)})
                          </Badge>
                        ))}
                      </div>
                    )}

                    {item.note && (
                      <p className="mt-1.5 text-xs italic text-muted-foreground">
                        &ldquo;{item.note}&rdquo;
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">${subtotal.toFixed(2)}</span>
            </div>

            {discount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-napoli-green">
                  <Tag className="h-3.5 w-3.5" />
                  Descuento
                  {order.discount_reason && (
                    <span className="text-xs text-muted-foreground">
                      ({order.discount_reason})
                    </span>
                  )}
                </span>
                <span className="text-napoli-green">-${discount.toFixed(2)}</span>
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between pt-1">
              <span className="text-base font-semibold text-foreground">
                Total
              </span>
              <span className="text-2xl font-bold text-foreground">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
