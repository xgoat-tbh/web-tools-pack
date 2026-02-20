"use client"

import Link from "next/link"
import { categories, allTools, type Tool } from "@/lib/tools-config"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Search, Sparkles, Heart, Clock, Pin, PinOff, ChevronDown, ChevronUp, Star,
} from "lucide-react"
import { useState, useMemo, useCallback, useEffect } from "react"
import { useRecentTools, usePinnedTools, useToolUsage } from "@/hooks/use-tool-history"

// ── Tool Card (reusable) ──
function ToolCard({
  tool,
  isPinned,
  onTogglePin,
  onTrack,
  compact = false,
}: {
  tool: Tool
  isPinned: boolean
  onTogglePin: (slug: string) => void
  onTrack: (slug: string) => void
  compact?: boolean
}) {
  return (
    <div className="relative group/card">
      <Link
        href={`/tools/${tool.category}/${tool.slug}`}
        onClick={() => onTrack(`${tool.category}/${tool.slug}`)}
      >
        <Card className="card-animated h-full group">
          <CardHeader className={compact ? "p-3" : "p-4"}>
            <div className="flex items-center gap-3">
              <div className={`rounded-lg bg-primary/10 ${compact ? "p-1.5" : "p-2"} transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110`}>
                <tool.icon className={`${compact ? "h-4 w-4" : "h-5 w-5"} text-primary transition-transform duration-300 group-hover:rotate-6`} />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className={compact ? "text-xs" : "text-sm"}>{tool.name}</CardTitle>
                {!compact && <CardDescription className="text-xs">{tool.description}</CardDescription>}
              </div>
            </div>
          </CardHeader>
        </Card>
      </Link>
      {/* Pin button */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTogglePin(`${tool.category}/${tool.slug}`) }}
        className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 p-1 rounded-md hover:bg-accent"
        title={isPinned ? "Unpin" : "Pin to dashboard"}
      >
        {isPinned
          ? <PinOff className="h-3 w-3 text-primary" />
          : <Pin className="h-3 w-3 text-muted-foreground" />
        }
      </button>
    </div>
  )
}

// ── Helper: resolve slug to Tool ──
function resolveTools(slugs: string[]): Tool[] {
  return slugs
    .map((slug) => {
      const parts = slug.split("/")
      const toolSlug = parts[parts.length - 1]
      const catSlug = parts.length > 1 ? parts[0] : undefined
      return allTools.find((t) =>
        catSlug ? t.slug === toolSlug && t.category === catSlug : t.slug === toolSlug
      )
    })
    .filter((t): t is Tool => t !== undefined)
}

