"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Keyboard, RotateCcw, Trophy, Timer, Zap } from "lucide-react"

const WORD_BANK = [
  "the","be","to","of","and","a","in","that","have","it","for","not","on","with","he",
  "as","you","do","at","this","but","his","by","from","they","we","say","her","she","or",
  "an","will","my","one","all","would","there","their","what","so","up","out","if","about",
  "who","get","which","go","me","when","make","can","like","time","no","just","him","know",
  "take","people","into","year","your","good","some","could","them","see","other","than",
  "then","now","look","only","come","its","over","think","also","back","after","use","two",
  "how","our","work","first","well","way","even","new","want","because","any","these","give",
  "day","most","us","great","between","need","large","often","hand","high","keep","every",
  "never","last","let","began","while","where","name","under","should","small","end","home",
  "world","right","still","before","long","help","through","much","same","down","move",
  "real","very","program","system","code","data","function","string","array","class","type",
]

function pickWords(count: number): string[] {
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    result.push(WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)])
  }
  return result
}

type Phase = "ready" | "running" | "done"

export default function TypingSpeedPage() {
  const [words, setWords] = useState<string[]>([])
  const [typed, setTyped] = useState("")
  const [wordIdx, setWordIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>("ready")
  const [startTime, setStartTime] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(30)
  const [errors, setErrors] = useState(0)
  const [correctWords, setCorrectWords] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  const init = useCallback(() => {
    setWords(pickWords(200))
    setTyped("")
    setWordIdx(0)
    setPhase("ready")
    setElapsed(0)
    setErrors(0)
    setCorrectWords(0)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  useEffect(() => { init() }, [init])

  useEffect(() => {
    if (phase === "running") {
      timerRef.current = setInterval(() => {
        const now = (Date.now() - startTime) / 1000
        setElapsed(now)
        if (now >= duration) {
          setPhase("done")
          clearInterval(timerRef.current)
        }
      }, 100)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, startTime, duration])

  const handleInput = (val: string) => {
    if (phase === "done") return

    if (phase === "ready") {
      setPhase("running")
      setStartTime(Date.now())
    }

    // Space = submit word
    if (val.endsWith(" ")) {
      const word = val.trim()
      if (word === words[wordIdx]) {
        setCorrectWords((c) => c + 1)
      } else {
        setErrors((e) => e + 1)
      }
      setWordIdx((i) => i + 1)
      setTyped("")
      return
    }

    setTyped(val)
  }

  const wpm = Math.round(correctWords / (Math.max(elapsed, 1) / 60))
  const accuracy = correctWords + errors > 0 ? Math.round((correctWords / (correctWords + errors)) * 100) : 100
  const timeLeft = Math.max(0, duration - elapsed)

  // Color a word
  const wordClass = (i: number) => {
    if (i < wordIdx) return i < wordIdx ? "text-green-400" : "text-red-400"
    if (i === wordIdx) return "bg-primary/20 text-foreground rounded px-1"
    return "text-muted-foreground"
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
        <Keyboard className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Typing Speed Test</h1>
      </div>
      <p className="text-muted-foreground">Test your typing speed and accuracy.</p>

      {/* Duration selector */}
      <div className="flex items-center gap-2">
        {[15, 30, 60].map((d) => (
          <button
            key={d}
            onClick={() => { setDuration(d); init() }}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              duration === d ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {d}s
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="border-border/50 bg-card/50 p-3 text-center">
          <Timer className="mx-auto mb-1 h-4 w-4 text-blue-400" />
          <p className="text-xl font-bold font-mono">{Math.ceil(timeLeft)}s</p>
          <p className="text-[10px] text-muted-foreground">Time Left</p>
        </Card>
        <Card className="border-border/50 bg-card/50 p-3 text-center">
          <Zap className="mx-auto mb-1 h-4 w-4 text-yellow-400" />
          <p className="text-xl font-bold font-mono">{wpm}</p>
          <p className="text-[10px] text-muted-foreground">WPM</p>
        </Card>
        <Card className="border-border/50 bg-card/50 p-3 text-center">
          <Trophy className="mx-auto mb-1 h-4 w-4 text-green-400" />
          <p className="text-xl font-bold font-mono">{accuracy}%</p>
          <p className="text-[10px] text-muted-foreground">Accuracy</p>
        </Card>
        <Card className="border-border/50 bg-card/50 p-3 text-center">
          <Keyboard className="mx-auto mb-1 h-4 w-4 text-purple-400" />
          <p className="text-xl font-bold font-mono">{correctWords}</p>
          <p className="text-[10px] text-muted-foreground">Words</p>
        </Card>
      </div>

      {/* Word display */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex flex-wrap gap-x-2 gap-y-1 text-lg leading-relaxed font-mono">
            {words.slice(0, wordIdx + 30).map((w, i) => (
              <span key={i} className={`transition-colors ${wordClass(i)}`}>{w}</span>
            ))}
          </div>

          {phase !== "done" ? (
            <input
              ref={inputRef}
              value={typed}
              onChange={(e) => handleInput(e.target.value)}
              placeholder={phase === "ready" ? "Start typing..." : ""}
              autoFocus
              className="w-full rounded-lg border border-border bg-muted/50 px-4 py-3 font-mono text-lg outline-none focus:border-primary transition-colors"
            />
          ) : (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-6 text-center">
              <Trophy className="mx-auto mb-2 h-8 w-8 text-yellow-400" />
              <p className="text-2xl font-bold">{wpm} WPM</p>
              <p className="text-sm text-muted-foreground">{accuracy}% accuracy · {correctWords} correct · {errors} errors</p>
              <Button onClick={init} className="mt-4 gap-2">
                <RotateCcw className="h-4 w-4" /> Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
