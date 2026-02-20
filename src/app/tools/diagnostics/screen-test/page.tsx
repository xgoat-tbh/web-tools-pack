"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ScanLine, Monitor, Maximize, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const COLORS = [
  { name: "White", value: "bg-white" },
  { name: "Black", value: "bg-black" },
  { name: "Red", value: "bg-red-600" },
  { name: "Green", value: "bg-green-600" },
  { name: "Blue", value: "bg-blue-600" },
  { name: "Yellow", value: "bg-yellow-400" },
  { name: "Cyan", value: "bg-cyan-400" },
  { name: "Magenta", value: "bg-fuchsia-600" },
]

export default function ScreenTest() {
  const [activeColor, setActiveColor] = useState<string | null>(null)
  const [refreshRate, setRefreshRate] = useState<number | null>(null)
  const requestRef = useRef<number>()
  const startTimeRef = useRef<number>()
  const framesRef = useRef(0)

  useEffect(() => {
    const measureRefreshRate = (time: number) => {
      if (!startTimeRef.current) startTimeRef.current = time
      framesRef.current++
      
      const elapsed = time - startTimeRef.current
      if (elapsed >= 1000) {
        setRefreshRate(Math.round((framesRef.current * 1000) / elapsed))
        framesRef.current = 0
        startTimeRef.current = time
      }
      
      requestRef.current = requestAnimationFrame(measureRefreshRate)
    }
    
    requestRef.current = requestAnimationFrame(measureRefreshRate)
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveColor(null)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  if (activeColor) {
    return (
      <div 
        className={`fixed inset-0 z-50 ${activeColor} cursor-pointer`} 
        onClick={() => setActiveColor(null)}
      >
        <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full opacity-0 hover:opacity-100 transition-opacity">
          <X className="w-6 h-6" />
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-black/20 text-sm font-bold select-none pointer-events-none mix-blend-difference">
          Click or ESC to exit
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ScanLine className="w-8 h-8" />
            Screen Analyzer
          </h1>
          <p className="text-muted-foreground">
            Dead pixel check and refresh rate estimator.
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Estimated Refresh Rate</div>
          <div className="text-2xl font-bold">{refreshRate ? `${refreshRate} Hz` : "Measuring..."}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {COLORS.map((c) => (
          <Button
            key={c.name}
            variant="outline"
            className="h-32 flex flex-col gap-2 hover:scale-105 transition-transform"
            onClick={() => setActiveColor(c.value)}
          >
            <div className={`w-12 h-12 rounded-full border shadow-sm ${c.value}`} />
            <span className="font-semibold">{c.name}</span>
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">Instructions</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Click a color to enter full-screen mode.</li>
            <li>Look closely at your screen for any pixels that don't match the color (dead or stuck pixels).</li>
            <li>Cycle through all colors (especially White, Black, Red, Green, Blue) for a complete check.</li>
            <li>Press <strong>ESC</strong> or click anywhere to exit full-screen mode.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
