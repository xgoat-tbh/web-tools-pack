"use client"

import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Keyboard, RotateCcw, Trophy, Timer, Target, AlertCircle } from "lucide-react"

const WORD_LISTS = {
  easy: ["the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think", "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even", "new", "want", "because", "any", "these", "give", "day", "most", "us"],
  medium: ["through", "during", "before", "between", "should", "never", "world", "still", "thought", "after", "change", "important", "large", "small", "different", "another", "found", "study", "might", "every", "example", "always", "began", "those", "sometimes", "looking", "public", "already", "really", "something", "children", "however", "second", "program", "possible", "system", "better", "point", "company", "number", "problem", "service", "around", "development", "power", "information"],
  hard: ["accommodate", "bureaucracy", "conscientious", "discrepancy", "entrepreneur", "fluorescent", "guarantee", "hierarchy", "idiosyncrasy", "juxtaposition", "knowledge", "lieutenant", "mischievous", "necessary", "occurrence", "pharmaceutical", "questionnaire", "reconnaissance", "surveillance", "temperament", "ubiquitous", "vacuum", "Wednesday", "xylophone", "yield", "zealous", "algorithm", "asymptote", "bibliography", "chrysanthemum"],
}

function generateText(difficulty: keyof typeof WORD_LISTS, count: number): string {
  const words = WORD_LISTS[difficulty]
  return Array.from({ length: count }, () => words[Math.floor(Math.random() * words.length)]).join(" ")
}

