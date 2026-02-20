import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AppShell } from "@/components/app-shell"
import { Analytics } from "@vercel/analytics/react"
import { SecurityShield } from "@/components/security-shield"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ToolHex",
  description: "A modern collection of developer utilities, converters, media tools, and productivity helpers.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <SecurityShield />
        <AppShell>{children}</AppShell>
        <Analytics />
      </body>
    </html>
  )
}
