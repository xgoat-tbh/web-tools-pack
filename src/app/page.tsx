"use client"

import Link from "next/link"
import { categories } from "@/lib/tools-config"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useState, useMemo } from "react"

export default function Home() {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    if (!query) return categories
    const q = query.toLowerCase()
    return categories
      .map((cat) => ({
        ...cat,
        tools: cat.tools.filter(
          (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.tools.length > 0)
  }, [query])

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Web Tools Pack</h1>
        <p className="text-muted-foreground">
          A fast collection of developer utilities, converters, media tools, and more.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Filter tools..."
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.map((cat) => (
        <section key={cat.slug}>
          <h2 className="mb-3 text-lg font-semibold">{cat.name}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cat.tools.map((tool) => (
              <Link key={tool.slug} href={`/tools/${tool.category}/${tool.slug}`}>
                <Card className="h-full transition-colors hover:bg-accent/50">
                  <CardHeader className="p-4">
                    <div className="flex items-center gap-3">
                      <tool.icon className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-sm">{tool.name}</CardTitle>
                        <CardDescription className="text-xs">{tool.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
