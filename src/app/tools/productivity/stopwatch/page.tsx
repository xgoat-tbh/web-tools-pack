"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Timer, Play, Pause, RotateCcw, Flag } from "lucide-react"

function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const centiseconds = Math.floor((ms % 1000) / 10)
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`
}

export default function StopwatchPage() {
  const [time, setTime] = useState(0)
  const [running, setRunning] = useState(false)
  const [laps, setLaps] = useState<number[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval>>()
  const startTimeRef = useRef(0)
  const offsetRef = useRef(0)

  const tick = useCallback(() => {
    setTime(Date.now() - startTimeRef.current + offsetRef.current)
  }, [])

  useEffect(() => {
    if (running) {
      startTimeRef.current = Date.now()
      intervalRef.current = setInterval(tick, 10)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      offsetRef.current = time
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  const start = () => setRunning(true)
  const pause = () => setRunning(false)
  const reset = () => {
    setRunning(false)
    setTime(0)
    offsetRef.current = 0
    setLaps([])
  }
  const lap = () => {
    setLaps((prev) => [time, ...prev])
  }

  const bestLap = laps.length > 1
    ? Math.min(...laps.map((l, i, arr) => (i === arr.length - 1 ? l : l - arr[i + 1])))
    : null
  const worstLap = laps.length > 1
    ? Math.max(...laps.map((l, i, arr) => (i === arr.length - 1 ? l : l - arr[i + 1])))
    : null

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center gap-2">
        <Timer className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Stopwatch</h1>
      </div>
      <p className="text-muted-foreground">Precision stopwatch with lap tracking.</p>

      {/* Display */}
      <Card>
        <CardContent className="flex flex-col items-center py-10">
          <div className="font-mono text-6xl font-bold tracking-wider sm:text-7xl">
            {formatTime(time)}
          </div>

          {/* Buttons */}
          <div className="mt-8 flex items-center gap-3">
            {!running ? (
              <Button onClick={start} size="lg" className="gap-2 rounded-full px-8">
                <Play className="h-5 w-5" /> {time === 0 ? "Start" : "Resume"}
              </Button>
            ) : (
              <Button onClick={pause} size="lg" variant="destructive" className="gap-2 rounded-full px-8">
                <Pause className="h-5 w-5" /> Pause
              </Button>
            )}

            {running && (
              <Button onClick={lap} size="lg" variant="outline" className="gap-2 rounded-full">
                <Flag className="h-4 w-4" /> Lap
              </Button>
            )}

            {time > 0 && !running && (
              <Button onClick={reset} size="lg" variant="outline" className="gap-2 rounded-full">
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Laps */}
      {laps.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">Laps ({laps.length})</h3>
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {laps.map((lapTime, i) => {
                const diff = i === laps.length - 1 ? lapTime : lapTime - laps[i + 1]
                const isBest = bestLap !== null && diff === bestLap && laps.length > 1
                const isWorst = worstLap !== null && diff === worstLap && laps.length > 1
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between rounded px-3 py-2 text-sm font-mono ${
                      isBest ? "bg-green-500/10 text-green-400" : isWorst ? "bg-red-500/10 text-red-400" : "bg-muted/50"
                    }`}
                  >
                    <span className="text-muted-foreground">Lap {laps.length - i}</span>
                    <span>+{formatTime(diff)}</span>
                    <span className="text-muted-foreground">{formatTime(lapTime)}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
