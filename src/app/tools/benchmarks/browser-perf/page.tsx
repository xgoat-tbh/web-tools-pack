"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Monitor, RotateCcw, Play, Square, Zap, AlertTriangle } from "lucide-react"

interface BenchResult {
  avgFPS: number
  minFPS: number
  maxFPS: number
  droppedFrames: number
  totalFrames: number
  duration: number
  score: number
}

export default function BrowserPerfPage() {
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle")
  const [currentFPS, setCurrentFPS] = useState(0)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<BenchResult | null>(null)
  const [best, setBest] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef(0)
  const runningRef = useRef(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("wtp-perf-best")
      if (saved) setBest(parseFloat(saved))
    } catch {}
  }, [])

  const runBenchmark = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setPhase("running")
    setResult(null)
    runningRef.current = true

    const w = canvas.width
    const h = canvas.height
    const DURATION = 8000 // 8 seconds
    const PARTICLE_COUNT = 800
    const startTime = performance.now()

    // Generate particles
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      r: 2 + Math.random() * 4,
      hue: Math.random() * 360,
    }))

    const fpsSamples: number[] = []
    let lastFrame = startTime
    let frameCount = 0

    const render = (now: number) => {
      if (!runningRef.current) return

      const elapsed = now - startTime
      const dt = now - lastFrame
      lastFrame = now
      frameCount++

      if (dt > 0) {
        const fps = 1000 / dt
        fpsSamples.push(fps)
        setCurrentFPS(Math.round(fps))
      }

      setProgress(Math.min(100, (elapsed / DURATION) * 100))

      if (elapsed >= DURATION) {
        runningRef.current = false

        // Calculate results
        const validFPS = fpsSamples.filter((f) => f > 0 && f < 300)
        const avgFPS = validFPS.reduce((a, b) => a + b, 0) / validFPS.length
        const minFPS = Math.min(...validFPS)
        const maxFPS = Math.min(Math.max(...validFPS), 240)
        const dropped = validFPS.filter((f) => f < 30).length
        const score = Math.round(
          Math.min(100, (avgFPS / 60) * 70 + ((validFPS.length - dropped) / validFPS.length) * 30)
        )

        const res: BenchResult = {
          avgFPS: Math.round(avgFPS),
          minFPS: Math.round(minFPS),
          maxFPS: Math.round(maxFPS),
          droppedFrames: dropped,
          totalFrames: frameCount,
          duration: Math.round(elapsed / 1000),
          score,
        }

        setResult(res)
        setPhase("done")

        if (score > best) {
          setBest(score)
          localStorage.setItem("wtp-perf-best", String(score))
        }
        return
      }

      // Clear
      ctx.fillStyle = `rgba(0, 0, 0, 0.15)`
      ctx.fillRect(0, 0, w, h)

      // Phase progression: increase complexity over time
      const complexity = Math.min(1, elapsed / (DURATION * 0.6))
      const activeCount = Math.floor(PARTICLE_COUNT * (0.3 + complexity * 0.7))

      // Update & draw particles
      for (let i = 0; i < activeCount; i++) {
        const p = particles[i]
        p.x += p.vx * (1 + complexity)
        p.y += p.vy * (1 + complexity)
        p.hue = (p.hue + 0.5) % 360

        // Bounce
        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1
        p.x = Math.max(0, Math.min(w, p.x))
        p.y = Math.max(0, Math.min(h, p.y))

        // Draw with glow
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, 0.8)`
        ctx.fill()

        // Connections (expensive — ramp up)
        if (complexity > 0.3 && i % 3 === 0) {
          for (let j = i + 1; j < Math.min(i + 8, activeCount); j++) {
            const p2 = particles[j]
            const dx = p.x - p2.x
            const dy = p.y - p2.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < 80) {
              ctx.beginPath()
              ctx.moveTo(p.x, p.y)
              ctx.lineTo(p2.x, p2.y)
              ctx.strokeStyle = `hsla(${p.hue}, 60%, 50%, ${0.3 * (1 - dist / 80)})`
              ctx.lineWidth = 0.5
              ctx.stroke()
            }
          }
        }
      }

      // Extra stress: rotating shapes in later phases
      if (complexity > 0.5) {
        const t = elapsed * 0.001
        for (let i = 0; i < 12 * complexity; i++) {
          ctx.save()
          ctx.translate(w / 2 + Math.cos(t + i) * 150, h / 2 + Math.sin(t + i * 0.7) * 100)
          ctx.rotate(t * (i + 1) * 0.2)
          ctx.fillStyle = `hsla(${(i * 30 + elapsed * 0.1) % 360}, 70%, 50%, 0.15)`
          ctx.fillRect(-20, -20, 40, 40)
          ctx.restore()
        }
      }

      animRef.current = requestAnimationFrame(render)
    }

    animRef.current = requestAnimationFrame(render)
  }, [best])

  const stop = () => {
    runningRef.current = false
    cancelAnimationFrame(animRef.current)
    setPhase("idle")
    setProgress(0)
  }

  const getRating = (score: number) => {
    if (score >= 90) return { label: "Excellent", color: "text-green-400" }
    if (score >= 70) return { label: "Good", color: "text-lime-400" }
    if (score >= 50) return { label: "Average", color: "text-yellow-400" }
    if (score >= 30) return { label: "Below Average", color: "text-orange-400" }
    return { label: "Poor", color: "text-red-400" }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Monitor className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Browser Performance Test</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Stress-test your browser&apos;s rendering performance with 800 animated particles,
        collision detection, and dynamic connections.
      </p>

      {/* Canvas */}
      <Card className="overflow-hidden">
        <CardContent className="p-0 relative">
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            className="w-full h-auto bg-black rounded-lg"
          />

          {/* Overlay */}
          {phase === "running" && (
            <div className="absolute top-3 right-3 flex items-center gap-3">
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                currentFPS >= 50 ? "bg-green-500/20 text-green-400" :
                currentFPS >= 30 ? "bg-yellow-500/20 text-yellow-400" :
                "bg-red-500/20 text-red-400"
              }`}>
                {currentFPS} FPS
              </span>
            </div>
          )}

          {phase === "idle" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <Button onClick={runBenchmark} className="gap-2">
                <Play className="h-4 w-4" /> Run Benchmark
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress */}
      {phase === "running" && (
        <div className="space-y-2">
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-100"
              style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Testing... {Math.round(progress)}%</span>
            <Button variant="ghost" size="sm" onClick={stop} className="gap-1 h-6 text-xs">
              <Square className="h-3 w-3" /> Stop
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          <Card>
            <CardContent className="p-6 text-center space-y-2">
              <div className="text-5xl font-bold font-mono">{result.score}<span className="text-lg text-muted-foreground">/100</span></div>
              <p className={`font-semibold ${getRating(result.score).color}`}>{getRating(result.score).label}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card><CardContent className="p-3 text-center">
              <p className="text-lg font-bold font-mono text-primary">{result.avgFPS}</p>
              <p className="text-[10px] text-muted-foreground">Avg FPS</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-lg font-bold font-mono">{result.minFPS}</p>
              <p className="text-[10px] text-muted-foreground">Min FPS</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-lg font-bold font-mono">{result.maxFPS}</p>
              <p className="text-[10px] text-muted-foreground">Max FPS</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-lg font-bold font-mono">{result.totalFrames}</p>
              <p className="text-[10px] text-muted-foreground">Frames</p>
            </CardContent></Card>
          </div>

          {result.droppedFrames > 0 && (
            <div className="flex items-center gap-2 text-xs text-yellow-500">
              <AlertTriangle className="h-3.5 w-3.5" />
              {result.droppedFrames} frames dropped below 30 FPS
            </div>
          )}

          <Button variant="outline" size="sm" onClick={() => { setPhase("idle"); setResult(null) }} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" /> Run Again
          </Button>
        </>
      )}

      {best > 0 && !result && (
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Best Score</p>
              <p className="text-sm font-bold font-mono">{best}/100</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
