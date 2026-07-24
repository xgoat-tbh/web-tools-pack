"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Square, Copy, Check, RotateCcw } from "lucide-react"

interface ShadowLayer {
  x: number
  y: number
  blur: number
  spread: number
  color: string
  opacity: number
  inset: boolean
}

function shadowToCSS(layer: ShadowLayer): string {
  const r = parseInt(layer.color.slice(1, 3), 16)
  const g = parseInt(layer.color.slice(3, 5), 16)
  const b = parseInt(layer.color.slice(5, 7), 16)
  const rgba = `rgba(${r}, ${g}, ${b}, ${layer.opacity / 100})`
  return `${layer.inset ? "inset " : ""}${layer.x}px ${layer.y}px ${layer.blur}px ${layer.spread}px ${rgba}`
}

function defaultLayer(): ShadowLayer {
  return { x: 4, y: 4, blur: 12, spread: 0, color: "#000000", opacity: 25, inset: false }
}

export default function ShadowGeneratorPage() {
  const [layers, setLayers] = useState<ShadowLayer[]>([defaultLayer()])
  const [bgColor, setBgColor] = useState("#1a1a2e")
  const [boxColor, setBoxColor] = useState("#16213e")
  const [borderRadius, setBorderRadius] = useState(12)
  const [copied, setCopied] = useState(false)

  const fullCSS = layers.map(shadowToCSS).join(",\n    ")
  const cssString = `box-shadow: ${layers.map(shadowToCSS).join(", ")};`

  const updateLayer = (idx: number, key: keyof ShadowLayer, val: number | string | boolean) => {
    setLayers((prev) => prev.map((l, i) => (i === idx ? { ...l, [key]: val } : l)))
  }

  const addLayer = () => {
    if (layers.length >= 5) return
    setLayers((prev) => [...prev, defaultLayer()])
  }

  const removeLayer = (idx: number) => {
    if (layers.length <= 1) return
    setLayers((prev) => prev.filter((_, i) => i !== idx))
  }

  const copy = () => {
    navigator.clipboard.writeText(cssString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const reset = () => {
    setLayers([defaultLayer()])
    setBorderRadius(12)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center gap-2">
        <Square className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">CSS Shadow Generator</h1>
      </div>
      <p className="text-muted-foreground">Build beautiful box-shadows with a visual editor.</p>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Preview */}
        <Card className="overflow-hidden">
          <div
            className="flex h-72 items-center justify-center transition-colors"
            style={{ backgroundColor: bgColor }}
          >
            <div
              className="h-32 w-32 transition-all duration-200"
              style={{
                backgroundColor: boxColor,
                borderRadius: `${borderRadius}px`,
                boxShadow: layers.map(shadowToCSS).join(", "),
              }}
            />
          </div>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <code className="selectable flex-1 truncate rounded bg-muted px-3 py-2 text-[11px] font-mono">{cssString}</code>
              <Button variant="outline" size="sm" onClick={copy} className="h-8 gap-1.5 shrink-0">
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5">
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent" />
                <span className="text-[10px] text-muted-foreground">BG</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input type="color" value={boxColor} onChange={(e) => setBoxColor(e.target.value)} className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent" />
                <span className="text-[10px] text-muted-foreground">Box</span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-[10px] text-muted-foreground">Radius</span>
                <input type="range" min={0} max={64} value={borderRadius} onChange={(e) => setBorderRadius(Number(e.target.value))} className="w-20 accent-primary" />
                <span className="text-[10px] text-muted-foreground w-6">{borderRadius}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Layer controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Shadow Layers ({layers.length})</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={reset} className="h-7 gap-1.5">
                <RotateCcw className="h-3 w-3" /> Reset
              </Button>
              {layers.length < 5 && (
                <Button variant="outline" size="sm" onClick={addLayer} className="h-7">+ Add</Button>
              )}
            </div>
          </div>

          {layers.map((layer, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Layer {i + 1}</span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs">
                      <input
                        type="checkbox"
                        checked={layer.inset}
                        onChange={(e) => updateLayer(i, "inset", e.target.checked)}
                        className="accent-primary"
                      />
                      Inset
                    </label>
                    {layers.length > 1 && (
                      <button onClick={() => removeLayer(i)} className="text-muted-foreground hover:text-destructive transition-colors">×</button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {([
                    { key: "x", label: "X Offset", min: -50, max: 50 },
                    { key: "y", label: "Y Offset", min: -50, max: 50 },
                    { key: "blur", label: "Blur", min: 0, max: 100 },
                    { key: "spread", label: "Spread", min: -50, max: 50 },
                  ] as const).map(({ key, label, min, max }) => (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">{label}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{layer[key]}px</span>
                      </div>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        value={layer[key]}
                        onChange={(e) => updateLayer(i, key, Number(e.target.value))}
                        className="w-full accent-primary"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <input type="color" value={layer.color} onChange={(e) => updateLayer(i, "color", e.target.value)} className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">Opacity</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{layer.opacity}%</span>
                    </div>
                    <input type="range" min={0} max={100} value={layer.opacity} onChange={(e) => updateLayer(i, "opacity", Number(e.target.value))} className="w-full accent-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
