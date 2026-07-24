"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/copy-button"

export default function Base64Page() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")

  const encode = () => {
    try { setOutput(btoa(unescape(encodeURIComponent(input)))); setError("") }
    catch { setError("Failed to encode"); setOutput("") }
  }

  const decode = () => {
    try { setOutput(decodeURIComponent(escape(atob(input)))); setError("") }
    catch { setError("Invalid Base64 string"); setOutput("") }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Base64 Encode / Decode</h1>
      <p className="text-muted-foreground text-sm">Encode text to Base64 or decode Base64 to text.</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Input</CardTitle></CardHeader>
          <CardContent>
            <Textarea className="min-h-[200px] font-mono text-sm" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Enter text or Base64..." />
            <div className="mt-3 flex gap-2">
              <Button onClick={encode} size="sm">Encode</Button>
              <Button onClick={decode} variant="secondary" size="sm">Decode</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Output</CardTitle>
            {output && <CopyButton text={output} />}
          </CardHeader>
          <CardContent>
            {error && <p className="text-sm text-destructive mb-2">{error}</p>}
            <Textarea className="min-h-[200px] font-mono text-sm" value={output} readOnly />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
