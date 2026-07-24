"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dice1, RotateCcw, Coins } from "lucide-react"

function CoinFace({ side }: { side: "heads" | "tails" }) {
  return (
    <div className={`flex h-32 w-32 items-center justify-center rounded-full border-4 text-2xl font-bold transition-all duration-500 ${
      side === "heads"
        ? "border-yellow-500 bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900"
        : "border-gray-400 bg-gradient-to-br from-gray-300 to-gray-500 text-gray-800"
    }`}>
      {side === "heads" ? "H" : "T"}
    </div>
  )
}

function DiceFace({ value }: { value: number }) {
  const dots: Record<number, [number, number][]> = {
    1: [[1, 1]],
    2: [[0, 2], [2, 0]],
    3: [[0, 2], [1, 1], [2, 0]],
    4: [[0, 0], [0, 2], [2, 0], [2, 2]],
    5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
    6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
  }

  return (
    <div className="grid h-20 w-20 grid-cols-3 grid-rows-3 gap-1 rounded-xl border-2 border-border bg-white p-2.5 dark:bg-gray-200">
      {Array.from({ length: 9 }, (_, i) => {
        const row = Math.floor(i / 3)
        const col = i % 3
        const hasDot = dots[value]?.some(([r, c]) => r === row && c === col)
        return (
          <div key={i} className="flex items-center justify-center">
            {hasDot && <div className="h-3 w-3 rounded-full bg-gray-900" />}
          </div>
        )
      })}
    </div>
  )
}

export default function CoinDicePage() {
  const [mode, setMode] = useState<"coin" | "dice">("coin")
  const [coinResult, setCoinResult] = useState<"heads" | "tails" | null>(null)
  const [diceResults, setDiceResults] = useState<number[]>([])
  const [diceCount, setDiceCount] = useState(1)
  const [flipping, setFlipping] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [stats, setStats] = useState({ heads: 0, tails: 0, diceRolls: 0 })

  const flipCoin = () => {
    setFlipping(true)
    setTimeout(() => {
      const result = Math.random() < 0.5 ? "heads" : "tails"
      setCoinResult(result)
      setStats((s) => ({ ...s, [result]: s[result] + 1 }))
      setHistory((h) => [`🪙 ${result.charAt(0).toUpperCase() + result.slice(1)}`, ...h].slice(0, 20))
      setFlipping(false)
    }, 600)
  }

  const rollDice = () => {
    setFlipping(true)
    setTimeout(() => {
      const results = Array.from({ length: diceCount }, () => 1 + Math.floor(Math.random() * 6))
      setDiceResults(results)
      const sum = results.reduce((a, b) => a + b, 0)
      setStats((s) => ({ ...s, diceRolls: s.diceRolls + 1 }))
      setHistory((h) => [`🎲 ${results.join(" + ")}${results.length > 1 ? ` = ${sum}` : ""}`, ...h].slice(0, 20))
      setFlipping(false)
    }, 400)
  }

  const reset = () => {
    setCoinResult(null)
    setDiceResults([])
    setHistory([])
    setStats({ heads: 0, tails: 0, diceRolls: 0 })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Coins className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Coin Flip & Dice Roll</h1>
      </div>
      <p className="text-muted-foreground">Make random decisions with style.</p>

      {/* Mode tabs */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setMode("coin")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === "coin" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          <Coins className="h-3.5 w-3.5" /> Coin Flip
        </button>
        <button
          onClick={() => setMode("dice")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === "dice" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          <Dice1 className="h-3.5 w-3.5" /> Dice Roll
        </button>
      </div>

      {/* Coin mode */}
      {mode === "coin" && (
        <Card>
          <CardContent className="flex flex-col items-center py-10 space-y-6">
            <div className={`transition-transform duration-500 ${flipping ? "animate-spin" : ""}`}>
              {coinResult ? (
                <CoinFace side={coinResult} />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-dashed border-border text-muted-foreground">
                  ?
                </div>
              )}
            </div>
            {coinResult && !flipping && (
              <p className="text-2xl font-bold capitalize">{coinResult}!</p>
            )}
            <Button onClick={flipCoin} disabled={flipping} size="lg" className="gap-2 rounded-full px-8">
              <Coins className="h-5 w-5" /> Flip
            </Button>
            {(stats.heads + stats.tails > 0) && (
              <p className="text-xs text-muted-foreground">
                Heads: {stats.heads} · Tails: {stats.tails} · Ratio: {((stats.heads / (stats.heads + stats.tails)) * 100).toFixed(1)}% H
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dice mode */}
      {mode === "dice" && (
        <Card>
          <CardContent className="flex flex-col items-center py-10 space-y-6">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  onClick={() => setDiceCount(n)}
                  className={`h-8 w-8 rounded-lg text-sm font-bold transition-colors ${
                    diceCount === n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {n}
                </button>
              ))}
              <span className="text-xs text-muted-foreground ml-1">dice</span>
            </div>

            <div className={`flex flex-wrap justify-center gap-3 transition-all ${flipping ? "opacity-50 scale-95" : ""}`}>
              {diceResults.length > 0 ? (
                diceResults.map((val, i) => <DiceFace key={i} value={val} />)
              ) : (
                Array.from({ length: diceCount }, (_, i) => (
                  <div key={i} className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground">?</div>
                ))
              )}
            </div>

            {diceResults.length > 1 && (
              <p className="text-xl font-bold">
                Total: {diceResults.reduce((a, b) => a + b, 0)}
              </p>
            )}

            <Button onClick={rollDice} disabled={flipping} size="lg" className="gap-2 rounded-full px-8">
              <Dice1 className="h-5 w-5" /> Roll
            </Button>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">History</h3>
              <Button variant="ghost" size="sm" onClick={reset} className="h-7 gap-1.5">
                <RotateCcw className="h-3 w-3" /> Clear
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {history.map((h, i) => (
                <span key={i} className="rounded bg-muted px-2 py-1 text-xs font-mono">{h}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
