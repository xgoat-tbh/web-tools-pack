"use client"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/copy-button"
import { FileDropzone } from "@/components/file-dropzone"
import { Pipette } from "lucide-react"

export default function ColorPickerPage() {
  const [image, setImage] = useState<string | null>(null)
  const [color, setColor] = useState("")
  const [colors, setColors] = useState<string[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const src = reader.result as string
      setImage(src)
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        canvas.width = img.width; canvas.height = img.height
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(img, 0, 0)
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }, [])

  const clear = () => { setImage(null); setColor(""); setColors([]) }

  const pickColor = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    const pixel = ctx.getImageData(x, y, 1, 1).data
    const hex = `#${pixel[0].toString(16).padStart(2, "0")}${pixel[1].toString(16).padStart(2, "0")}${pixel[2].toString(16).padStart(2, "0")}`
    setColor(hex)
    setColors((prev) => [hex, ...prev.filter((c) => c !== hex)].slice(0, 12))
  }, [])

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Color Picker from Image</h1>
      <p className="text-muted-foreground text-sm">Click anywhere on an image to extract colors.</p>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {!image ? (
            <FileDropzone onFile={handleFile} label="Drop an image to pick colors from" hint="Click any pixel to extract its color" />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Pipette className="h-4 w-4" />
                  Click anywhere on the image to pick a color
                </div>
                <button onClick={clear} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline">
                  Change image
                </button>
              </div>
              <div className="rounded-xl border-2 border-dashed border-border overflow-hidden bg-muted/20">
                <canvas
                  ref={canvasRef}
                  onClick={pickColor}
                  className="cursor-crosshair max-w-full max-h-[500px] mx-auto object-contain block"
                  style={{ width: "100%", height: "auto" }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {color && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Selected Color</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl border-2 shadow-inner" style={{ backgroundColor: color }} />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-mono text-xl font-bold">{color.toUpperCase()}</p>
                  <CopyButton text={color} />
                </div>
                <p className="text-sm text-muted-foreground">
                  RGB({parseInt(color.slice(1, 3), 16)}, {parseInt(color.slice(3, 5), 16)}, {parseInt(color.slice(5, 7), 16)})
                </p>
              </div>
            </div>

            {colors.length > 1 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Picked Colors</p>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((c, i) => (
                    <button
                      key={i}
                      className="w-10 h-10 rounded-lg border-2 transition-transform hover:scale-110 shadow-sm"
                      style={{ backgroundColor: c, borderColor: c === color ? "hsl(var(--primary))" : "transparent" }}
                      title={c}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
