"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { formatQty } from "@/lib/utils"

type TicketItem = {
  productName: string
  quantity: number
  note: string
  removedIngredients: { name: string }[]
  extraIngredients: { name: string }[]
}

const W = 42

function center(text: string): string {
  const pad = Math.max(0, W - text.length)
  return " ".repeat(Math.floor(pad / 2)) + text
}

function sep(char = "-"): string {
  return char.repeat(W)
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
  const lines: string[] = []

  lines.push(sep("="))
  lines.push(center("C O C I N A"))
  lines.push(center(`#${orderId}`))
  lines.push(center(format(date, "dd/MM/yyyy HH:mm", { locale: es })))
  lines.push(sep("="))

  // Address
  lines.push("DIRECCION:")
  lines.push(address.street)
  if (address.floorApt) lines.push(`Piso/Dpto: ${address.floorApt}`)
  if (address.reference) lines.push(`Ref: ${address.reference}`)
  lines.push(sep("-"))

  // Items
  items.forEach((item, idx) => {
    if (idx > 0) lines.push("")
    lines.push(`${formatQty(item.quantity)}x ${item.productName}`)
    if (item.removedIngredients.length > 0) {
      lines.push(
        `   SIN: ${item.removedIngredients.map((r) => r.name).join(", ")}`
      )
    }
    if (item.extraIngredients.length > 0) {
      lines.push(
        `   EXTRA: ${item.extraIngredients.map((e) => e.name).join(", ")}`
      )
    }
    if (item.note) {
      lines.push(`   NOTA: ${item.note}`)
    }
  })

  lines.push(sep("-"))
  lines.push(center("Pizzeria Napolitana"))
  lines.push(sep("="))

  return (
    <div className="print-only">
      <pre
        style={{
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "12px",
          lineHeight: "1.5",
          margin: 0,
          whiteSpace: "pre",
          color: "black",
        }}
      >
        {lines.join("\n")}
      </pre>
    </div>
  )
}
