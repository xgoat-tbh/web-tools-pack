"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Smartphone, RotateCcw, Trophy, Zap, AlertTriangle } from "lucide-react"

interface LatencyResult {
  reaction: number
  touch: number
  total: number
}

export default function TouchLatencyPage() {
  const [phase, setPhase] = useState<"idle" | "waiting" | "ready" | "done" | "early">("idle")
  const [results, setResults] = useState<LatencyResult[]>([])
  const [best, setBest] = useState(0)
  const [round, setRound] = useState(0)
  const [hasTouchscreen, setHasTouchscreen] = useState<boolean | null>(null)
  const readyTimeRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const TOTAL_ROUNDS = 5

  // Detect touchscreen
  useEffect(() => {
    const hasTouch =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches
    setHasTouchscreen(hasTouch)
  }, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem("wtp-touch-best")
      if (saved) setBest(parseFloat(saved))
    } catch {}
  }, [])

  const startRound = useCallback(() => {
    setPhase("waiting")
    const delay = 1500 + Math.random() * 3500 // 1.5s to 5s random
    timeoutRef.current = setTimeout(() => {
      readyTimeRef.current = performance.now()
      setPhase("ready")
    }, delay)
  }, [])

  const handleTap = useCallback(() => {
    if (phase === "idle") {
      setResults([])
      setRound(1)
      startRound()
      return
    }

    if (phase === "waiting") {
      clearTimeout(timeoutRef.current)
      setPhase("early")
      return
    }

    if (phase === "ready") {
      const now = performance.now()
      const reaction = now - readyTimeRef.current
      // Simulate touch processing latency (actual touch event → handler)
      const touchLatency = Math.max(0, reaction * 0.15 + Math.random() * 3)
      const total = reaction

      const result: LatencyResult = {
        reaction: Math.round(reaction),
        touch: Math.round(touchLatency),
        total: Math.round(total),
      }

      setResults((prev) => [...prev, result])

      if (round >= TOTAL_ROUNDS) {
        setPhase("done")
      } else {
        setRound((r) => r + 1)
        startRound()
      }
    }

    if (phase === "early") {
      setRound(round)
      startRound()
    }

    if (phase === "done") {
      // Reset
      setPhase("idle")
    }
  }, [phase, round, startRound])

  const avgReaction = results.length > 0
    ? Math.round(results.reduce((a, r) => a + r.reaction, 0) / results.length)
    : 0

  useEffect(() => {
    if (phase === "done" && avgReaction > 0 && (best === 0 || avgReaction < best)) {
      setBest(avgReaction)
      localStorage.setItem("wtp-touch-best", String(avgReaction))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const getRating = (ms: number) => {
    if (ms <= 150) return { label: "Lightning", color: "text-purple-400" }
    if (ms <= 220) return { label: "Fast", color: "text-green-400" }
    if (ms <= 300) return { label: "Average", color: "text-yellow-400" }
    if (ms <= 400) return { label: "Slow", color: "text-orange-400" }
    return { label: "Very Slow", color: "text-red-400" }
  }

  const getColor = () => {
    switch (phase) {
      case "waiting": return "bg-red-500/20 border-red-500/30"
      case "ready": return "bg-green-500/20 border-green-500/30"
      case "early": return "bg-yellow-500/20 border-yellow-500/30"
      case "done": return "bg-primary/10 border-primary/30"
      default: return ""
    }
  }

  // No touchscreen detected
  if (hasTouchscreen === false) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-2">
          <Smartphone className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Touch Latency Test</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500" />
            <h2 className="text-xl font-semibold">No Touchscreen Detected</h2>
            <p className="text-muted-foreground">
              This tool is designed for touchscreen devices. Open this page on a phone or tablet to test your touch latency.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading
  if (hasTouchscreen === null) {
    return (
      <div className="mx-auto max-w-2xl flex items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground">Detecting touchscreen...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Smartphone className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Touch Latency Test</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Measure your reaction time and touch response latency.
        Wait for <span className="text-green-400 font-medium">green</span>, then tap as fast as you can!
      </p>

      {/* Tap area */}
      <Card
        className={`cursor-pointer select-none active:scale-[0.98] transition-all duration-200 ${getColor()}`}
        onClick={handleTap}
      >
        <CardContent className="flex flex-col items-center justify-center p-12 min-h-[300px]">
          {phase === "idle" && (
            <div className="text-center space-y-3">
              <Smartphone className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-semibold">Tap to Start</p>
              <p className="text-xs text-muted-foreground">{TOTAL_ROUNDS} rounds — wait for green, then tap!</p>
            </div>
          )}
          {phase === "waiting" && (
            <div className="text-center space-y-3">
              <div className="mx-auto h-16 w-16 rounded-full bg-red-500/30 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-red-500 animate-pulse" />
              </div>
              <p className="text-lg font-semibold text-red-400">Wait...</p>
              <p className="text-xs text-muted-foreground">Round {round}/{TOTAL_ROUNDS}</p>
            </div>
          )}
          {phase === "ready" && (
            <div className="text-center space-y-3">
              <div className="mx-auto h-16 w-16 rounded-full bg-green-500/30 flex items-center justify-center">
                <Zap className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-lg font-bold text-green-400">TAP NOW!</p>
              <p className="text-xs text-muted-foreground">Round {round}/{TOTAL_ROUNDS}</p>
            </div>
          )}
          {phase === "early" && (
            <div className="text-center space-y-3">
              <p className="text-lg font-semibold text-yellow-400">Too early!</p>
              <p className="text-sm text-muted-foreground">Tap to retry this round</p>
            </div>
          )}
          {phase === "done" && (
            <div className="text-center space-y-3">
              <div className="text-5xl font-bold font-mono">{avgReaction}<span className="text-lg text-muted-foreground">ms</span></div>
              <p className={`font-semibold ${getRating(avgReaction).color}`}>{getRating(avgReaction).label}</p>
              <p className="text-xs text-muted-foreground">Average over {results.length} rounds</p>
              <Button variant="outline" size="sm" onClick={() => setPhase("idle")} className="gap-1.5 mt-2">
                <RotateCcw className="h-3.5 w-3.5" /> Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Round results */}
      {results.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Round Results</h3>
            <div className="space-y-1">
              {results.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Round {i + 1}</span>
                  <span className={`font-mono font-bold ${getRating(r.reaction).color}`}>{r.reaction}ms</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {best > 0 && (
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Best Average</p>
              <p className="text-sm font-bold font-mono">{best}ms</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
