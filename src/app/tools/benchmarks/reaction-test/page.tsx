"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, RotateCcw, Trophy, Timer, CircleDot, AlertTriangle, Target } from "lucide-react"

type Phase = "idle" | "waiting" | "ready" | "done" | "early"

export default function ReactionTestPage() {
  const [phase, setPhase] = useState<Phase>("idle")
  const [times, setTimes] = useState<number[]>([])
  const [round, setRound] = useState(0)
  const [best, setBest] = useState(0)
  const readyAt = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const TOTAL_ROUNDS = 5

  useEffect(() => {
    try {
      const saved = localStorage.getItem("wtp-reaction-best")
      if (saved) setBest(parseFloat(saved))
    } catch {}
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  const startRound = useCallback(() => {
    setPhase("waiting")
    const delay = 1500 + Math.random() * 4000 // 1.5-5.5s random
    timerRef.current = setTimeout(() => {
      readyAt.current = performance.now()
      setPhase("ready")
    }, delay)
  }, [])

  const handleClick = useCallback(() => {
    if (phase === "idle") {
      setTimes([])
      setRound(0)
      startRound()
      return
    }

    if (phase === "waiting") {
      if (timerRef.current) clearTimeout(timerRef.current)
      setPhase("early")
      return
    }

    if (phase === "ready") {
      const ms = performance.now() - readyAt.current
      const newTimes = [...times, ms]
      setTimes(newTimes)
      const newRound = round + 1
      setRound(newRound)

      if (newRound >= TOTAL_ROUNDS) {
        setPhase("done")
        const avg = newTimes.reduce((a, b) => a + b, 0) / newTimes.length
        if (best === 0 || avg < best) {
          setBest(avg)
          try { localStorage.setItem("wtp-reaction-best", String(avg)) } catch {}
        }
      } else {
        setPhase("idle")
        setTimeout(() => startRound(), 600)
      }
      return
    }

    if (phase === "early" || phase === "done") {
      setPhase("idle")
    }
  }, [phase, times, round, best, startRound])

  const avg = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
  const fastest = times.length > 0 ? Math.min(...times) : 0
  const slowest = times.length > 0 ? Math.max(...times) : 0

  function getRating(ms: number): { label: string; color: string } {
    if (ms < 180) return { label: "Insane", color: "text-purple-400" }
    if (ms < 220) return { label: "Excellent", color: "text-green-400" }
    if (ms < 270) return { label: "Great", color: "text-blue-400" }
    if (ms < 350) return { label: "Average", color: "text-yellow-400" }
    if (ms < 500) return { label: "Slow", color: "text-orange-400" }
    return { label: "Very Slow", color: "text-red-400" }
  }

  const bgClass =
    phase === "waiting"
      ? "bg-red-500/20 border-red-500/40"
      : phase === "ready"
      ? "bg-green-500/20 border-green-500/40"
      : phase === "early"
      ? "bg-orange-500/20 border-orange-500/40"
      : "bg-card border-border"

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="h-6 w-6 text-yellow-500" /> Reaction Time Test
        </h1>
        <p className="text-muted-foreground mt-1">
          Click/tap as fast as you can when the screen turns green. {TOTAL_ROUNDS} rounds.
        </p>
      </div>

      {/* Main click area */}
      <Card
        className={`cursor-pointer select-none transition-all duration-200 ${bgClass}`}
        onClick={handleClick}
      >
        <CardContent className="flex flex-col items-center justify-center min-h-[300px] p-8">
          {phase === "idle" && times.length === 0 && (
            <div className="text-center space-y-3">
              <Target className="h-14 w-14 mx-auto text-primary" />
              <p className="text-xl font-semibold">Click to Start</p>
              <p className="text-sm text-muted-foreground">Test your reaction speed</p>
            </div>
          )}
          {phase === "idle" && times.length > 0 && (
            <div className="text-center space-y-2">
              <Timer className="h-8 w-8 mx-auto text-blue-400 animate-pulse" />
              <p className="text-lg font-medium">Round {round + 1} starting...</p>
            </div>
          )}
          {phase === "waiting" && (
            <div className="text-center space-y-3">
              <div className="mx-auto h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                <CircleDot className="h-10 w-10 text-red-500" />
              </div>
              <p className="text-xl font-semibold text-red-400">Wait for green...</p>
              <p className="text-sm text-muted-foreground">Don&apos;t click yet!</p>
            </div>
          )}
          {phase === "ready" && (
            <div className="text-center space-y-3">
              <div className="mx-auto h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <Zap className="h-10 w-10 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-400">CLICK NOW!</p>
            </div>
          )}
          {phase === "early" && (
            <div className="text-center space-y-3">
              <div className="mx-auto h-16 w-16 rounded-full bg-orange-500/20 flex items-center justify-center">
                <AlertTriangle className="h-10 w-10 text-orange-500" />
              </div>
              <p className="text-xl font-semibold text-orange-400">Too early!</p>
              <p className="text-sm text-muted-foreground">Click to try again</p>
            </div>
          )}
          {phase === "done" && (
            <div className="text-center space-y-4">
              <Trophy className="h-12 w-12 mx-auto text-yellow-500" />
              <div>
                <p className="text-3xl font-bold">{Math.round(avg)} ms</p>
                <p className={`text-lg font-semibold ${getRating(avg).color}`}>
                  {getRating(avg).label}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">Click to play again</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Round Progress */}
      {(times.length > 0 || phase === "waiting" || phase === "ready") && (
        <div className="flex gap-2 justify-center">
          {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-10 rounded-full transition-all duration-300 ${
                i < times.length
                  ? "bg-green-500"
                  : i === times.length && (phase === "waiting" || phase === "ready")
                  ? "bg-yellow-500 animate-pulse"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
      )}

      {/* Results Table */}
      {times.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-sm">Round Results</h3>
            <div className="grid grid-cols-5 gap-2">
              {times.map((t, i) => (
                <div key={i} className="text-center">
                  <p className="text-xs text-muted-foreground">R{i + 1}</p>
                  <p className={`text-sm font-mono font-bold ${getRating(t).color}`}>
                    {Math.round(t)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Average</p>
            <p className="font-mono font-bold text-lg">{times.length ? Math.round(avg) : "—"} <span className="text-xs font-normal text-muted-foreground">ms</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Fastest</p>
            <p className="font-mono font-bold text-lg text-green-400">{times.length ? Math.round(fastest) : "—"} <span className="text-xs font-normal text-muted-foreground">ms</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Slowest</p>
            <p className="font-mono font-bold text-lg text-red-400">{times.length ? Math.round(slowest) : "—"} <span className="text-xs font-normal text-muted-foreground">ms</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Best Avg</p>
            <p className="font-mono font-bold text-lg text-yellow-500">{best > 0 ? Math.round(best) : "—"} <span className="text-xs font-normal text-muted-foreground">ms</span></p>
          </CardContent>
        </Card>
      </div>

      {/* Reset */}
      {times.length > 0 && phase === "done" && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => { setPhase("idle"); setTimes([]); setRound(0) }}
        >
          <RotateCcw className="h-4 w-4 mr-2" /> Reset All Scores
        </Button>
      )}
    </div>
  )
}
