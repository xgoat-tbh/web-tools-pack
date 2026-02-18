"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { FileDropzone } from "@/components/file-dropzone"
import { Download, ArrowRight } from "lucide-react"

const formats = [
  { label: "PNG", mime: "image/png", ext: "png" },
  { label: "JPEG", mime: "image/jpeg", ext: "jpg" },
  { label: "WebP", mime: "image/webp", ext: "webp" },
]

export default function ImageConverterPage() {
  const [image, setImage] = useState<string | null>(null)
  const [converted, setConverted] = useState<string | null>(null)
  const [format, setFormat] = useState("image/webp")
  const [quality, setQuality] = useState(0.9)
  const [fileName, setFileName] = useState("")
  const [sourceFormat, setSourceFormat] = useState("")

  const handleFile = useCallback((file: File) => {
    setFileName(file.name.split(".")[0])
    setSourceFormat(file.type.split("/")[1]?.toUpperCase() || "Unknown")
    const reader = new FileReader()
    reader.onload = () => setImage(reader.result as string)
    reader.readAsDataURL(file)
    setConverted(null)
  }, [])

  const clear = () => { setImage(null); setConverted(null); setFileName(""); setSourceFormat("") }

  const convert = () => {
    if (!image) return
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width; canvas.height = img.height
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0)
      setConverted(canvas.toDataURL(format, quality))
    }
    img.src = image
  }

  const download = () => {
    if (!converted) return
    const ext = formats.find((f) => f.mime === format)?.ext || "png"
    const a = document.createElement("a"); a.href = converted; a.download = `${fileName}.${ext}`; a.click()
  }

  const targetLabel = formats.find((f) => f.mime === format)?.label || "PNG"

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Image Converter</h1>
      <p className="text-muted-foreground text-sm">Convert images between PNG, JPEG, and WebP formats.</p>

      <Card>
        <CardContent className="pt-6 space-y-5">
          <FileDropzone onFile={handleFile} preview={image} onClear={clear} label="Drop your image here to convert" hint="Supports PNG, JPG, WebP, BMP, GIF" />

          <div className="space-y-4">
            {/* Format selector as buttons */}
            <div className="space-y-2">
              <Label className="text-sm">Output Format</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {sourceFormat && (
                  <>
                    <span className="rounded-lg bg-muted px-3 py-2 text-sm font-medium">{sourceFormat}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </>
                )}
                {formats.map((f) => (
                  <button
                    key={f.mime}
                    onClick={() => setFormat(f.mime)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors border ${
                      format === f.mime
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 hover:bg-muted border-transparent"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Quality</Label>
                <span className="text-sm font-mono font-medium text-primary">{Math.round(quality * 100)}%</span>
              </div>
              <input type="range" min={0.1} max={1} step={0.05} value={quality} onChange={(e) => setQuality(parseFloat(e.target.value))} className="w-full accent-primary h-2 rounded-full" />
            </div>

            <Button onClick={convert} disabled={!image} className="w-full sm:w-auto">
              Convert to {targetLabel}
            </Button>
          </div>
        </CardContent>
      </Card>

      {converted && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Converted Image</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border overflow-hidden bg-muted/20"><img src={converted} alt="Converted" className="max-w-full max-h-96 mx-auto object-contain" /></div>
            <Button onClick={download} variant="secondary" className="gap-2"><Download className="h-4 w-4" /> Download {targetLabel}</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
