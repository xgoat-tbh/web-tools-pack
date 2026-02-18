"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/copy-button"

export default function JsonFormatterPage() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")

  const format = () => {
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed, null, 2))
      setError("")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Invalid JSON")
      setOutput("")
    }
  }

  const minify = () => {
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed))
      setError("")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Invalid JSON")
      setOutput("")
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">JSON Formatter & Validator</h1>
      <p className="text-muted-foreground text-sm">Paste JSON to format, minify, or validate it.</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Input</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              className="min-h-[300px] font-mono text-sm"
              placeholder='{"key": "value"}'
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className="mt-3 flex gap-2">
              <Button onClick={format} size="sm">Format</Button>
              <Button onClick={minify} variant="secondary" size="sm">Minify</Button>
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
            <Textarea
              className="min-h-[300px] font-mono text-sm"
              value={output}
              readOnly
              placeholder="Formatted JSON will appear here"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
