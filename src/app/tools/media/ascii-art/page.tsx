"use client"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Terminal, Upload, Download, RotateCcw, Copy, Check, Image, Type } from "lucide-react"

const ASCII_CHARS_DENSE = "@%#*+=-:. "
const ASCII_CHARS_STANDARD = "@#S%?*+;:,. "
const ASCII_CHARS_LIGHT = "#@&?/;:,. "

type CharSet = "dense" | "standard" | "light"
type Mode = "image" | "text"

// Simple bitmap font for text-to-ASCII (5x7 grid per character)
const FONT: Record<string, string[]> = {
  A: ["  #  ","  #  "," # # ","#####","#   #","#   #","#   #"],
  B: ["#### ","#   #","#   #","#### ","#   #","#   #","#### "],
  C: [" ### ","#   #","#    ","#    ","#    ","#   #"," ### "],
  D: ["#### ","#   #","#   #","#   #","#   #","#   #","#### "],
  E: ["#####","#    ","#    ","#### ","#    ","#    ","#####"],
  F: ["#####","#    ","#    ","#### ","#    ","#    ","#    "],
  G: [" ### ","#   #","#    ","# ###","#   #","#   #"," ### "],
  H: ["#   #","#   #","#   #","#####","#   #","#   #","#   #"],
  I: [" ### ","  #  ","  #  ","  #  ","  #  ","  #  "," ### "],
  J: ["  ###","   # ","   # ","   # ","   # ","#  # "," ##  "],
  K: ["#   #","#  # ","# #  ","##   ","# #  ","#  # ","#   #"],
  L: ["#    ","#    ","#    ","#    ","#    ","#    ","#####"],
  M: ["#   #","## ##","# # #","#   #","#   #","#   #","#   #"],
  N: ["#   #","##  #","# # #","#  ##","#   #","#   #","#   #"],
  O: [" ### ","#   #","#   #","#   #","#   #","#   #"," ### "],
  P: ["#### ","#   #","#   #","#### ","#    ","#    ","#    "],
  Q: [" ### ","#   #","#   #","#   #","# # #","#  # "," ## #"],
  R: ["#### ","#   #","#   #","#### ","# #  ","#  # ","#   #"],
  S: [" ### ","#   #","#    "," ### ","    #","#   #"," ### "],
  T: ["#####","  #  ","  #  ","  #  ","  #  ","  #  ","  #  "],
  U: ["#   #","#   #","#   #","#   #","#   #","#   #"," ### "],
  V: ["#   #","#   #","#   #","#   #"," # # "," # # ","  #  "],
  W: ["#   #","#   #","#   #","#   #","# # #","## ##","#   #"],
  X: ["#   #","#   #"," # # ","  #  "," # # ","#   #","#   #"],
  Y: ["#   #","#   #"," # # ","  #  ","  #  ","  #  ","  #  "],
  Z: ["#####","    #","   # ","  #  "," #   ","#    ","#####"],
  "0": [" ### ","#   #","#  ##","# # #","##  #","#   #"," ### "],
  "1": ["  #  "," ##  ","  #  ","  #  ","  #  ","  #  "," ### "],
  "2": [" ### ","#   #","    #","  ## "," #   ","#    ","#####"],
  "3": [" ### ","#   #","    #"," ### ","    #","#   #"," ### "],
  "4": ["   # ","  ## "," # # ","#  # ","#####","   # ","   # "],
  "5": ["#####","#    ","#### ","    #","    #","#   #"," ### "],
  "6": [" ### ","#    ","#    ","#### ","#   #","#   #"," ### "],
  "7": ["#####","    #","   # ","  #  ","  #  ","  #  ","  #  "],
  "8": [" ### ","#   #","#   #"," ### ","#   #","#   #"," ### "],
  "9": [" ### ","#   #","#   #"," ####","    #","    #"," ### "],
  "!": ["  #  ","  #  ","  #  ","  #  ","  #  ","     ","  #  "],
  "?": [" ### ","#   #","    #","  ## ","  #  ","     ","  #  "],
  ".": ["     ","     ","     ","     ","     ","     ","  #  "],
  ",": ["     ","     ","     ","     ","  #  ","  #  "," #   "],
  " ": ["     ","     ","     ","     ","     ","     ","     "],
  "-": ["     ","     ","     ","#####","     ","     ","     "],
  "@": [" ### ","#   #","# ###","# # #","# ## ","#    "," ### "],
  "#": [" # # "," # # ","#####"," # # ","#####"," # # "," # # "],
  "'": ["  #  ","  #  ","     ","     ","     ","     ","     "],
}

