"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { allTools } from "@/lib/tools-config"
import { Search } from "lucide-react"

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const router = useRouter()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const filtered = useMemo(() => {
    if (!query) return allTools
    const q = query.toLowerCase()
    return allTools.filter(
      (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    )
  }, [query])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div className="relative z-10 w-full max-w-lg rounded-xl border bg-card shadow-2xl">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Search tools..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && filtered.length > 0) {
                router.push(`/tools/${filtered[0].category}/${filtered[0].slug}`)
                setOpen(false)
                setQuery("")
              }
            }}
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <li className="px-2 py-4 text-center text-sm text-muted-foreground">No tools found</li>
          )}
          {filtered.map((tool) => (
            <li key={`${tool.category}-${tool.slug}`}>
              <button
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent text-left"
                onClick={() => {
                  router.push(`/tools/${tool.category}/${tool.slug}`)
                  setOpen(false)
                  setQuery("")
                }}
              >
                <tool.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium">{tool.name}</p>
                  <p className="text-xs text-muted-foreground">{tool.description}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
