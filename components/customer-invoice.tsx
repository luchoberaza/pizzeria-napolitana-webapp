"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Order } from "@/app/(dashboard)/pedidos/actions"
import { formatQty } from "@/lib/utils"

const W = 42

function center(text: string): string {
  const pad = Math.max(0, W - text.length)
  return " ".repeat(Math.floor(pad / 2)) + text
}

function sep(char = "-"): string {
  return char.repeat(W)
}

function leftRight(left: string, right: string): string {
  const space = Math.max(1, W - left.length - right.length)
  return left + " ".repeat(space) + right
}

export function CustomerInvoice({ order }: { order: Order }) {
  const discount = Number(order.discount_amount) || 0
  const total = Number(order.total_snapshot) || 0

  const subtotal = order.items.reduce((sum, item) => {
    const extras = item.extra_ingredients.reduce(
      (s, e) => s + (Number(e.extra_cost_snapshot) || 0),
      0
    )
    const base = Number(item.base_price_snapshot) || 0
    return sum + (base + extras) * item.quantity
  }, 0)

  const lines: string[] = []

  // Header
  lines.push(sep("="))
  lines.push(center("PIZZERIA NAPOLITANA"))
  lines.push(sep("="))
  lines.push("")

  // Date
  const dateStr = format(
    new Date(order.created_at),
    "dd 'de' MMMM, yyyy",
    { locale: es }
  )
  lines.push(center(dateStr))
  lines.push("")
  lines.push(sep("-"))

  // Address
  lines.push("DIRECCION DE ENTREGA:")
  lines.push(order.address_street)
  if (order.address_floor_apt) {
    lines.push(`Piso/Dpto: ${order.address_floor_apt}`)
  }
  if (order.address_reference) {
    lines.push(`Ref: ${order.address_reference}`)
  }
  lines.push(sep("-"))
  lines.push("")

  // Items
  for (const item of order.items) {
    const extras = item.extra_ingredients.reduce(
      (s, e) => s + (Number(e.extra_cost_snapshot) || 0),
      0
    )
    const base = Number(item.base_price_snapshot) || 0
    const itemTotal = (base + extras) * item.quantity

    const qty = formatQty(item.quantity)
    const name = item.product_name_snapshot
    const totalStr = `$${itemTotal.toFixed(2)}`
    const prefix = `${qty}x ${name}`

    lines.push(leftRight(prefix, totalStr))

    if (item.removed_ingredients.length > 0) {
      lines.push(
        `   Sin: ${item.removed_ingredients.map((r) => r.ingredient_name_snapshot).join(", ")}`
      )
    }
    if (item.extra_ingredients.length > 0) {
      for (const e of item.extra_ingredients) {
        const cost = Number(e.extra_cost_snapshot) || 0
        lines.push(
          `   Extra: ${e.ingredient_name_snapshot} (+$${cost.toFixed(2)})`
        )
      }
    }
    if (item.note) {
      lines.push(`   * ${item.note}`)
    }
  }

  lines.push("")
  lines.push(sep("-"))

  // Totals
  lines.push(leftRight("Subtotal:", `$${subtotal.toFixed(2)}`))
  if (discount > 0) {
    let discLabel = "Descuento"
    if (order.discount_reason) {
      discLabel += ` (${order.discount_reason})`
    }
    discLabel += ":"
    lines.push(leftRight(discLabel, `-$${discount.toFixed(2)}`))
  }
  lines.push(sep("="))
  lines.push(leftRight("TOTAL:", `$${total.toFixed(2)}`))
  lines.push(sep("="))
  lines.push("")

  // Payment method
  const pm = order.payment_method || "efectivo"
  if (pm === "transferencia") {
    lines.push(sep("*"))
    lines.push(center("** PAGADO POR TRANSFERENCIA **"))
    lines.push(sep("*"))
  } else {
    const pmLabel = pm === "pos" ? "POS" : "Efectivo"
    lines.push(center(`Pago: ${pmLabel}`))
  }
  lines.push("")

  // Footer
  lines.push(center("Gracias por su preferencia"))
  lines.push(center("Pizzeria Napolitana"))
  lines.push("")

  return (
    <div className="print-only">
      <pre
        style={{
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "11px",
          lineHeight: "1.4",
          margin: 0,
          whiteSpace: "pre",
        }}
      >
        {lines.join("\n")}
      </pre>
    </div>
  )
}