export default function TypingBenchmarkPage() {
  const [difficulty, setDifficulty] = useState<keyof typeof WORD_LISTS>("medium")
  const [duration, setDuration] = useState(30)
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle")
  const [text, setText] = useState("")
  const [typed, setTyped] = useState("")
  const [timeLeft, setTimeLeft] = useState(30)
  const [bestWPM, setBestWPM] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const startRef = useRef(0)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("wtp-typing-best")
      if (saved) setBestWPM(parseFloat(saved))
    } catch {}
  }, [])

  useEffect(() => {
    setText(generateText(difficulty, 120))
  }, [difficulty])

  const start = useCallback(() => {
    const newText = generateText(difficulty, 120)
    setText(newText)
    setTyped("")
    setPhase("running")
    setTimeLeft(duration)
    startRef.current = Date.now()
    inputRef.current?.focus()

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000
      const remaining = Math.max(0, duration - elapsed)
      setTimeLeft(Math.ceil(remaining))
      if (remaining <= 0) {
        clearInterval(timerRef.current)
        setPhase("done")
      }
    }, 100)
  }, [difficulty, duration])

  const stats = useMemo(() => {
    if (typed.length === 0) return { wpm: 0, accuracy: 100, correct: 0, errors: 0 }
    const typedChars = typed.split("")
    const textChars = text.split("")
    let correct = 0, errors = 0
    typedChars.forEach((ch, i) => {
      if (ch === textChars[i]) correct++
      else errors++
    })
    const elapsed = phase === "done" ? duration : Math.max(1, (Date.now() - startRef.current) / 1000)
    const words = correct / 5
    const wpm = (words / elapsed) * 60
    const accuracy = typedChars.length > 0 ? (correct / typedChars.length) * 100 : 100
    return { wpm: Math.round(wpm), accuracy: Math.round(accuracy), correct, errors }
  }, [typed, text, phase, duration])

  useEffect(() => {
    if (phase === "done" && stats.wpm > bestWPM) {
      setBestWPM(stats.wpm)
      localStorage.setItem("wtp-typing-best", String(stats.wpm))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const reset = () => {
    clearInterval(timerRef.current)
    setPhase("idle")
    setTyped("")
    setText(generateText(difficulty, 120))
    setTimeLeft(duration)
  }

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (phase !== "running") return
    setTyped(e.target.value)
  }

  const getRating = (wpm: number) => {
    if (wpm >= 100) return { label: "Pro Typist", color: "text-purple-400" }
    if (wpm >= 70) return { label: "Fast", color: "text-red-400" }
    if (wpm >= 45) return { label: "Above Average", color: "text-orange-400" }
    if (wpm >= 30) return { label: "Average", color: "text-yellow-400" }
    return { label: "Beginner", color: "text-green-400" }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
        <Keyboard className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Typing Speed Benchmark</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Test your typing speed and accuracy. Type the displayed text as fast as you can.
      </p>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1.5">
          {(["easy", "medium", "hard"] as const).map((d) => (
            <Button key={d} variant={difficulty === d ? "default" : "outline"} size="sm"
              onClick={() => { if (phase === "idle") setDifficulty(d) }} disabled={phase !== "idle"}
              className="capitalize">{d}</Button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {[15, 30, 60].map((d) => (
            <Button key={d} variant={duration === d ? "default" : "outline"} size="sm"
              onClick={() => { if (phase === "idle") { setDuration(d); setTimeLeft(d) } }} disabled={phase !== "idle"}
            >{d}s</Button>
          ))}
        </div>
      </div>

      {/* Text display */}
      <Card>
        <CardContent className="p-5">
          <div className="text-sm leading-relaxed font-mono tracking-wide min-h-[120px]"
            onClick={() => { if (phase === "idle") start(); inputRef.current?.focus() }}>
            {phase === "idle" ? (
              <p className="text-muted-foreground cursor-pointer">Click here to start typing...</p>
            ) : (
              text.split("").map((char, i) => {
                let className = "text-muted-foreground/40"
                if (i < typed.length) {
                  className = typed[i] === char ? "text-green-400" : "text-red-400 bg-red-500/10"
                } else if (i === typed.length) {
                  className = "text-foreground border-l-2 border-primary animate-pulse"
                }
                return <span key={i} className={className}>{char}</span>
              })
            )}
          </div>

          {/* Hidden input */}
          <input
            ref={inputRef}
            type="text"
            value={typed}
            onChange={handleInput}
            className="sr-only"
            onKeyDown={(e) => { if (phase === "idle" && e.key.length === 1) start() }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </CardContent>
      </Card>

      {/* Live stats */}
      {phase !== "idle" && (
        <div className="grid grid-cols-4 gap-3">
          <Card><CardContent className="p-3 text-center">
            <Timer className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
            <p className="text-xl font-bold font-mono">{timeLeft}s</p>
            <p className="text-[10px] text-muted-foreground">Time</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <Keyboard className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
            <p className="text-xl font-bold font-mono text-primary">{stats.wpm}</p>
            <p className="text-[10px] text-muted-foreground">WPM</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <Target className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
            <p className="text-xl font-bold font-mono">{stats.accuracy}%</p>
            <p className="text-[10px] text-muted-foreground">Accuracy</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <AlertCircle className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
            <p className="text-xl font-bold font-mono text-red-400">{stats.errors}</p>
            <p className="text-[10px] text-muted-foreground">Errors</p>
          </CardContent></Card>
        </div>
      )}

      {/* Results */}
      {phase === "done" && (
        <Card>
          <CardContent className="p-6 text-center space-y-2">
            <p className="text-4xl font-bold font-mono">{stats.wpm} <span className="text-lg text-muted-foreground">WPM</span></p>
            <p className={`font-semibold ${getRating(stats.wpm).color}`}>{getRating(stats.wpm).label}</p>
            <p className="text-xs text-muted-foreground">
              {stats.accuracy}% accuracy &bull; {stats.errors} errors &bull; {typed.length} characters
            </p>
            {bestWPM > 0 && (
              <div className="flex items-center justify-center gap-1 text-xs text-yellow-500">
                <Trophy className="h-3 w-3" /> Personal best: {bestWPM} WPM
              </div>
            )}
            <Button variant="outline" size="sm" onClick={reset} className="gap-1.5 mt-2">
              <RotateCcw className="h-3.5 w-3.5" /> Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
