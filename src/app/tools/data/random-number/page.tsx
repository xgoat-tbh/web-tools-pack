"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { CopyButton } from "@/components/copy-button"

export default function RandomNumberPage() {
  const [min, setMin] = useState("1")
  const [max, setMax] = useState("100")
  const [count, setCount] = useState("1")
  const [results, setResults] = useState<number[]>([])

  const generate = () => {
    const lo = parseInt(min) || 0
    const hi = parseInt(max) || 100
    const n = Math.max(1, Math.min(100, parseInt(count) || 1))
    const nums: number[] = []
    for (let i = 0; i < n; i++) {
      nums.push(Math.floor(Math.random() * (hi - lo + 1)) + lo)
    }
    setResults(nums)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Random Number Generator</h1>
      <p className="text-muted-foreground text-sm">Generate random numbers within a range.</p>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-3 items-end flex-wrap">
            <div className="space-y-1"><Label className="text-xs">Min</Label><Input type="number" value={min} onChange={(e) => setMin(e.target.value)} className="w-28" /></div>
            <div className="space-y-1"><Label className="text-xs">Max</Label><Input type="number" value={max} onChange={(e) => setMax(e.target.value)} className="w-28" /></div>
            <div className="space-y-1"><Label className="text-xs">Count</Label><Input type="number" min={1} max={100} value={count} onChange={(e) => setCount(e.target.value)} className="w-20" /></div>
            <Button onClick={generate} size="sm">Generate</Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Results</CardTitle>
            <CopyButton text={results.join(", ")} />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {results.map((n, i) => (
                <span key={i} className="rounded-md bg-primary/10 px-3 py-1.5 text-sm font-mono font-medium text-primary">{n}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
