"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function QrGeneratorPage() {
  const [text, setText] = useState("https://example.com")
  const [size, setSize] = useState(256)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!text) return
    // Dynamic import of qrcode
    import("qrcode").then((QRCode) => {
      const canvas = canvasRef.current
      if (!canvas) return
      QRCode.toCanvas(canvas, text, { width: size, margin: 2, color: { dark: "#000000", light: "#ffffff" } })
    }).catch(() => {
      // Fallback: draw a placeholder
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = size; canvas.height = size
      const ctx = canvas.getContext("2d")!
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, size, size)
      ctx.fillStyle = "#000"; ctx.font = "14px sans-serif"; ctx.textAlign = "center"
      ctx.fillText("QR Code", size / 2, size / 2)
      ctx.fillText("(install qrcode pkg)", size / 2, size / 2 + 20)
    })
  }, [text, size])

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement("a")
    a.href = canvas.toDataURL("image/png")
    a.download = "qrcode.png"
    a.click()
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">QR Code Generator</h1>
      <p className="text-muted-foreground text-sm">Generate QR codes from text or URLs.</p>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Content</Label>
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter text or URL..." />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Size: {size}px</Label>
            <input type="range" min={128} max={512} step={32} value={size} onChange={(e) => setSize(parseInt(e.target.value))} className="w-60" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Generated QR Code</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <canvas ref={canvasRef} className="rounded border" />
          <Button onClick={download} size="sm" variant="secondary">Download PNG</Button>
        </CardContent>
      </Card>
    </div>
  )
}
