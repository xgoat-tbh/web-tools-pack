"use client"

import Link from "next/link"
import { categories } from "@/lib/tools-config"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Sparkles, Heart } from "lucide-react"
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
    <div className="mx-auto max-w-5xl space-y-8 animate-page-in">
      {/* Hero */}
      <div className="space-y-2">
        <div className="animate-fade-in-up flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Web Tools Pack
          </h1>
          <Sparkles className="h-6 w-6 text-yellow-500 animate-bounce-slow" />
        </div>
        <p className="animate-fade-in-up animation-delay-100 text-muted-foreground text-lg">
          A fast collection of developer utilities, converters, media tools, and more.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md animate-fade-in-up animation-delay-200">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Filter tools..."
          className="pl-9 transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:shadow-lg focus:shadow-primary/5"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Tool categories */}
      {filtered.map((cat, catIdx) => (
        <section
          key={cat.slug}
          className="animate-fade-in-up"
          style={{ animationDelay: `${0.2 + catIdx * 0.1}s` }}
        >
          <h2 className="mb-3 text-lg font-semibold">{cat.name}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {cat.tools.map((tool) => (
              <Link key={tool.slug} href={`/tools/${tool.category}/${tool.slug}`}>
                <Card className="card-animated h-full group">
                  <CardHeader className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                        <tool.icon className="h-5 w-5 text-primary transition-transform duration-300 group-hover:rotate-6" />
                      </div>
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

      {/* Donate CTA at bottom */}
      <div className="animate-fade-in-up animation-delay-700">
        <Link href="/donate">
          <div className="group relative overflow-hidden rounded-xl border border-pink-500/20 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-cyan-500/5 p-6 text-center transition-all duration-500 hover:border-pink-500/40 hover:shadow-xl hover:shadow-pink-500/5">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-purple-500/5 to-pink-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <Heart className="mx-auto mb-2 h-8 w-8 text-pink-500 transition-transform duration-300 group-hover:scale-125" />
            <p className="text-lg font-semibold">Enjoying Web Tools Pack?</p>
            <p className="mt-1 text-sm text-muted-foreground">Support the project — buy us a coffee via UPI!</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
