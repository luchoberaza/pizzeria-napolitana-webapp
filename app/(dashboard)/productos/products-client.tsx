"use client"

import React from "react"

import { useState, useTransition } from "react"
import { Pencil, Trash2, Plus, Search, Pizza } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
import { toast } from "sonner"
import type { Ingredient } from "../ingredientes/actions"
import {
  type Product,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/app/(dashboard)/productos/actions"

export function ProductsClient({
  products,
  allIngredients,
}: {
  products: Product[]
  allIngredients: Ingredient[]
}) {
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [isPending, startTransition] = useTransition()

  // Form state
  const [formName, setFormName] = useState("")
  const [formPrice, setFormPrice] = useState("")
  const [selectedIngredients, setSelectedIngredients] = useState<number[]>([])
  const [ingredientSearch, setIngredientSearch] = useState("")

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const filteredIngredients = allIngredients.filter((i) =>
    i.name.toLowerCase().includes(ingredientSearch.toLowerCase())
  )

  function openCreate() {
    setEditing(null)
    setFormName("")
    setFormPrice("")
    setSelectedIngredients([])
    setIngredientSearch("")
    setDialogOpen(true)
  }

  function openEdit(product: Product) {
    setEditing(product)
    setFormName(product.name)
    setFormPrice(parseFloat(product.price).toFixed(2))
    setSelectedIngredients(product.ingredients.map((i) => i.id))
    setIngredientSearch("")
    setDialogOpen(true)
  }

  function openDelete(product: Product) {
    setDeleting(product)
    setDeleteDialogOpen(true)
  }

  function toggleIngredient(id: number) {
    setSelectedIngredients((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const data = {
        name: formName,
        price: parseFloat(formPrice) || 0,
        ingredientIds: selectedIngredients,
      }

      const result = editing
        ? await updateProduct({ ...data, id: editing.id })
        : await createProduct(data)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(editing ? "Producto actualizado" : "Producto creado")
        setDialogOpen(false)
      }
    })
  }

  async function handleDelete() {
    if (!deleting) return
    startTransition(async () => {
      await deleteProduct(deleting.id)
      toast.success("Producto eliminado")
      setDeleteDialogOpen(false)
      setDeleting(null)
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Productos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Administra las pizzas y sus ingredientes base
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-primary text-primary-foreground hover:bg-napoli-red-dark"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>

      {/* Search */}
      <div className="relative mt-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
            <Pizza className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            {search ? "Sin resultados" : "Sin productos"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search
              ? "No se encontraron productos con esa busqueda"
              : "Agrega tu primer producto para comenzar"}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="group glass rounded-xl p-5 shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-foreground">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-xl font-bold text-napoli-orange">
                    ${parseFloat(product.price).toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => openEdit(product)}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    aria-label={`Editar ${product.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openDelete(product)}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Eliminar ${product.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {product.ingredients.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {product.ingredients.map((ing) => (
                    <Badge
                      key={ing.id}
                      variant="secondary"
                      className="text-xs font-normal"
                    >
                      {ing.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Producto" : "Nuevo Producto"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="product-name">Nombre</Label>
                <Input
                  id="product-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Margherita"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="product-price">Precio Base ($)</Label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Ingredientes Base</Label>
                <Input
                  placeholder="Buscar ingrediente..."
                  value={ingredientSearch}
                  onChange={(e) => setIngredientSearch(e.target.value)}
                />
                <div className="mt-1 flex flex-wrap gap-2">
                  {filteredIngredients.map((ing) => {
                    const isSelected = selectedIngredients.includes(ing.id)
                    return (
                      <button
                        key={ing.id}
                        type="button"
                        onClick={() => toggleIngredient(ing.id)}
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ${isSelected
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                          }`}
                      >
                        {ing.name}
                      </button>
                    )
                  })}
                </div>
                {allIngredients.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No hay ingredientes registrados. Crea ingredientes primero.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-primary text-primary-foreground hover:bg-napoli-red-dark"
              >
                {isPending
                  ? "Guardando..."
                  : editing
                    ? "Actualizar"
                    : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar producto</AlertDialogTitle>
            <AlertDialogDescription>
              {"Esta accion eliminara permanentemente "}
              <strong>{deleting?.name}</strong>
              {". Los pedidos existentes no se veran afectados."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
