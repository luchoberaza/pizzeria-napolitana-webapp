import React from "react"
import type { Metadata, Viewport } from "next"
import { Poppins } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  title: "Pizzeria Napolitana",
  description: "Sistema de gestión para pizzeria napolitana artesanal",
}

export const viewport: Viewport = {
  themeColor: "#B3261E",
  width: "device-width",
  initialScale: 1,
}

import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${poppins.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                borderRadius: "0.75rem",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
