"use client"

import { useState, useTransition, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Minus,
  Pencil,
  Trash2,
  MapPin,
  ShoppingCart,
  Printer,
  Tag,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import type { Product } from "../../productos/actions"
import type { Ingredient } from "../../ingredientes/actions"
import { createOrder, type OrderItem } from "@/app/(dashboard)/pedidos/actions"
import { OrderItemEditor } from "@/components/order-item-editor"
import { KitchenTicket } from "@/components/kitchen-ticket"

type CartItem = {
  id: string
  productId: number
  productName: string
  basePrice: number
  quantity: number
  note: string
  baseIngredients: { id: number; name: string }[]
  removedIngredients: { id: number; name: string }[]
  extraIngredients: { id: number; name: string; extraCost: number }[]
}

export function NewOrderClient({
  products,
  allIngredients,
}: {
  products: Product[]
  allIngredients: Ingredient[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const printRef = useRef<HTMLDivElement>(null)

  // Cart
  const [cart, setCart] = useState<CartItem[]>([])
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [productSearch, setProductSearch] = useState("")

  const editingItem = editingItemId ? cart.find((i) => i.id === editingItemId) ?? null : null

  // Address
  const [address, setAddress] = useState("")
  const [floorApt, setFloorApt] = useState("")
  const [reference, setReference] = useState("")

  // Discount
  const [discountAmount, setDiscountAmount] = useState("")
  const [discountReason, setDiscountReason] = useState("")

  // Saved order for print
  const [savedOrderId, setSavedOrderId] = useState<number | null>(null)
  const [printOrderId, setPrintOrderId] = useState<number | null>(null)

  // Fire print AFTER React has committed KitchenTicket to the DOM.
  // useEffect runs post-commit, so the element is guaranteed to exist.
  // Navigate only after the user closes the print dialog (afterprint event).
  useEffect(() => {
    if (printOrderId === null) return
    const onAfterPrint = () => {
      toast.success(`Pedido #${printOrderId} creado exitosamente`)
      router.push("/pedidos")
    }
    window.addEventListener("afterprint", onAfterPrint, { once: true })
    window.print()
    return () => window.removeEventListener("afterprint", onAfterPrint)
  }, [printOrderId, router])

  function addProduct(product: Product) {
    const newItem: CartItem = {
      id: crypto.randomUUID(),
      productId: product.id,
      productName: product.name,
      basePrice: parseFloat(product.price) || 0,
      quantity: 1,
      note: "",
      baseIngredients: product.ingredients.map((i) => ({
        id: i.id,
        name: i.name,
      })),
      removedIngredients: [],
      extraIngredients: [],
    }
    setCart((prev) => [...prev, newItem])
  }

  function updateCartItem(updatedItem: CartItem) {
    setCart((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    )
  }

  function removeCartItem(id: string) {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  function changeQuantity(id: string, delta: number) {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const newQty = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQty }
      })
    )
  }

  // Calculations
  const subtotal = cart.reduce((sum, item) => {
    const extras = item.extraIngredients.reduce((s, e) => s + e.extraCost, 0)
    return sum + (item.basePrice + extras) * item.quantity
  }, 0)
  const discount = parseFloat(discountAmount) || 0
  const total = Math.max(0, subtotal - discount)

  const handleSubmit = useCallback(async () => {
    if (cart.length === 0) {
      toast.error("Agrega al menos un item al pedido")
      return
    }
    if (!address.trim()) {
      toast.error("La dirección es requerida")
      return
    }

    const orderData = {
      addressStreet: address,
      addressFloorApt: floorApt,
      addressReference: reference,
      discountAmount: discount,
      discountReason,
      items: cart.map(
        (item): OrderItem => ({
          productId: item.productId,
          productName: item.productName,
          basePrice: item.basePrice,
          quantity: item.quantity,
          note: item.note,
          removedIngredients: item.removedIngredients,
          extraIngredients: item.extraIngredients,
        })
      ),
    }

    startTransition(async () => {
      const result = await createOrder(orderData)
      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.orderId) {
        setSavedOrderId(result.orderId)
        // Trigger print via useEffect (fires after KitchenTicket renders in DOM)
        setPrintOrderId(result.orderId)
      }
    })
  }, [cart, address, floorApt, reference, discount, discountReason, router])

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nuevo Pedido</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Selecciona productos, personaliza y confirma
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Left: Product selector + cart */}
        <div className="lg:col-span-3 space-y-6">
          {/* Product selector */}
          <section className="glass rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex shrink-0 items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <ShoppingCart className="h-4 w-4" />
                Productos
              </h2>
              <div className="relative w-40 sm:w-52">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="h-7 pl-8 text-xs"
                />
              </div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {products
                .filter((p) =>
                  p.name.toLowerCase().includes(productSearch.toLowerCase())
                )
                .map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addProduct(product)}
                  className="flex items-center justify-between rounded-lg border bg-card p-3 text-left transition-all duration-200 hover:border-napoli-orange hover:shadow-sm"
                >
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      {product.name}
                    </span>
                    {product.ingredients.length > 0 && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {product.ingredients.map((i) => i.name).join(", ")}
                      </p>
                    )}
                  </div>
                  <span className="ml-2 text-sm font-bold text-napoli-orange">
                    ${parseFloat(product.price).toFixed(2)}
                  </span>
                </button>
              ))}
              {products.length === 0 && (
                <p className="col-span-2 py-4 text-center text-sm text-muted-foreground">
                  No hay productos. Crea productos primero.
                </p>
              )}
              {products.length > 0 &&
                products.filter((p) =>
                  p.name.toLowerCase().includes(productSearch.toLowerCase())
                ).length === 0 && (
                  <p className="col-span-2 py-4 text-center text-sm text-muted-foreground">
                    Sin resultados para &ldquo;{productSearch}&rdquo;
                  </p>
                )}
            </div>
          </section>

          {/* Cart items */}
          {cart.length > 0 && (
            <section className="glass rounded-xl p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <ShoppingCart className="h-4 w-4" />
                Items del pedido ({cart.length})
              </h2>
              <div className="mt-3 space-y-3">
                {cart.map((item) => {
                  const extras = item.extraIngredients.reduce(
                    (s, e) => s + e.extraCost,
                    0
                  )
                  const itemTotal = (item.basePrice + extras) * item.quantity

                  return (
                    <div
                      key={item.id}
                      className="rounded-lg border bg-card p-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-foreground">
                            {item.productName}
                          </h3>
                          {item.removedIngredients.length > 0 && (
                            <p className="mt-0.5 text-xs text-destructive">
                              Sin:{" "}
                              {item.removedIngredients
                                .map((r) => r.name)
                                .join(", ")}
                            </p>
                          )}
                          {item.extraIngredients.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {item.extraIngredients.map((e, idx) => (
                                <Badge
                                  key={`extra-${e.id}-${idx}`}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  +{e.name} (${e.extraCost.toFixed(2)})
                                </Badge>
                              ))}
                            </div>
                          )}
                          {item.note && (
                            <p className="mt-0.5 text-xs italic text-muted-foreground">
                              {item.note}
                            </p>
                          )}
                        </div>
                        <p className="ml-3 text-sm font-bold text-foreground">
                          ${itemTotal.toFixed(2)}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => changeQuantity(item.id, -1)}
                            className="flex h-7 w-7 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-secondary"
                            disabled={item.quantity <= 1}
                            aria-label="Disminuir cantidad"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium text-foreground">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => changeQuantity(item.id, 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-secondary"
                            aria-label="Aumentar cantidad"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingItemId(item.id)}
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            aria-label="Editar item"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeCartItem(item.id)}
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Eliminar item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        {/* Right: Address, discount, summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Address */}
          <section className="glass rounded-xl p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Dirección
            </h2>
            <div className="mt-3 space-y-3">
              <div>
                <Label htmlFor="address" className="text-xs text-foreground">Dirección completa</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Av. Italia 1234, Malvín"
                  required
                />
              </div>
              <div>
                <Label htmlFor="floor" className="text-xs text-foreground">Piso/Dpto (opcional)</Label>
                <Input
                  id="floor"
                  value={floorApt}
                  onChange={(e) => setFloorApt(e.target.value)}
                  placeholder="2B"
                />
              </div>
              <div>
                <Label htmlFor="ref" className="text-xs text-foreground">Referencia (opcional)</Label>
                <Textarea
                  id="ref"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Portería verde, al lado del kiosko"
                  rows={2}
                />
              </div>
            </div>
          </section>

          {/* Discount */}
          <section className="glass rounded-xl p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <Tag className="h-4 w-4" />
              Descuento
            </h2>
            <div className="mt-3 space-y-3">
              <div>
                <Label htmlFor="discount" className="text-xs text-foreground">
                  Monto ($)
                </Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="discount-reason" className="text-xs text-foreground">
                  Motivo (opcional)
                </Label>
                <Input
                  id="discount-reason"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="Ej: Cliente frecuente"
                />
              </div>
            </div>
          </section>

          {/* Summary */}
          <section className="glass rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Resumen
            </h2>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-napoli-green">Descuento</span>
                  <span className="font-medium text-napoli-green">
                    -${discount.toFixed(2)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-foreground">Total</span>
                <span className="text-2xl font-bold text-foreground">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          </section>

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={isPending || cart.length === 0}
            className="w-full bg-primary py-6 text-base font-semibold text-primary-foreground hover:bg-napoli-red-dark"
            size="lg"
          >
            <Printer className="mr-2 h-5 w-5" />
            {isPending ? "Guardando..." : "Imprimir + Guardar"}
          </Button>
        </div>
      </div>

      {/* Item Editor Sheet */}
      {editingItem && (
        <OrderItemEditor
          key={editingItem.id}
          item={editingItem}
          allIngredients={allIngredients}
          open={editingItemId !== null}
          onOpenChange={(open) => { if (!open) setEditingItemId(null) }}
          onSave={updateCartItem}
        />
      )}

      {/* Hidden print template */}
      <div ref={printRef}>
        {savedOrderId && (
          <KitchenTicket
            orderId={savedOrderId}
            date={new Date()}
            address={{
              street: address,
              floorApt,
              reference,
            }}
            items={cart.map((item) => ({
              productName: item.productName,
              quantity: item.quantity,
              note: item.note,
              removedIngredients: item.removedIngredients,
              extraIngredients: item.extraIngredients,
            }))}
          />
        )}
      </div>
    </div>
  )
}
