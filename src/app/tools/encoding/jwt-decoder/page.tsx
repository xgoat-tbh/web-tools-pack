"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/copy-button"

function decodeJwt(token: string) {
  const parts = token.split(".")
  if (parts.length !== 3) throw new Error("Invalid JWT format (expected 3 parts)")
  const decodeBase64Url = (s: string) => {
    const base64 = s.replace(/-/g, "+").replace(/_/g, "/")
    return JSON.parse(decodeURIComponent(escape(atob(base64))))
  }
  return {
    header: decodeBase64Url(parts[0]),
    payload: decodeBase64Url(parts[1]),
    signature: parts[2],
  }
}

export default function JwtDecoderPage() {
  const [token, setToken] = useState("")
  const [result, setResult] = useState<{ header: object; payload: object; signature: string } | null>(null)
  const [error, setError] = useState("")

  const decode = (val: string) => {
    setToken(val)
    if (!val.trim()) { setResult(null); setError(""); return }
    try {
      setResult(decodeJwt(val.trim()))
      setError("")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Invalid JWT")
      setResult(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">JWT Decoder</h1>
      <p className="text-muted-foreground text-sm">Decode JSON Web Tokens to inspect header and payload.</p>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Token</CardTitle></CardHeader>
        <CardContent>
          <Textarea className="min-h-[100px] font-mono text-sm" value={token} onChange={(e) => decode(e.target.value)} placeholder="Paste your JWT here..." />
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {result && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Header</CardTitle>
              <CopyButton text={JSON.stringify(result.header, null, 2)} />
            </CardHeader>
            <CardContent>
              <pre className="text-sm font-mono bg-muted p-3 rounded-md overflow-auto">{JSON.stringify(result.header, null, 2)}</pre>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Payload</CardTitle>
              <CopyButton text={JSON.stringify(result.payload, null, 2)} />
            </CardHeader>
            <CardContent>
              <pre className="text-sm font-mono bg-muted p-3 rounded-md overflow-auto">{JSON.stringify(result.payload, null, 2)}</pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
