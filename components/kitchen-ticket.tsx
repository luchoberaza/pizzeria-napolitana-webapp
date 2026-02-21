"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"

type TicketItem = {
  productName: string
  quantity: number
  note: string
  removedIngredients: { name: string }[]
  extraIngredients: { name: string }[]
}

export function KitchenTicket({
  orderId,
  date,
  address,
  items,
}: {
  orderId: number
  date: Date
  address: { street: string; floorApt: string; reference: string }
  items: TicketItem[]
}) {
  return (
    <div className="print-only mx-auto w-full max-w-[80mm] bg-white p-4 font-mono text-black print:max-w-none print:p-0">
      <div className="border-b-2 border-dashed border-black pb-3 text-center">
        <h1 className="text-2xl font-bold">COCINA</h1>
        <p className="mt-1 text-3xl font-black">#{orderId}</p>
        <p className="mt-1 text-sm">
          {format(date, "dd/MM/yyyy HH:mm", { locale: es })}
        </p>
      </div>

      <div className="border-b-2 border-dashed border-black py-3">
        <p className="text-sm font-bold uppercase">DIRECCION:</p>
        <p className="text-sm">
          {address.street}
        </p>
        {address.floorApt && (
          <p className="text-sm">Piso/Dpto: {address.floorApt}</p>
        )}
        {address.reference && (
          <p className="text-sm">Ref: {address.reference}</p>
        )}
      </div>

      <div className="py-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`${idx > 0 ? "mt-3 border-t border-dashed border-gray-400 pt-3" : ""}`}
          >
            <p className="text-base font-bold">
              {item.quantity}x {item.productName}
            </p>
            {item.removedIngredients.length > 0 && (
              <p className="ml-2 text-sm font-bold">
                SIN: {item.removedIngredients.map((r) => r.name).join(", ")}
              </p>
            )}
            {item.extraIngredients.length > 0 && (
              <p className="ml-2 text-sm font-bold">
                EXTRA: {item.extraIngredients.map((e) => e.name).join(", ")}
              </p>
            )}
            {item.note && (
              <p className="ml-2 text-sm italic">NOTA: {item.note}</p>
            )}
          </div>
        ))}
      </div>

      <div className="border-t-2 border-dashed border-black pt-3 text-center">
        <p className="text-xs">Pizzeria Napolitana</p>
      </div>
    </div>
  )
}
