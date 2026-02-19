"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { CommandPalette } from "@/components/command-palette"
import { ThemeProvider, useTheme } from "@/components/theme-provider"
import { Menu, Search, Sun, Moon, Heart } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

function ThemeTransitionWrapper({ children }: { children: React.ReactNode }) {
  const { transitioning } = useTheme()
  return (
    <div
      className="transition-opacity duration-200 ease-in-out"
      style={{ opacity: transitioning ? 0 : 1 }}
    >
      {children}
    </div>
  )
}

function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, toggle, transitioning } = useTheme()

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-card/80 backdrop-blur px-4 animate-fade-in-down">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      <button
        onClick={() => {
          window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))
        }}
        className="hidden sm:flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        Search tools...
        <kbd className="ml-2 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono">⌘K</kbd>
      </button>

      <Link href="/donate">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-pink-400 transition-colors">
          <Heart className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-xs">Donate</span>
        </Button>
      </Link>

      <Button variant="ghost" size="icon" onClick={toggle} className="relative h-9 w-9 overflow-hidden">
        <Sun className={`h-4 w-4 absolute transition-all duration-300 ${theme === "dark" ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"}`} />
        <Moon className={`h-4 w-4 absolute transition-all duration-300 ${theme === "light" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}`} />
      </Button>
    </header>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ThemeProvider>
      <ThemeTransitionWrapper>
      <div className="flex h-screen overflow-hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="animate-page-in">{children}</div>
          </main>
        </div>
      </div>
      <CommandPalette />
      </ThemeTransitionWrapper>
    </ThemeProvider>
  )
}
