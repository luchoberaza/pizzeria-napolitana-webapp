"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Pizza,
  Salad,
  ClipboardList,
  PlusCircle,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"

const navItems = [
  { href: "/pedidos/nuevo", label: "Nuevo Pedido", icon: PlusCircle },
  { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/productos", label: "Productos", icon: Pizza },
  { href: "/ingredientes", label: "Ingredientes", icon: Salad },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      {/* Mobile header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b bg-card px-4 py-3 lg:hidden no-print">
        <Link href="/pedidos/nuevo" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-primary">
            <img
              src="/logo.svg"
              alt="Logo"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-lg font-semibold text-foreground">
            Napolitana
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {mounted && (
            <div className="flex items-center gap-2 rounded-full bg-secondary/50 px-2 py-1">
              <Sun className="h-3.5 w-3.5 text-muted-foreground" />
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                aria-label="Alternar modo oscuro"
              />
              <Moon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label={mobileOpen ? "Cerrar menu" : "Abrir menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setMobileOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Cerrar menu"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 no-print",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 border-b px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-primary shadow-sm">
            <img
              src="/logo.svg"
              alt="Logo"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-foreground">
              Napolitana
            </h1>
            <p className="text-xs text-muted-foreground">Pizzeria Artesanal</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <ul className="flex flex-col gap-1" role="list">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/pedidos/nuevo" &&
                  item.href !== "/pedidos" &&
                  pathname.startsWith(item.href)) ||
                (item.href === "/pedidos" &&
                  pathname === "/pedidos")

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4.5 w-4.5" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer with Theme Toggle */}
        <div className="mt-auto border-t p-4">
          {mounted && (
            <div className="flex items-center justify-between rounded-xl bg-secondary/50 p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-sm">
                  {theme === "dark" ? (
                    <Moon className="h-4 w-4 text-primary" />
                  ) : (
                    <Sun className="h-4 w-4 text-napoli-orange" />
                  )}
                </div>
                <span className="text-xs font-medium text-foreground">
                  Modo {theme === "dark" ? "Oscuro" : "Claro"}
                </span>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                aria-label="Alternar modo oscuro"
              />
            </div>
          )}
          <div className="mt-3 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
              Pizzeria Napolitana
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
