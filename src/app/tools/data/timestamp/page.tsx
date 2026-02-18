"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { CopyButton } from "@/components/copy-button"

export default function TimestampPage() {
  const [timestamp, setTimestamp] = useState("")
  const [dateStr, setDateStr] = useState("")
  const [result, setResult] = useState("")

  const now = () => {
    const ts = Math.floor(Date.now() / 1000).toString()
    setTimestamp(ts)
    setResult(new Date(parseInt(ts) * 1000).toISOString())
  }

  const fromTimestamp = () => {
    const ts = parseInt(timestamp)
    if (isNaN(ts)) { setResult("Invalid timestamp"); return }
    const ms = timestamp.length > 10 ? ts : ts * 1000
    setResult(new Date(ms).toISOString() + "\n" + new Date(ms).toLocaleString())
  }

  const fromDate = () => {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) { setResult("Invalid date"); return }
    setResult(`Unix (seconds): ${Math.floor(d.getTime() / 1000)}\nUnix (ms): ${d.getTime()}`)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Timestamp Converter</h1>
      <p className="text-muted-foreground text-sm">Convert between Unix timestamps and human-readable dates.</p>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">From Timestamp</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">Unix Timestamp</Label><Input className="font-mono" value={timestamp} onChange={(e) => setTimestamp(e.target.value)} placeholder="1700000000" /></div>
            <div className="flex gap-2">
              <Button onClick={fromTimestamp} size="sm">Convert</Button>
              <Button onClick={now} variant="secondary" size="sm">Now</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">From Date</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">Date String</Label><Input value={dateStr} onChange={(e) => setDateStr(e.target.value)} placeholder="2025-01-01T00:00:00Z" /></div>
            <Button onClick={fromDate} size="sm">Convert</Button>
          </CardContent>
        </Card>
      </div>

      {result && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Result</CardTitle>
            <CopyButton text={result} />
          </CardHeader>
          <CardContent>
            <pre className="text-sm font-mono bg-muted p-3 rounded-md whitespace-pre-wrap">{result}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
