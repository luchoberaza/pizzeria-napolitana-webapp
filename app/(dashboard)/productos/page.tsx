import { getProducts } from "@/app/(dashboard)/productos/actions"
import { ProductsClient } from "@/app/(dashboard)/productos/products-client"
import { getIngredients } from "@/app/(dashboard)/ingredientes/actions"

export const dynamic = "force-dynamic"

export default async function ProductosPage() {
  const [products, ingredients] = await Promise.all([
    getProducts(),
    getIngredients(),
  ])
  return <ProductsClient products={products} allIngredients={ingredients} />
}
