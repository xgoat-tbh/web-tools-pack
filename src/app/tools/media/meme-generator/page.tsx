"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Laugh, Download, Upload, RotateCcw, Plus, Minus, Bold } from "lucide-react"

interface TextOverlay {
  text: string
  x: number
  y: number
  fontSize: number
  color: string
  strokeColor: string
  bold: boolean
}

const DEFAULT_TOP: TextOverlay = { text: "", x: 0.5, y: 0.08, fontSize: 48, color: "#ffffff", strokeColor: "#000000", bold: true }
const DEFAULT_BOTTOM: TextOverlay = { text: "", x: 0.5, y: 0.92, fontSize: 48, color: "#ffffff", strokeColor: "#000000", bold: true }

export default function MemeGeneratorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [topText, setTopText] = useState<TextOverlay>({ ...DEFAULT_TOP })
  const [bottomText, setBottomText] = useState<TextOverlay>({ ...DEFAULT_BOTTOM })
  const [dragging, setDragging] = useState(false)

  const drawMeme = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size to image size (capped)
    const maxW = 800
    const scale = image.width > maxW ? maxW / image.width : 1
    canvas.width = image.width * scale
    canvas.height = image.height * scale

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

    // Draw text overlays
    const drawText = (overlay: TextOverlay) => {
      if (!overlay.text) return
      const size = overlay.fontSize * scale
      ctx.font = `${overlay.bold ? "bold " : ""}${size}px Impact, Arial Black, sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      const x = overlay.x * canvas.width
      const y = overlay.y * canvas.height

      // Stroke
      ctx.strokeStyle = overlay.strokeColor
      ctx.lineWidth = size / 8
      ctx.lineJoin = "round"
      ctx.strokeText(overlay.text.toUpperCase(), x, y)

      // Fill
      ctx.fillStyle = overlay.color
      ctx.fillText(overlay.text.toUpperCase(), x, y)
    }

    drawText(topText)
    drawText(bottomText)
  }, [image, topText, bottomText])

  useEffect(() => {
    drawMeme()
  }, [drawMeme])

  const handleFile = (file: File) => {
    const img = new window.Image()
    img.onload = () => setImage(img)
    img.src = URL.createObjectURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith("image/")) handleFile(file)
  }

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement("a")
    link.download = "meme.png"
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  const reset = () => {
    setImage(null)
    setTopText({ ...DEFAULT_TOP })
    setBottomText({ ...DEFAULT_BOTTOM })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center gap-2">
        <Laugh className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Meme Generator</h1>
      </div>
      <p className="text-muted-foreground">Upload an image and add top/bottom text to create memes.</p>

      {!image ? (
        <Card>
          <CardContent className="p-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`flex h-56 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <Upload className="mb-2 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Drop image here or click to upload</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }} />
            </div>
          </CardContent>
        </Card>
      ) : (
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Canvas */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <canvas ref={canvasRef} className="mx-auto block max-w-full rounded-lg" />
              <div className="flex gap-2">
                <Button onClick={download} className="flex-1 gap-2">
                  <Download className="h-4 w-4" /> Download Meme
                </Button>
                <Button variant="outline" onClick={reset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Top Text</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
              <Input
                placeholder="Enter top text..."
                value={topText.text}
                onChange={(e) => setTopText({ ...topText, text: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <Label className="text-xs w-12">Size</Label>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setTopText({ ...topText, fontSize: Math.max(16, topText.fontSize - 4) })}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-xs w-8 text-center">{topText.fontSize}</span>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setTopText({ ...topText, fontSize: Math.min(96, topText.fontSize + 4) })}>
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  variant={topText.bold ? "default" : "outline"}
                  size="icon"
                  className="h-7 w-7 ml-auto"
                  onClick={() => setTopText({ ...topText, bold: !topText.bold })}
                >
                  <Bold className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex gap-2 items-center">
                <Label className="text-xs w-12">Color</Label>
                <input type="color" value={topText.color} onChange={(e) => setTopText({ ...topText, color: e.target.value })} className="h-7 w-10 rounded border cursor-pointer" />
                <Label className="text-xs w-12 ml-2">Stroke</Label>
                <input type="color" value={topText.strokeColor} onChange={(e) => setTopText({ ...topText, strokeColor: e.target.value })} className="h-7 w-10 rounded border cursor-pointer" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Vertical Position</Label>
                <input type="range" min={0} max={100} value={topText.y * 100} onChange={(e) => setTopText({ ...topText, y: Number(e.target.value) / 100 })} className="w-full accent-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Bottom Text</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
              <Input
                placeholder="Enter bottom text..."
                value={bottomText.text}
                onChange={(e) => setBottomText({ ...bottomText, text: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <Label className="text-xs w-12">Size</Label>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setBottomText({ ...bottomText, fontSize: Math.max(16, bottomText.fontSize - 4) })}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-xs w-8 text-center">{bottomText.fontSize}</span>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setBottomText({ ...bottomText, fontSize: Math.min(96, bottomText.fontSize + 4) })}>
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  variant={bottomText.bold ? "default" : "outline"}
                  size="icon"
                  className="h-7 w-7 ml-auto"
                  onClick={() => setBottomText({ ...bottomText, bold: !bottomText.bold })}
                >
                  <Bold className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex gap-2 items-center">
                <Label className="text-xs w-12">Color</Label>
                <input type="color" value={bottomText.color} onChange={(e) => setBottomText({ ...bottomText, color: e.target.value })} className="h-7 w-10 rounded border cursor-pointer" />
                <Label className="text-xs w-12 ml-2">Stroke</Label>
                <input type="color" value={bottomText.strokeColor} onChange={(e) => setBottomText({ ...bottomText, strokeColor: e.target.value })} className="h-7 w-10 rounded border cursor-pointer" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Vertical Position</Label>
                <input type="range" min={0} max={100} value={bottomText.y * 100} onChange={(e) => setBottomText({ ...bottomText, y: Number(e.target.value) / 100 })} className="w-full accent-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      )}
    </div>
  )
}
