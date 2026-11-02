/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Disable client-side Router Cache for dynamic routes entirely.
    // Default in Next.js 15 is already 0, but we set it explicitly
    // to guarantee stale products/ingredients never appear in Nuevo Pedido.
    staleTimes: {
      dynamic: 0,
    },
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["better-sqlite3"],
  // Con PORTABLE_BUILD=1 se genera .next/standalone: un servidor autocontenido
  // con solo las dependencias que realmente usa, para empaquetar el portable.
  // Sin la variable el build sigue siendo el de siempre (npm run build / start).
  ...(process.env.PORTABLE_BUILD === "1" ? { output: "standalone" } : {}),
}

export default nextConfig
