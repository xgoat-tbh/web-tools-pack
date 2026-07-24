"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/copy-button"

export default function UrlEncoderPage() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")

  const encode = () => setOutput(encodeURIComponent(input))
  const decode = () => {
    try { setOutput(decodeURIComponent(input)) }
    catch { setOutput("Invalid encoded URL") }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">URL Encoder / Decoder</h1>
      <p className="text-muted-foreground text-sm">Encode or decode URL components.</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Input</CardTitle></CardHeader>
          <CardContent>
            <Textarea className="min-h-[200px] font-mono text-sm" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Enter URL or encoded string..." />
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
            <Textarea className="min-h-[200px] font-mono text-sm" value={output} readOnly />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