function textToAscii(text: string, fillChar: string = "#"): string {
  const upper = text.toUpperCase()
  const rows: string[] = Array(7).fill("")

  for (let i = 0; i < upper.length; i++) {
    const ch = upper[i]
    const glyph = FONT[ch] || FONT[" "]
    for (let row = 0; row < 7; row++) {
      rows[row] += glyph[row].replace(/#/g, fillChar) + " "
    }
  }

  return rows.join("\n")
}

export default function AsciiArtPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<Mode>("image")
  const [image, setImage] = useState<string | null>(null)
  const [textInput, setTextInput] = useState("")
  const [fillChar, setFillChar] = useState("#")
  const [ascii, setAscii] = useState("")
  const [width, setWidth] = useState(100)
  const [charSet, setCharSet] = useState<CharSet>("standard")
  const [inverted, setInverted] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [copied, setCopied] = useState(false)

  const getChars = (set: CharSet) => {
    switch (set) {
      case "dense": return ASCII_CHARS_DENSE
      case "light": return ASCII_CHARS_LIGHT
      default: return ASCII_CHARS_STANDARD
    }
  }

  const generateFromImage = useCallback((imgSrc: string, w: number, set: CharSet, invert: boolean) => {
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const aspect = img.height / img.width
      const h = Math.round(w * aspect * 0.5)
      canvas.width = w
      canvas.height = h
      ctx.drawImage(img, 0, 0, w, h)

      const data = ctx.getImageData(0, 0, w, h).data
      const chars = getChars(set)
      let result = ""

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4
          let brightness = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255
          if (invert) brightness = 1 - brightness
          const charIdx = Math.floor(brightness * (chars.length - 1))
          result += chars[charIdx]
        }
        result += "\n"
      }
      setAscii(result)
    }
    img.src = imgSrc
  }, [])

  const generateFromText = () => {
    if (!textInput.trim()) return
    setAscii(textToAscii(textInput, fillChar || "#"))
  }

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file)
    setImage(url)
    generateFromImage(url, width, charSet, inverted)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith("image/")) handleFile(file)
  }

  const regenerate = () => {
    if (mode === "image" && image) generateFromImage(image, width, charSet, inverted)
    if (mode === "text") generateFromText()
  }

  const copyAscii = () => {
    navigator.clipboard.writeText(ascii)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadTxt = () => {
    const blob = new Blob([ascii], { type: "text/plain" })
    const link = document.createElement("a")
    link.download = "ascii-art.txt"
    link.href = URL.createObjectURL(blob)
    link.click()
  }

  const reset = () => {
    setImage(null)
    setTextInput("")
    setAscii("")
  }

  const hasOutput = ascii.length > 0

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center gap-2">
        <Terminal className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">ASCII Art Generator</h1>
      </div>
      <p className="text-muted-foreground">Convert images or text into ASCII art.</p>

      {/* Mode tabs */}
      <div className="flex gap-1.5">
        <button
          onClick={() => { setMode("image"); setAscii(""); }}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
            mode === "image" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          <Image className="h-3.5 w-3.5" /> Image to ASCII
        </button>
        <button
          onClick={() => { setMode("text"); setAscii(""); }}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
            mode === "text" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          <Type className="h-3.5 w-3.5" /> Text to ASCII
        </button>
      </div>

      {/* Image mode - upload */}
      {mode === "image" && !image && (
        <Card>
          <CardContent className="p-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
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
      )}

      {/* Text mode input */}
      {mode === "text" && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Input
              placeholder="Type something..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="text-lg font-medium"
              onKeyDown={(e) => { if (e.key === "Enter") generateFromText() }}
            />
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-xs">Fill Character</Label>
                <Input
                  value={fillChar}
                  onChange={(e) => setFillChar(e.target.value.slice(0, 1))}
                  className="w-12 text-center font-mono"
                  maxLength={1}
                />
              </div>
              <Button size="sm" onClick={generateFromText} className="gap-1.5">
                Generate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image mode controls */}
      {mode === "image" && image && (
        <Card>
          <CardContent className="flex flex-wrap items-end gap-4 p-4">
            <div className="space-y-1">
              <Label className="text-xs">Width (chars)</Label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={40}
                  max={200}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="w-32 accent-primary"
                />
                <span className="text-xs text-muted-foreground w-8">{width}</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Character Set</Label>
              <div className="flex gap-1">
                {(["dense", "standard", "light"] as CharSet[]).map((cs) => (
                  <button
                    key={cs}
                    onClick={() => setCharSet(cs)}
                    className={`rounded px-2.5 py-1 text-xs capitalize transition-colors ${
                      charSet === cs ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {cs}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setInverted(!inverted)}
              className={`rounded px-2.5 py-1 text-xs transition-colors ${
                inverted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {inverted ? "Inverted ✓" : "Invert"}
            </button>

            <Button size="sm" onClick={regenerate} className="gap-1.5">
              Generate
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Output */}
      {hasOutput && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Output</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyAscii} className="gap-1.5 h-7">
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button variant="outline" size="sm" onClick={downloadTxt} className="gap-1.5 h-7">
                  <Download className="h-3 w-3" /> .txt
                </Button>
                <Button variant="outline" size="sm" onClick={reset} className="h-7">
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <pre className={`overflow-x-auto whitespace-pre font-mono text-foreground select-all ${
              mode === "image"
                ? "text-[4px] leading-[5px] sm:text-[5px] sm:leading-[6px] md:text-[6px] md:leading-[7px]"
                : "text-xs leading-tight sm:text-sm"
            }`}>
              {ascii}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
