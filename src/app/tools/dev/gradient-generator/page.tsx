"use client"

import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Paintbrush, Copy, Check, RefreshCw, RotateCcw } from "lucide-react"

type GradientType = "linear" | "radial" | "conic"

interface ColorStop {
  color: string
  position: number
}

export default function GradientGeneratorPage() {
  const [type, setType] = useState<GradientType>("linear")
  const [angle, setAngle] = useState(135)
  const [stops, setStops] = useState<ColorStop[]>([
    { color: "#6366f1", position: 0 },
    { color: "#ec4899", position: 50 },
    { color: "#06b6d4", position: 100 },
  ])
  const [copied, setCopied] = useState(false)

  const gradientCSS = useCallback(() => {
    const sortedStops = [...stops].sort((a, b) => a.position - b.position)
    const stopsStr = sortedStops.map((s) => `${s.color} ${s.position}%`).join(", ")

    switch (type) {
      case "radial":
        return `radial-gradient(circle, ${stopsStr})`
      case "conic":
        return `conic-gradient(from ${angle}deg, ${stopsStr})`
      default:
        return `linear-gradient(${angle}deg, ${stopsStr})`
    }
  }, [type, angle, stops])

  const fullCSS = `background: ${gradientCSS()};`

  const updateStop = (idx: number, key: keyof ColorStop, val: string | number) => {
    setStops((prev) => prev.map((s, i) => (i === idx ? { ...s, [key]: val } : s)))
  }

  const addStop = () => {
    if (stops.length >= 6) return
    setStops((prev) => [...prev, { color: "#ffffff", position: 50 }])
  }

  const removeStop = (idx: number) => {
    if (stops.length <= 2) return
    setStops((prev) => prev.filter((_, i) => i !== idx))
  }

  const randomize = () => {
    const rndColor = () => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")
    const n = 2 + Math.floor(Math.random() * 2)
    const newStops = Array.from({ length: n }, (_, i) => ({
      color: rndColor(),
      position: Math.round((i / (n - 1)) * 100),
    }))
    setStops(newStops)
    setAngle(Math.floor(Math.random() * 360))
  }

  const copy = () => {
    navigator.clipboard.writeText(fullCSS)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
        <Paintbrush className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Gradient Generator</h1>
      </div>
      <p className="text-muted-foreground">Create beautiful CSS gradients visually.</p>

      {/* Preview */}
      <Card className="overflow-hidden">
        <div className="h-56 w-full rounded-t-lg" style={{ background: gradientCSS() }} />
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <code className="selectable flex-1 truncate rounded bg-muted px-3 py-2 text-xs font-mono">{fullCSS}</code>
            <Button variant="outline" size="sm" onClick={copy} className="h-8 gap-1.5 shrink-0">
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="space-y-5 p-5">
          {/* Type */}
          <div className="flex flex-wrap items-center gap-3">
            <Label className="shrink-0">Type</Label>
            <div className="flex gap-1.5">
              {(["linear", "radial", "conic"] as GradientType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                    type === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Angle */}
          {(type === "linear" || type === "conic") && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Angle</Label>
                <span className="text-xs font-mono text-muted-foreground">{angle}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={360}
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          )}

          {/* Color stops */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Color Stops</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={randomize} className="h-7 gap-1.5">
                  <RefreshCw className="h-3 w-3" /> Random
                </Button>
                {stops.length < 6 && (
                  <Button variant="outline" size="sm" onClick={addStop} className="h-7">
                    + Add
                  </Button>
                )}
              </div>
            </div>
            {stops.map((stop, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  type="color"
                  value={stop.color}
                  onChange={(e) => updateStop(i, "color", e.target.value)}
                  className="h-9 w-9 cursor-pointer rounded border-0 bg-transparent"
                />
                <code className="text-xs text-muted-foreground w-16">{stop.color}</code>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={stop.position}
                  onChange={(e) => updateStop(i, "position", Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="text-xs text-muted-foreground w-8">{stop.position}%</span>
                {stops.length > 2 && (
                  <button onClick={() => removeStop(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
