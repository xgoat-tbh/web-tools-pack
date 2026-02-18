"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { categories } from "@/lib/tools-config"
import { cn } from "@/lib/utils"
import { ChevronLeft, Wrench } from "lucide-react"

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
          <Link href="/" className="flex items-center gap-2 font-bold text-lg" onClick={onClose}>
            <Wrench className="h-5 w-5 text-primary" />
            Web Tools Pack
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
                          "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                          active
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <tool.icon className="h-4 w-4 shrink-0" />
                        {tool.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
