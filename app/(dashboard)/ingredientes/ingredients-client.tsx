"use client"

import { useState, useTransition } from "react"
import { Pencil, Trash2, Plus, Search, Salad } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  type Ingredient,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} from "@/app/(dashboard)/ingredientes/actions"

export function IngredientsClient({
  ingredients,
}: {
  ingredients: Ingredient[]
}) {
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Ingredient | null>(null)
  const [deleting, setDeleting] = useState<Ingredient | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = ingredients.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(ingredient: Ingredient) {
    setEditing(ingredient)
    setDialogOpen(true)
  }

  function openDelete(ingredient: Ingredient) {
    setDeleting(ingredient)
    setDeleteDialogOpen(true)
  }

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = editing
        ? await updateIngredient(formData)
        : await createIngredient(formData)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(editing ? "Ingrediente actualizado" : "Ingrediente creado")
        setDialogOpen(false)
      }
    })
  }

  async function handleDelete() {
    if (!deleting) return
    startTransition(async () => {
      await deleteIngredient(deleting.id)
      toast.success("Ingrediente eliminado")
      setDeleteDialogOpen(false)
      setDeleting(null)
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ingredientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Administra los ingredientes disponibles y sus costos extra
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-primary text-primary-foreground hover:bg-napoli-red-dark"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Ingrediente
        </Button>
      </div>

      {/* Search */}
      <div className="relative mt-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar ingrediente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
            <Salad className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            {search ? "Sin resultados" : "Sin ingredientes"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search
              ? "No se encontraron ingredientes con esa busqueda"
              : "Agrega tu primer ingrediente para comenzar"}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ingredient) => (
            <div
              key={ingredient.id}
              className="group glass rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {ingredient.name}
                  </h3>
                  <p className="mt-1 text-lg font-bold text-napoli-orange">
                    ${parseFloat(ingredient.extra_cost).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">costo extra</p>
                </div>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => openEdit(ingredient)}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    aria-label={`Editar ${ingredient.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openDelete(ingredient)}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Eliminar ${ingredient.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Ingrediente" : "Nuevo Ingrediente"}
            </DialogTitle>
          </DialogHeader>
          <form action={handleSubmit}>
            {editing && (
              <input type="hidden" name="id" value={editing.id} />
            )}
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Ej: Mozzarella"
                  defaultValue={editing?.name ?? ""}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="extra_cost">Costo Extra ($)</Label>
                <Input
                  id="extra_cost"
                  name="extra_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  defaultValue={editing ? parseFloat(editing.extra_cost).toFixed(2) : ""}
                />
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
                {isPending ? "Guardando..." : editing ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar ingrediente</AlertDialogTitle>
            <AlertDialogDescription>
              {"Esta accion eliminara permanentemente "}
              <strong>{deleting?.name}</strong>
              {". Los productos que lo usen perderan este ingrediente."}
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
