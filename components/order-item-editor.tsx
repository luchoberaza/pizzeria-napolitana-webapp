"use client"

import { useState } from "react"
import { X, Search, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { Ingredient } from "@/app/(dashboard)/ingredientes/actions"

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

export function OrderItemEditor({
  item,
  allIngredients,
  open,
  onOpenChange,
  onSave,
}: {
  item: CartItem
  allIngredients: Ingredient[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (item: CartItem) => void
}) {
  const [editItem, setEditItem] = useState<CartItem>(item)
  const [extraSearch, setExtraSearch] = useState("")

  // Reset state when opened with new item
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setEditItem(item)
      setExtraSearch("")
    }
    onOpenChange(isOpen)
  }

  const availableExtras = allIngredients.filter(
    (ing) =>
      !editItem.extraIngredients.some((e) => e.id === ing.id) &&
      ing.name.toLowerCase().includes(extraSearch.toLowerCase())
  )

  function toggleRemoved(ing: { id: number; name: string }) {
    setEditItem((prev) => {
      const isRemoved = prev.removedIngredients.some((r) => r.id === ing.id)
      return {
        ...prev,
        removedIngredients: isRemoved
          ? prev.removedIngredients.filter((r) => r.id !== ing.id)
          : [...prev.removedIngredients, ing],
      }
    })
  }

  function addExtra(ing: Ingredient) {
    setEditItem((prev) => ({
      ...prev,
      extraIngredients: [
        ...prev.extraIngredients,
        {
          id: ing.id,
          name: ing.name,
          extraCost: parseFloat(ing.extra_cost),
        },
      ],
    }))
    setExtraSearch("")
  }

  function removeExtra(id: number) {
    setEditItem((prev) => ({
      ...prev,
      extraIngredients: prev.extraIngredients.filter((e) => e.id !== id),
    }))
  }

  const itemExtrasTotal = editItem.extraIngredients.reduce(
    (s, e) => s + e.extraCost,
    0
  )
  const itemTotal = (editItem.basePrice + itemExtrasTotal) * editItem.quantity

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-foreground">Editar: {editItem.productName}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-6 py-4">
          {/* Quantity */}
          <div>
            <Label className="text-sm font-medium text-foreground">Cantidad</Label>
            <div className="mt-2 flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 bg-transparent"
                onClick={() =>
                  setEditItem((p) => ({
                    ...p,
                    quantity: Math.max(1, p.quantity - 1),
                  }))
                }
                disabled={editItem.quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center text-lg font-semibold text-foreground">
                {editItem.quantity}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 bg-transparent"
                onClick={() =>
                  setEditItem((p) => ({ ...p, quantity: p.quantity + 1 }))
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Base ingredients toggles */}
          {editItem.baseIngredients.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-foreground">
                Ingredientes Base
              </Label>
              <p className="mb-2 text-xs text-muted-foreground">
                Desactiva los que no se incluyan (no afecta precio)
              </p>
              <div className="space-y-2">
                {editItem.baseIngredients.map((ing) => {
                  const isRemoved = editItem.removedIngredients.some(
                    (r) => r.id === ing.id
                  )
                  return (
                    <div
                      key={ing.id}
                      className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
                    >
                      <span
                        className={`text-sm ${isRemoved ? "text-muted-foreground line-through" : "text-foreground"}`}
                      >
                        {ing.name}
                      </span>
                      <Switch
                        checked={!isRemoved}
                        onCheckedChange={() => toggleRemoved(ing)}
                        aria-label={`Incluir ${ing.name}`}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Extra ingredients */}
          <div>
            <Label className="text-sm font-medium text-foreground">Extras</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar extra..."
                value={extraSearch}
                onChange={(e) => setExtraSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>

            {/* Selected extras */}
            {editItem.extraIngredients.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {editItem.extraIngredients.map((e) => (
                  <span
                    key={e.id}
                    className="inline-flex items-center gap-1 rounded-full bg-napoli-orange/10 px-3 py-1 text-xs font-medium text-napoli-orange"
                  >
                    {e.name} (+${e.extraCost.toFixed(2)})
                    <button
                      type="button"
                      onClick={() => removeExtra(e.id)}
                      className="rounded-full p-0.5 transition-colors hover:bg-napoli-orange/20"
                      aria-label={`Quitar ${e.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Available extras */}
            {availableExtras.length > 0 && extraSearch && (
              <div className="mt-2 max-h-36 overflow-y-auto rounded-lg border bg-card">
                {availableExtras.map((ing) => (
                  <button
                    key={ing.id}
                    type="button"
                    onClick={() => addExtra(ing)}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-secondary"
                  >
                    <span className="text-foreground">{ing.name}</span>
                    <span className="text-xs text-napoli-orange">
                      +${parseFloat(ing.extra_cost).toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <Label htmlFor="item-note" className="text-sm font-medium text-foreground">
              Nota
            </Label>
            <Textarea
              id="item-note"
              placeholder="Ej: sin sal, bien cocida..."
              value={editItem.note}
              onChange={(e) =>
                setEditItem((p) => ({ ...p, note: e.target.value }))
              }
              className="mt-2"
              rows={2}
            />
          </div>

          {/* Total */}
          <div className="rounded-lg bg-secondary/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total item</span>
              <span className="text-lg font-bold text-foreground">
                ${itemTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t pt-4">
          <Button
            variant="outline"
            className="flex-1 bg-transparent"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-primary text-primary-foreground hover:bg-napoli-red-dark"
            onClick={() => {
              onSave(editItem)
              onOpenChange(false)
            }}
          >
            Guardar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
