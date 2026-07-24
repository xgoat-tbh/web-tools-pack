"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { FileDropzone } from "@/components/file-dropzone"
import { Download, Lock, Unlock } from "lucide-react"

export default function ImageResizerPage() {
  const [image, setImage] = useState<string | null>(null)
  const [resized, setResized] = useState<string | null>(null)
  const [origW, setOrigW] = useState(0)
  const [origH, setOrigH] = useState(0)
  const [width, setWidth] = useState("")
  const [height, setHeight] = useState("")
  const [keepAspect, setKeepAspect] = useState(true)

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const src = reader.result as string
      setImage(src)
      const img = new Image()
      img.onload = () => { setOrigW(img.width); setOrigH(img.height); setWidth(String(img.width)); setHeight(String(img.height)) }
      img.src = src
    }
    reader.readAsDataURL(file)
    setResized(null)
  }, [])

  const clear = () => { setImage(null); setResized(null); setOrigW(0); setOrigH(0); setWidth(""); setHeight("") }

  const onWidthChange = (v: string) => {
    setWidth(v)
    if (keepAspect && origW) setHeight(String(Math.round((parseInt(v) || 0) * origH / origW)))
  }

  const onHeightChange = (v: string) => {
    setHeight(v)
    if (keepAspect && origH) setWidth(String(Math.round((parseInt(v) || 0) * origW / origH)))
  }

  const resize = () => {
    if (!image) return
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = parseInt(width) || img.width
      canvas.height = parseInt(height) || img.height
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      setResized(canvas.toDataURL("image/png"))
    }
    img.src = image
  }

  const download = () => {
    if (!resized) return
    const a = document.createElement("a"); a.href = resized; a.download = `resized_${width}x${height}.png`; a.click()
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Image Resizer</h1>
      <p className="text-muted-foreground text-sm">Resize images to specific dimensions.</p>

      <Card>
        <CardContent className="pt-6 space-y-5">
          <FileDropzone onFile={handleFile} preview={image} onClear={clear} label="Drop your image here to resize" hint="Supports all common image formats" />

          {image && (
            <>
              {origW > 0 && (
                <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                  Original dimensions: <span className="font-mono font-medium">{origW} × {origH}px</span>
                </div>
              )}
              <div className="flex gap-3 items-end flex-wrap">
                <div className="space-y-1.5">
                  <Label className="text-xs">Width (px)</Label>
                  <Input type="number" value={width} onChange={(e) => onWidthChange(e.target.value)} className="w-28 font-mono" />
                </div>
                <button
                  onClick={() => setKeepAspect(!keepAspect)}
                  className="mb-1 rounded-md p-2 hover:bg-muted transition-colors"
                  title={keepAspect ? "Unlock aspect ratio" : "Lock aspect ratio"}
                >
                  {keepAspect ? <Lock className="h-4 w-4 text-primary" /> : <Unlock className="h-4 w-4 text-muted-foreground" />}
                </button>
                <div className="space-y-1.5">
                  <Label className="text-xs">Height (px)</Label>
                  <Input type="number" value={height} onChange={(e) => onHeightChange(e.target.value)} className="w-28 font-mono" />
                </div>
                <Button onClick={resize}>Resize</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {resized && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Resized Image</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border overflow-hidden bg-muted/20"><img src={resized} alt="Resized" className="max-w-full max-h-96 mx-auto object-contain" /></div>
            <Button onClick={download} variant="secondary" className="gap-2"><Download className="h-4 w-4" /> Download Resized</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
