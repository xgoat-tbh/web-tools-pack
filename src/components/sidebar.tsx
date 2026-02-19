"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { categories } from "@/lib/tools-config"
import { cn } from "@/lib/utils"
import { ChevronLeft, Wrench, Heart } from "lucide-react"

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r bg-card transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Link href="/" className="group flex items-center gap-2 font-bold text-lg" onClick={onClose}>
            <Wrench className="h-5 w-5 text-primary transition-transform duration-300 group-hover:rotate-90" />
            <span className="bg-gradient-to-r from-foreground to-foreground bg-clip-text transition-all duration-300 group-hover:from-primary group-hover:to-purple-400 group-hover:text-transparent">Web Tools Pack</span>
          </Link>
          <button className="lg:hidden" onClick={onClose}>
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {categories.map((cat) => (
            <div key={cat.slug}>
              <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {cat.name}
              </p>
              <ul className="space-y-0.5">
                {cat.tools.map((tool) => {
                  const href = `/tools/${tool.category}/${tool.slug}`
                  const active = pathname === href
                  return (
                    <li key={tool.slug}>
                      <Link
                        href={href}
                        onClick={onClose}
                        className={cn(
                          "group/link flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-all duration-200",
                          active
                            ? "bg-primary/10 text-primary font-medium shadow-sm"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground hover:translate-x-0.5"
                        )}
                      >
                        <tool.icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/link:scale-110" />
                        {tool.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Donate button */}
        <div className="border-t p-3">
          <Link
            href="/donate"
            onClick={onClose}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300",
              pathname === "/donate"
                ? "bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400"
                : "text-muted-foreground hover:bg-gradient-to-r hover:from-pink-500/10 hover:to-purple-500/10 hover:text-pink-400"
            )}
          >
            <Heart className={cn("h-4 w-4 transition-all", pathname === "/donate" ? "fill-pink-500 text-pink-500 animate-pulse" : "")} />
            Support Us
            <span className="ml-auto rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-2 py-0.5 text-[10px] font-bold text-white">
              UPI
            </span>
          </Link>
        </div>
      </aside>
    </>
  )
}