// ── Category section with progressive disclosure ──
function CategorySection({
  name,
  slug,
  tools,
  pinnedSlugs,
  onTogglePin,
  onTrack,
  defaultExpanded,
}: {
  name: string
  slug: string
  tools: Tool[]
  pinnedSlugs: string[]
  onTogglePin: (slug: string) => void
  onTrack: (slug: string) => void
  defaultExpanded: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const PREVIEW_COUNT = 6

  return (
    <section>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 mb-3 group/cat w-full text-left"
      >
        <h2 className="text-lg font-semibold">{name}</h2>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {tools.length}
        </span>
        <div className="flex-1" />
        {tools.length > PREVIEW_COUNT && (
          <span className="text-xs text-muted-foreground flex items-center gap-0.5 group-hover/cat:text-foreground transition-colors">
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {expanded ? "Show less" : `+${tools.length - PREVIEW_COUNT} more`}
          </span>
        )}
      </button>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(expanded ? tools : tools.slice(0, PREVIEW_COUNT)).map((tool) => (
          <ToolCard
            key={tool.slug}
            tool={tool}
            isPinned={pinnedSlugs.includes(`${tool.category}/${tool.slug}`)}
            onTogglePin={onTogglePin}
            onTrack={onTrack}
          />
        ))}
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function Home() {
  const [query, setQuery] = useState("")
  const [mounted, setMounted] = useState(false)
  const { recent, trackTool } = useRecentTools()
  const { pinned, togglePin, isPinned } = usePinnedTools()
  const { getFrequent } = useToolUsage()

  useEffect(() => setMounted(true), [])

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

  const isSearching = query.length > 0

  // Resolve recent and pinned to actual tool objects
  const recentTools = useMemo(() => mounted ? resolveTools(recent) : [], [recent, mounted])
  const pinnedTools = useMemo(() => mounted ? resolveTools(pinned) : [], [pinned, mounted])
  const frequentSlugs = useMemo(() => mounted ? getFrequent(6) : [], [getFrequent, mounted])
  const frequentTools = useMemo(() => mounted ? resolveTools(frequentSlugs) : [], [frequentSlugs, mounted])

  // Determine which categories to expand by default (first 2, or ones with pinned tools)
  const expandedByDefault = useCallback(
    (catSlug: string, idx: number) => idx < 2 || pinned.some((s) => s.startsWith(catSlug + "/")),
    [pinned]
  )

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Hero */}
      <div className="space-y-2">
        <div className="animate-fade-in-up flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Web Tools Pack
          </h1>
          <Sparkles className="h-6 w-6 text-yellow-500 animate-bounce-slow" />
        </div>
        <p className="animate-fade-in-up animation-delay-100 text-muted-foreground text-lg">
          {allTools.length} tools — developer utilities, converters, media tools, benchmarks, and more.
        </p>
      </div>

      {/* Global Search */}
      <div className="relative max-w-lg animate-fade-in-up animation-delay-200">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={`Search ${allTools.length} tools...`}
          className="pl-9 transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:shadow-lg focus:shadow-primary/5"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Dashboard Sections (only show when NOT searching) ── */}
      {!isSearching && mounted && (
        <>
          {/* Pinned Tools */}
          {pinnedTools.length > 0 && (
            <section className="animate-fade-in-up animation-delay-300">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-4 w-4 text-yellow-500" />
                <h2 className="text-lg font-semibold">Pinned</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pinnedTools.map((tool) => (
                  <ToolCard
                    key={tool.slug}
                    tool={tool}
                    isPinned={true}
                    onTogglePin={togglePin}
                    onTrack={trackTool}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Recently Used */}
          {recentTools.length > 0 && (
            <section className="animate-fade-in-up animation-delay-300">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-blue-400" />
                <h2 className="text-lg font-semibold">Recently Used</h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {recentTools.slice(0, 8).map((tool) => (
                  <ToolCard
                    key={tool.slug}
                    tool={tool}
                    isPinned={isPinned(`${tool.category}/${tool.slug}`)}
                    onTogglePin={togglePin}
                    onTrack={trackTool}
                    compact
                  />
                ))}
              </div>
            </section>
          )}

          {/* Most Used (only show if there's meaningful data and no pins/recent overlap) */}
          {frequentTools.length >= 3 && pinnedTools.length === 0 && recentTools.length === 0 && (
            <section className="animate-fade-in-up animation-delay-300">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-4 w-4 text-orange-400" />
                <h2 className="text-lg font-semibold">Most Used</h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {frequentTools.map((tool) => (
                  <ToolCard
                    key={tool.slug}
                    tool={tool}
                    isPinned={isPinned(`${tool.category}/${tool.slug}`)}
                    onTogglePin={togglePin}
                    onTrack={trackTool}
                    compact
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Categories (always shown, with progressive disclosure) ── */}
      {filtered.map((cat, catIdx) => (
        <div
          key={cat.slug}
          className="animate-fade-in-up"
          style={{ animationDelay: `${0.2 + catIdx * 0.08}s` }}
        >
          {isSearching ? (
            // When searching, show flat results
            <section>
              <h2 className="mb-3 text-lg font-semibold">{cat.name}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cat.tools.map((tool) => (
                  <ToolCard
                    key={tool.slug}
                    tool={tool}
                    isPinned={isPinned(`${tool.category}/${tool.slug}`)}
                    onTogglePin={togglePin}
                    onTrack={trackTool}
                  />
                ))}
              </div>
            </section>
          ) : (
            <CategorySection
              name={cat.name}
              slug={cat.slug}
              tools={cat.tools}
              pinnedSlugs={pinned}
              onTogglePin={togglePin}
              onTrack={trackTool}
              defaultExpanded={expandedByDefault(cat.slug, catIdx)}
            />
          )}
        </div>
      ))}

      {/* Donate CTA */}
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
