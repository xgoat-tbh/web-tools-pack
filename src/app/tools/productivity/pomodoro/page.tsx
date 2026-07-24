"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Pause, RotateCcw, Coffee } from "lucide-react"

type Mode = "work" | "break" | "longBreak"

export default function PomodoroPage() {
  const [minutes, setMinutes] = useState(25)
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [mode, setMode] = useState<Mode>("work")
  const [sessions, setSessions] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const durations: Record<Mode, number> = { work: 25, break: 5, longBreak: 15 }

  const reset = useCallback((m: Mode) => {
    setMode(m)
    setMinutes(durations[m])
    setSeconds(0)
    setIsRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  useEffect(() => {
    if (!isRunning) return
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s === 0) {
          setMinutes((m) => {
            if (m === 0) {
              // Timer done
              setIsRunning(false)
              if (mode === "work") {
                setSessions((p) => p + 1)
                const nextMode = (sessions + 1) % 4 === 0 ? "longBreak" : "break"
                setTimeout(() => reset(nextMode), 100)
              } else {
                setTimeout(() => reset("work"), 100)
              }
              return 0
            }
            return m - 1
          })
          return 59
        }
        return s - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, mode, sessions, reset])

  const colors: Record<Mode, string> = { work: "text-red-500", break: "text-green-500", longBreak: "text-blue-500" }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">Pomodoro Timer</h1>
      <p className="text-muted-foreground text-sm">Stay focused with timed work/break intervals.</p>

      <Card>
        <CardContent className="pt-6 flex flex-col items-center gap-6">
          <div className="flex gap-2">
            {(["work", "break", "longBreak"] as const).map((m) => (
              <Button key={m} size="sm" variant={mode === m ? "default" : "outline"} onClick={() => reset(m)}>
                {m === "work" ? "Work" : m === "break" ? "Break" : "Long Break"}
              </Button>
            ))}
          </div>

          <div className={`text-7xl font-mono font-bold tabular-nums ${colors[mode]}`}>
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>

          <div className="flex gap-3">
            <Button size="icon" onClick={() => setIsRunning((r) => !r)}>
              {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button size="icon" variant="outline" onClick={() => reset(mode)}>
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Coffee className="h-4 w-4" />
            <span>Sessions completed: {sessions}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
