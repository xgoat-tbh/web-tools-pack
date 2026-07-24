"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mouse, RotateCcw, Trophy, Timer } from "lucide-react"

export default function CPSBenchmarkPage() {
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle")
  const [clicks, setClicks] = useState(0)
  const [timeLeft, setTimeLeft] = useState(10)
  const [duration, setDuration] = useState(10)
  const [bestCPS, setBestCPS] = useState(0)
  const [history, setHistory] = useState<number[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const startTimeRef = useRef(0)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("wtp-cps-best")
      if (saved) setBestCPS(parseFloat(saved))
    } catch {}
  }, [])

  const start = useCallback(() => {
    setPhase("running")
    setClicks(0)
    setTimeLeft(duration)
    startTimeRef.current = Date.now()

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const remaining = Math.max(0, duration - elapsed)
      setTimeLeft(Math.ceil(remaining))
      if (remaining <= 0) {
        clearInterval(timerRef.current)
        setPhase("done")
      }
    }, 50)
  }, [duration])

  const handleClick = () => {
    if (phase === "idle") { start(); setClicks(1); return }
    if (phase === "running") setClicks((c) => c + 1)
  }

  const cps = phase === "done" ? clicks / duration : phase === "running"
    ? clicks / Math.max(0.1, (Date.now() - startTimeRef.current) / 1000)
    : 0

  useEffect(() => {
    if (phase === "done") {
      const finalCPS = parseFloat((clicks / duration).toFixed(2))
      setHistory((h) => [finalCPS, ...h.slice(0, 9)])
      if (finalCPS > bestCPS) {
        setBestCPS(finalCPS)
        localStorage.setItem("wtp-cps-best", String(finalCPS))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const reset = () => {
    clearInterval(timerRef.current)
    setPhase("idle")
    setClicks(0)
    setTimeLeft(duration)
  }

  const getRating = (v: number) => {
    if (v >= 14) return { label: "Inhuman", color: "text-purple-400" }
    if (v >= 10) return { label: "Pro", color: "text-red-400" }
    if (v >= 7) return { label: "Great", color: "text-orange-400" }
    if (v >= 5) return { label: "Average", color: "text-yellow-400" }
    return { label: "Beginner", color: "text-green-400" }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Mouse className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">CPS Benchmark</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Test your clicks per second. Click or tap as fast as you can!
      </p>

      {/* Duration selector */}
      <div className="flex gap-2">
        {[5, 10, 15, 30].map((d) => (
          <Button
            key={d}
            variant={duration === d ? "default" : "outline"}
            size="sm"
            onClick={() => { if (phase === "idle") { setDuration(d); setTimeLeft(d) } }}
            disabled={phase !== "idle"}
          >
            {d}s
          </Button>
        ))}
      </div>

      {/* Click area */}
      <Card
        className="cursor-pointer select-none active:scale-[0.98] transition-transform"
        onClick={handleClick}
      >
        <CardContent className="flex flex-col items-center justify-center p-12 min-h-[280px]">
          {phase === "idle" && (
            <div className="text-center space-y-2">
              <Mouse className="mx-auto h-12 w-12 text-muted-foreground animate-bounce-slow" />
              <p className="text-lg font-semibold">Click here to start!</p>
              <p className="text-xs text-muted-foreground">Click/tap as fast as you can for {duration} seconds</p>
            </div>
          )}
          {phase === "running" && (
            <div className="text-center space-y-3">
              <div className="text-6xl font-bold font-mono tabular-nums">{clicks}</div>
              <p className="text-sm text-muted-foreground">clicks</p>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Timer className="h-4 w-4" />
                <span className="font-mono text-lg">{timeLeft}s</span>
              </div>
              <p className="text-xs text-primary">{cps.toFixed(1)} CPS</p>
            </div>
          )}
          {phase === "done" && (
            <div className="text-center space-y-3">
              <div className="text-5xl font-bold font-mono">{(clicks / duration).toFixed(2)}</div>
              <p className="text-sm text-muted-foreground">clicks per second</p>
              <p className={`text-sm font-semibold ${getRating(clicks / duration).color}`}>
                {getRating(clicks / duration).label}
              </p>
              <p className="text-xs text-muted-foreground">{clicks} clicks in {duration}s</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="flex gap-3">
        {bestCPS > 0 && (
          <Card className="flex-1">
            <CardContent className="p-3 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Best</p>
                <p className="text-sm font-bold font-mono">{bestCPS.toFixed(2)} CPS</p>
              </div>
            </CardContent>
          </Card>
        )}
        {phase === "done" && (
          <Button variant="outline" size="sm" onClick={reset} className="gap-1.5 self-center">
            <RotateCcw className="h-3.5 w-3.5" /> Try Again
          </Button>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Recent Attempts</h3>
            <div className="flex flex-wrap gap-2">
              {history.map((v, i) => (
                <span
                  key={i}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-mono font-medium ${
                    i === 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {v.toFixed(2)}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
