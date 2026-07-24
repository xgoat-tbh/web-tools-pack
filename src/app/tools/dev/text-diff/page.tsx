"use client"

import { useState, useMemo } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function diffLines(a: string, b: string) {
  const linesA = a.split("\n")
  const linesB = b.split("\n")
  const maxLen = Math.max(linesA.length, linesB.length)
  const result: { lineNum: number; a: string; b: string; type: "same" | "changed" | "added" | "removed" }[] = []
  for (let i = 0; i < maxLen; i++) {
    const la = linesA[i]
    const lb = linesB[i]
    if (la === undefined) result.push({ lineNum: i + 1, a: "", b: lb, type: "added" })
    else if (lb === undefined) result.push({ lineNum: i + 1, a: la, b: "", type: "removed" })
    else if (la === lb) result.push({ lineNum: i + 1, a: la, b: lb, type: "same" })
    else result.push({ lineNum: i + 1, a: la, b: lb, type: "changed" })
  }
  return result
}

export default function TextDiffPage() {
  const [textA, setTextA] = useState("")
  const [textB, setTextB] = useState("")

  const diff = useMemo(() => diffLines(textA, textB), [textA, textB])

  const colors = { same: "", changed: "bg-yellow-500/10", added: "bg-green-500/10", removed: "bg-red-500/10" }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Text Diff Checker</h1>
      <p className="text-muted-foreground text-sm">Compare two texts side by side.</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Original</CardTitle></CardHeader>
          <CardContent>
            <Textarea className="min-h-[200px] font-mono text-sm" value={textA} onChange={(e) => setTextA(e.target.value)} placeholder="Paste original text" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Modified</CardTitle></CardHeader>
          <CardContent>
            <Textarea className="min-h-[200px] font-mono text-sm" value={textB} onChange={(e) => setTextB(e.target.value)} placeholder="Paste modified text" />
          </CardContent>
        </Card>
      </div>

      {(textA || textB) && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Diff Result</CardTitle></CardHeader>
          <CardContent>
            <div className="font-mono text-sm overflow-x-auto">
              {diff.map((d, i) => (
                <div key={i} className={`flex gap-4 px-2 py-0.5 ${colors[d.type]}`}>
                  <span className="w-8 text-right text-muted-foreground shrink-0">{d.lineNum}</span>
                  <span className="flex-1 whitespace-pre">{d.type === "removed" ? `- ${d.a}` : d.type === "added" ? `+ ${d.b}` : d.type === "changed" ? `~ ${d.a} → ${d.b}` : `  ${d.a}`}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
