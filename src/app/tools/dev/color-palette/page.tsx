"use client"

import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Palette, Copy, Check, RefreshCw, Lock, Unlock } from "lucide-react"

interface PaletteColor {
  hex: string
  locked: boolean
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, "0")
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

function hexToHSL(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
  }
  return [0, 0, Math.round(l * 100)]
}

type Harmony = "analogous" | "complementary" | "triadic" | "split" | "random"

function generatePalette(harmony: Harmony, count: number, existing: PaletteColor[]): PaletteColor[] {
  const baseH = Math.floor(Math.random() * 360)
  const baseS = 60 + Math.floor(Math.random() * 30)
  const baseL = 45 + Math.floor(Math.random() * 20)

  const hues: number[] = []
  switch (harmony) {
    case "analogous":
      for (let i = 0; i < count; i++) hues.push((baseH + i * 30) % 360)
      break
    case "complementary":
      for (let i = 0; i < count; i++) hues.push((baseH + (i % 2 === 0 ? 0 : 180) + i * 15) % 360)
      break
    case "triadic":
      for (let i = 0; i < count; i++) hues.push((baseH + i * 120) % 360)
      break
    case "split":
      for (let i = 0; i < count; i++) hues.push((baseH + (i === 0 ? 0 : 150 + (i - 1) * 60)) % 360)
      break
    default:
      for (let i = 0; i < count; i++) hues.push(Math.floor(Math.random() * 360))
  }

  return hues.map((h, i) => {
    if (existing[i]?.locked) return existing[i]
    const s = baseS + Math.floor(Math.random() * 15 - 7)
    const l = baseL + Math.floor(Math.random() * 20 - 10)
    return { hex: hslToHex(h, Math.max(20, Math.min(100, s)), Math.max(15, Math.min(85, l))), locked: false }
  })
}

export default function ColorPalettePage() {
  const [harmony, setHarmony] = useState<Harmony>("analogous")
  const [colors, setColors] = useState<PaletteColor[]>(() => generatePalette("analogous", 5, []))
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const regenerate = () => {
    setColors((prev) => generatePalette(harmony, prev.length, prev))
  }

  const toggleLock = (idx: number) => {
    setColors((prev) => prev.map((c, i) => (i === idx ? { ...c, locked: !c.locked } : c)))
  }

  const updateColor = (idx: number, hex: string) => {
    setColors((prev) => prev.map((c, i) => (i === idx ? { ...c, hex } : c)))
  }

  const addColor = () => {
    if (colors.length >= 8) return
    setColors((prev) => [...prev, { hex: hslToHex(Math.floor(Math.random() * 360), 70, 55), locked: false }])
  }

  const removeColor = (idx: number) => {
    if (colors.length <= 2) return
    setColors((prev) => prev.filter((_, i) => i !== idx))
  }

  const copy = (hex: string, idx: number) => {
    navigator.clipboard.writeText(hex)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const copyCSSVars = () => {
    const css = colors.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join("\n")
    navigator.clipboard.writeText(`:root {\n${css}\n}`)
    setCopiedIdx(-1)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center gap-2">
        <Palette className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Color Palette Generator</h1>
      </div>
      <p className="text-muted-foreground">Generate harmonious color palettes. Lock colors you like and regenerate the rest.</p>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {(["analogous", "complementary", "triadic", "split", "random"] as Harmony[]).map((h) => (
          <button
            key={h}
            onClick={() => setHarmony(h)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
              harmony === h ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {h}
          </button>
        ))}
        <Button onClick={regenerate} size="sm" className="gap-1.5 ml-auto">
          <RefreshCw className="h-3.5 w-3.5" /> Generate
        </Button>
      </div>

      {/* Palette display */}
      <Card className="overflow-hidden">
        <div className="flex h-48 sm:h-56">
          {colors.map((c, i) => (
            <div
              key={i}
              className="group relative flex-1 transition-all duration-300 hover:flex-[1.3] cursor-pointer"
              style={{ backgroundColor: c.hex }}
              onClick={() => copy(c.hex, i)}
            >
              {/* Overlay on hover */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 bg-black/20 backdrop-blur-sm">
                <span className="rounded bg-black/50 px-2 py-1 text-xs font-mono font-bold text-white">
                  {copiedIdx === i ? "Copied!" : c.hex.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Color controls */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {colors.map((c, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="flex items-center gap-3 p-3">
              <input
                type="color"
                value={c.hex}
                onChange={(e) => updateColor(i, e.target.value)}
                className="h-9 w-9 cursor-pointer rounded border-0 bg-transparent"
              />
              <code className="flex-1 text-sm font-mono">{c.hex.toUpperCase()}</code>
              <button onClick={() => toggleLock(i)} className="text-muted-foreground hover:text-foreground transition-colors">
                {c.locked ? <Lock className="h-3.5 w-3.5 text-yellow-500" /> : <Unlock className="h-3.5 w-3.5" />}
              </button>
              {colors.length > 2 && (
                <button onClick={() => removeColor(i)} className="text-muted-foreground hover:text-destructive transition-colors text-lg">×</button>
              )}
            </CardContent>
          </Card>
        ))}
        {colors.length < 8 && (
          <button onClick={addColor} className="flex items-center justify-center rounded-lg border-2 border-dashed border-border/60 p-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors">
            + Add Color
          </button>
        )}
      </div>

      {/* Export */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={copyCSSVars} className="gap-1.5">
          {copiedIdx === -1 ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copiedIdx === -1 ? "Copied!" : "Copy CSS Vars"}
        </Button>
      </div>
    </div>
  )
}
