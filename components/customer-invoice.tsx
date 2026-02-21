"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Order } from "@/app/(dashboard)/pedidos/actions"

export function CustomerInvoice({ order }: { order: Order }) {
  const discount = parseFloat(order.discount_amount)

  const subtotal = order.items.reduce((sum, item) => {
    const extras = item.extra_ingredients.reduce(
      (s, e) => s + parseFloat(e.extra_cost_snapshot),
      0
    )
    return sum + (parseFloat(item.base_price_snapshot) + extras) * item.quantity
  }, 0)

  const total = Math.max(0, subtotal - discount)

  return (
    <div className="print-only mx-auto w-full max-w-[210mm] bg-white p-8 font-sans text-black print:max-w-none print:p-0">
      {/* Logo Section - Responsive and Standard Size */}
      <div className="mb-4 flex justify-center border-b border-gray-100 pb-4 text-center">
        <img
          src="/logo.svg"
          alt="Pizzeria Napolitana"
          className="h-32 w-auto object-contain invert grayscale contrast-[200%]"
        />
      </div>

      {/* Date block - Normal text size */}
      <div className="mb-6 border-b border-gray-100 pb-2 text-center">
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          {format(new Date(order.created_at), "dd 'de' MMMM, yyyy", {
            locale: es,
          })}
        </p>
      </div>

      {/* Address */}
      <div className="border-b border-gray-200 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Direccion de entrega
        </p>
        <p className="mt-1 text-sm">
          {order.address_street}
          {order.address_floor_apt && `, Piso/Dpto: ${order.address_floor_apt}`}
        </p>
        {order.address_reference && (
          <p className="text-sm text-gray-500">
            Ref: {order.address_reference}
          </p>
        )}
      </div>

      {/* Items */}
      <div className="py-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
              <th className="pb-2">Producto</th>
              <th className="pb-2 text-center">Cant.</th>
              <th className="pb-2 text-right">Precio</th>
              <th className="pb-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => {
              const extras = item.extra_ingredients.reduce(
                (s, e) => s + parseFloat(e.extra_cost_snapshot),
                0
              )
              const itemTotal =
                (parseFloat(item.base_price_snapshot) + extras) * item.quantity

              return (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-3">
                    <p className="text-sm font-medium">
                      {item.product_name_snapshot}
                    </p>
                    {item.removed_ingredients.length > 0 && (
                      <p className="text-xs text-gray-500">
                        Sin:{" "}
                        {item.removed_ingredients
                          .map((r) => r.ingredient_name_snapshot)
                          .join(", ")}
                      </p>
                    )}
                    {item.extra_ingredients.length > 0 && (
                      <p className="text-xs text-gray-500">
                        Extra:{" "}
                        {item.extra_ingredients
                          .map(
                            (e) =>
                              `${e.ingredient_name_snapshot} (+$${parseFloat(e.extra_cost_snapshot).toFixed(2)})`
                          )
                          .join(", ")}
                      </p>
                    )}
                    {item.note && (
                      <p className="text-xs italic text-gray-400">
                        {item.note}
                      </p>
                    )}
                  </td>
                  <td className="py-3 text-center text-sm">{item.quantity}</td>
                  <td className="py-3 text-right text-sm">
                    ${(parseFloat(item.base_price_snapshot) + extras).toFixed(2)}
                  </td>
                  <td className="py-3 text-right text-sm font-medium">
                    ${itemTotal.toFixed(2)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Descuento
                {order.discount_reason && (
                  <span className="ml-1 text-xs">({order.discount_reason})</span>
                )}
              </span>
              <span className="text-green-600">-${discount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold">Total</span>
              <span className="text-2xl font-bold">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 border-t border-gray-200 pt-4 text-center">
        <p className="text-xs text-gray-400">
          Gracias por su preferencia - Pizzeria Napolitana
        </p>
      </div>
    </div>
  )
}
