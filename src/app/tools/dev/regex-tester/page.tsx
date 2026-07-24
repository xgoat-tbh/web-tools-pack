"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function RegexTesterPage() {
  const [pattern, setPattern] = useState("")
  const [flags, setFlags] = useState("gi")
  const [testStr, setTestStr] = useState("")

  const result = useMemo(() => {
    if (!pattern) return { matches: [], error: "" }
    try {
      const regex = new RegExp(pattern, flags)
      const matches: { match: string; index: number; groups?: Record<string, string> }[] = []
      let m
      if (flags.includes("g")) {
        while ((m = regex.exec(testStr)) !== null) {
          matches.push({ match: m[0], index: m.index, groups: m.groups })
          if (!m[0]) break
        }
      } else {
        m = regex.exec(testStr)
        if (m) matches.push({ match: m[0], index: m.index, groups: m.groups })
      }
      return { matches, error: "" }
    } catch (e: unknown) {
      return { matches: [], error: e instanceof Error ? e.message : "Invalid regex" }
    }
  }, [pattern, flags, testStr])

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Regex Tester</h1>
      <p className="text-muted-foreground text-sm">Test regular expressions against a string in real-time.</p>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-2 items-center">
            <span className="text-muted-foreground">/</span>
            <Input className="font-mono text-sm flex-1" placeholder="pattern" value={pattern} onChange={(e) => setPattern(e.target.value)} />
            <span className="text-muted-foreground">/</span>
            <Input className="font-mono text-sm w-20" placeholder="gi" value={flags} onChange={(e) => setFlags(e.target.value)} />
          </div>

          {result.error && <p className="text-sm text-destructive">{result.error}</p>}

          <Textarea className="min-h-[200px] font-mono text-sm" placeholder="Test string..." value={testStr} onChange={(e) => setTestStr(e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Matches ({result.matches.length})</CardTitle></CardHeader>
        <CardContent>
          {result.matches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matches</p>
          ) : (
            <div className="space-y-2">
              {result.matches.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Badge className="bg-primary/10 text-primary">{i + 1}</Badge>
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{m.match}</code>
                  <span className="text-xs text-muted-foreground">index {m.index}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
