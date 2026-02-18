"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { FileDropzone } from "@/components/file-dropzone"
import { Download } from "lucide-react"

export default function BlurPixelatePage() {
  const [image, setImage] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [mode, setMode] = useState<"blur" | "pixelate">("blur")
  const [intensity, setIntensity] = useState(10)

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => { setImage(reader.result as string); setResult(null) }
    reader.readAsDataURL(file)
  }, [])

  const clear = () => { setImage(null); setResult(null) }

  const apply = () => {
    if (!image) return
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width; canvas.height = img.height
      const ctx = canvas.getContext("2d")!

      if (mode === "blur") {
        ctx.filter = `blur(${intensity}px)`
        ctx.drawImage(img, 0, 0)
      } else {
        const size = Math.max(1, intensity)
        const w = Math.ceil(img.width / size)
        const h = Math.ceil(img.height / size)
        ctx.imageSmoothingEnabled = false
        const tempCanvas = document.createElement("canvas")
        tempCanvas.width = w; tempCanvas.height = h
        const tempCtx = tempCanvas.getContext("2d")!
        tempCtx.drawImage(img, 0, 0, w, h)
        ctx.drawImage(tempCanvas, 0, 0, w, h, 0, 0, img.width, img.height)
      }

      setResult(canvas.toDataURL("image/png"))
    }
    img.src = image
  }

  const download = () => {
    if (!result) return
    const a = document.createElement("a"); a.href = result; a.download = `${mode}.png`; a.click()
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Blur / Pixelate Image</h1>
      <p className="text-muted-foreground text-sm">Apply blur or pixelation effects to your images.</p>

      <Card>
        <CardContent className="pt-6 space-y-5">
          <FileDropzone onFile={handleFile} preview={image} onClear={clear} label="Drop your image here" hint="Apply blur or pixelation effects" />

          {image && (
            <div className="space-y-4">
              {/* Effect mode toggle */}
              <div className="space-y-2">
                <Label className="text-sm">Effect Mode</Label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode("blur")}
                    className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-colors border ${
                      mode === "blur"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 hover:bg-muted border-transparent"
                    }`}
                  >
                    Blur
                  </button>
                  <button
                    onClick={() => setMode("pixelate")}
                    className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-colors border ${
                      mode === "pixelate"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 hover:bg-muted border-transparent"
                    }`}
                  >
                    Pixelate
                  </button>
                </div>
              </div>

              {/* Intensity slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Intensity</Label>
                  <span className="text-sm font-mono font-medium text-primary">{intensity}</span>
                </div>
                <input type="range" min={1} max={50} value={intensity} onChange={(e) => setIntensity(parseInt(e.target.value))} className="w-full accent-primary h-2 rounded-full" />
                <div className="flex justify-between text-xs text-muted-foreground"><span>Subtle</span><span>Heavy</span></div>
              </div>

              <Button onClick={apply} className="w-full sm:w-auto">Apply {mode === "blur" ? "Blur" : "Pixelation"}</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Result</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border overflow-hidden bg-muted/20"><img src={result} alt="Result" className="max-w-full max-h-96 mx-auto object-contain" /></div>
            <Button onClick={download} variant="secondary" className="gap-2"><Download className="h-4 w-4" /> Download Result</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
