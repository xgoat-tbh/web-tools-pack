"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowDownUp, RotateCcw, Trophy, Zap } from "lucide-react"

export default function ScrollSpeedPage() {
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle")
  const [distance, setDistance] = useState(0)
  const [timeLeft, setTimeLeft] = useState(10)
  const [best, setBest] = useState(0)
  const [history, setHistory] = useState<number[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const startRef = useRef(0)
  const distRef = useRef(0)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("wtp-scroll-best")
      if (saved) setBest(parseFloat(saved))
    } catch {}
  }, [])

  const start = useCallback(() => {
    setPhase("running")
    setDistance(0)
    distRef.current = 0
    setTimeLeft(10)
    startRef.current = Date.now()

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000
      const remaining = Math.max(0, 10 - elapsed)
      setTimeLeft(Math.ceil(remaining))
      if (remaining <= 0) {
        clearInterval(timerRef.current)
        setPhase("done")
      }
    }, 50)
  }, [])

  useEffect(() => {
    const handler = (e: WheelEvent) => {
      if (phase !== "running") return
      e.preventDefault()
      const d = Math.abs(e.deltaY)
      distRef.current += d
      setDistance(distRef.current)
    }

    const touchHandler = (e: TouchEvent) => {
      if (phase !== "running") return
      const touch = e.touches[0]
      if (touch) {
        const d = Math.abs(touch.clientY - (window.innerHeight / 2))
        distRef.current += d * 0.3
        setDistance(distRef.current)
      }
    }

    const el = containerRef.current
    if (el) {
      el.addEventListener("wheel", handler, { passive: false })
      el.addEventListener("touchmove", touchHandler, { passive: true })
    }
    return () => {
      if (el) {
        el.removeEventListener("wheel", handler)
        el.removeEventListener("touchmove", touchHandler)
      }
    }
  }, [phase])

  useEffect(() => {
    if (phase === "done") {
      const speed = Math.round(distRef.current / 10)
      setHistory((h) => [speed, ...h.slice(0, 9)])
      if (speed > best) {
        setBest(speed)
        localStorage.setItem("wtp-scroll-best", String(speed))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const reset = () => {
    clearInterval(timerRef.current)
    setPhase("idle")
    setDistance(0)
    setTimeLeft(10)
  }

  const speed = phase !== "idle" ? Math.round(distance / Math.max(1, 10 - timeLeft)) : 0

  const getRating = (v: number) => {
    if (v >= 5000) return { label: "Speed Demon", color: "text-purple-400" }
    if (v >= 3000) return { label: "Fast Scroller", color: "text-red-400" }
    if (v >= 1500) return { label: "Quick", color: "text-orange-400" }
    if (v >= 800) return { label: "Average", color: "text-yellow-400" }
    return { label: "Casual", color: "text-green-400" }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <ArrowDownUp className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Scroll Speed Benchmark</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Test how fast you can scroll! Use your mouse wheel or trackpad. On mobile, swipe up and down.
      </p>

      {/* Scroll area */}
      <Card ref={containerRef} className="cursor-ns-resize select-none">
        <CardContent className="flex flex-col items-center justify-center p-12 min-h-[300px]">
          {phase === "idle" && (
            <div className="text-center space-y-3">
              <ArrowDownUp className="mx-auto h-12 w-12 text-muted-foreground animate-bounce-slow" />
              <Button onClick={start}>Start Scroll Test</Button>
              <p className="text-xs text-muted-foreground">Scroll as fast as you can for 10 seconds</p>
            </div>
          )}
          {phase === "running" && (
            <div className="text-center space-y-3">
              <div className="text-5xl font-bold font-mono tabular-nums">{Math.round(distance)}</div>
              <p className="text-sm text-muted-foreground">pixels scrolled</p>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <span className="font-mono">{timeLeft}s left</span>
                <span className="flex items-center gap-1"><Zap className="h-3 w-3" />{speed} px/s</span>
              </div>
              {/* Progress bar */}
              <div className="h-2 w-full max-w-xs mx-auto rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-100"
                  style={{ width: `${Math.min(100, (distance / 30000) * 100)}%` }}
                />
              </div>
            </div>
          )}
          {phase === "done" && (
            <div className="text-center space-y-3">
              <div className="text-4xl font-bold font-mono">{Math.round(distance / 10)}</div>
              <p className="text-sm text-muted-foreground">avg pixels/second</p>
              <p className={`font-semibold ${getRating(distance / 10).color}`}>
                {getRating(distance / 10).label}
              </p>
              <p className="text-xs text-muted-foreground">{Math.round(distance)} total pixels in 10s</p>
              <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Best + History */}
      <div className="flex gap-3">
        {best > 0 && (
          <Card className="flex-1">
            <CardContent className="p-3 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Best Avg</p>
                <p className="text-sm font-bold font-mono">{best} px/s</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {history.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Recent</h3>
            <div className="flex flex-wrap gap-2">
              {history.map((v, i) => (
                <span key={i} className={`rounded-full px-2.5 py-0.5 text-xs font-mono ${
                  i === 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}>{v} px/s</span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
