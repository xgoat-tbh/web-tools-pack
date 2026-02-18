"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { FileDropzone } from "@/components/file-dropzone"
import { Download } from "lucide-react"

export default function ImageCompressorPage() {
  const [image, setImage] = useState<string | null>(null)
  const [compressed, setCompressed] = useState<string | null>(null)
  const [quality, setQuality] = useState(0.7)
  const [originalSize, setOriginalSize] = useState(0)
  const [compressedSize, setCompressedSize] = useState(0)

  const handleFile = useCallback((file: File) => {
    setOriginalSize(file.size)
    const reader = new FileReader()
    reader.onload = () => setImage(reader.result as string)
    reader.readAsDataURL(file)
    setCompressed(null)
  }, [])

  const clear = () => { setImage(null); setCompressed(null); setOriginalSize(0); setCompressedSize(0) }

  const compress = () => {
    if (!image) return
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width; canvas.height = img.height
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0)
      const dataUrl = canvas.toDataURL("image/jpeg", quality)
      setCompressed(dataUrl)
      setCompressedSize(Math.round((dataUrl.length * 3) / 4))
    }
    img.src = image
  }

  const download = () => {
    if (!compressed) return
    const a = document.createElement("a"); a.href = compressed; a.download = "compressed.jpg"; a.click()
  }

  const fmt = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / 1048576).toFixed(2) + " MB"
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Image Compressor</h1>
      <p className="text-muted-foreground text-sm">Compress images in-browser. No uploads to any server.</p>

      <Card>
        <CardContent className="pt-6 space-y-5">
          <FileDropzone onFile={handleFile} preview={image} onClear={clear} label="Drop your image here to compress" hint="PNG, JPG, WebP — processed 100% locally" />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Compression Quality</Label>
              <span className="text-sm font-mono font-medium text-primary">{Math.round(quality * 100)}%</span>
            </div>
            <input type="range" min={0.1} max={1} step={0.05} value={quality} onChange={(e) => setQuality(parseFloat(e.target.value))} className="w-full accent-primary h-2 rounded-full" />
            <div className="flex justify-between text-xs text-muted-foreground"><span>Smallest file</span><span>Best quality</span></div>
          </div>

          <Button onClick={compress} disabled={!image} className="w-full sm:w-auto">Compress Image</Button>
        </CardContent>
      </Card>

      {compressed && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Compression Result</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted/50 p-3 text-center"><p className="text-xs text-muted-foreground">Original</p><p className="text-sm font-semibold">{fmt(originalSize)}</p></div>
              <div className="rounded-lg bg-muted/50 p-3 text-center"><p className="text-xs text-muted-foreground">Compressed</p><p className="text-sm font-semibold text-primary">{fmt(compressedSize)}</p></div>
              <div className="rounded-lg bg-green-500/10 p-3 text-center"><p className="text-xs text-muted-foreground">Saved</p><p className="text-sm font-semibold text-green-500">{((1 - compressedSize / originalSize) * 100).toFixed(1)}%</p></div>
            </div>
            <div className="rounded-xl border overflow-hidden bg-muted/20"><img src={compressed} alt="Compressed" className="max-w-full max-h-96 mx-auto object-contain" /></div>
            <Button onClick={download} variant="secondary" className="gap-2"><Download className="h-4 w-4" /> Download Compressed</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
