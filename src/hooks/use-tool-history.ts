"use client"

import { useState, useEffect, useCallback } from "react"

const RECENT_KEY = "wtp-recent-tools"
const PINNED_KEY = "wtp-pinned-tools"
const USAGE_KEY = "wtp-tool-usage"
const MAX_RECENT = 8

interface ToolUsage {
  slug: string
  count: number
  lastUsed: number
}

// ── Recent Tools ──
export function useRecentTools() {
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY)
      if (stored) setRecent(JSON.parse(stored))
    } catch {}
  }, [])

  const trackTool = useCallback((slug: string) => {
    setRecent((prev) => {
      const next = [slug, ...prev.filter((s) => s !== slug)].slice(0, MAX_RECENT)
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      return next
    })
    // Also bump usage count
    try {
      const raw = localStorage.getItem(USAGE_KEY)
      const usage: ToolUsage[] = raw ? JSON.parse(raw) : []
      const existing = usage.find((u) => u.slug === slug)
      if (existing) {
        existing.count++
        existing.lastUsed = Date.now()
      } else {
        usage.push({ slug, count: 1, lastUsed: Date.now() })
      }
      localStorage.setItem(USAGE_KEY, JSON.stringify(usage))
    } catch {}
  }, [])

  return { recent, trackTool }
}

// ── Pinned / Favorite Tools ──
export function usePinnedTools() {
  const [pinned, setPinned] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PINNED_KEY)
      if (stored) setPinned(JSON.parse(stored))
    } catch {}
  }, [])

  const togglePin = useCallback((slug: string) => {
    setPinned((prev) => {
      const next = prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug]
      localStorage.setItem(PINNED_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const isPinned = useCallback((slug: string) => pinned.includes(slug), [pinned])

  return { pinned, togglePin, isPinned }
}

// ── Usage frequency ──
export function useToolUsage() {
  const [usage, setUsage] = useState<ToolUsage[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(USAGE_KEY)
      if (raw) setUsage(JSON.parse(raw))
    } catch {}
  }, [])

  const getFrequent = useCallback(
    (limit = 6) =>
      [...usage].sort((a, b) => b.count - a.count).slice(0, limit).map((u) => u.slug),
    [usage]
  )

  return { usage, getFrequent }
}

// ── Device detection ──
export function useDeviceType() {
  const [device, setDevice] = useState<"touch" | "mouse" | "unknown">("unknown")

  useEffect(() => {
    const isTouchDevice =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches

    setDevice(isTouchDevice ? "touch" : "mouse")
  }, [])

  return device
}
