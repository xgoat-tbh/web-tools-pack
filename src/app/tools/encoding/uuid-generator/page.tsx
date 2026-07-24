"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/copy-button"

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export default function UuidGeneratorPage() {
  const [uuids, setUuids] = useState<string[]>([generateUUID()])
  const [count, setCount] = useState(1)

  const generate = () => {
    const newUuids: string[] = []
    for (let i = 0; i < count; i++) newUuids.push(generateUUID())
    setUuids(newUuids)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">UUID Generator</h1>
      <p className="text-muted-foreground text-sm">Generate random v4 UUIDs.</p>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Count:</label>
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              className="w-20 rounded-md border bg-transparent px-2 py-1 text-sm"
            />
            <Button onClick={generate} size="sm">Generate</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Generated UUIDs</CardTitle>
          <CopyButton text={uuids.join("\n")} />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {uuids.map((uuid, i) => (
              <div key={i} className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono bg-muted px-2 py-1 rounded">{uuid}</code>
                <CopyButton text={uuid} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
