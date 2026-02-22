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
}

export default nextConfig
