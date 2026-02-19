"use client"

import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Lock, Copy, Check, RefreshCw, Shield } from "lucide-react"

const LOWER = "abcdefghijklmnopqrstuvwxyz"
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const DIGITS = "0123456789"
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?"

function generatePassword(length: number, opts: { lower: boolean; upper: boolean; digits: boolean; symbols: boolean }): string {
  let chars = ""
  if (opts.lower) chars += LOWER
  if (opts.upper) chars += UPPER
  if (opts.digits) chars += DIGITS
  if (opts.symbols) chars += SYMBOLS
  if (!chars) chars = LOWER + UPPER + DIGITS

  const arr = new Uint32Array(length)
  crypto.getRandomValues(arr)
  return Array.from(arr, (v) => chars[v % chars.length]).join("")
}

function getStrength(pw: string): { label: string; color: string; pct: number } {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (pw.length >= 20) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^a-zA-Z0-9]/.test(pw)) score++

  if (score <= 2) return { label: "Weak", color: "bg-red-500", pct: 25 }
  if (score <= 3) return { label: "Fair", color: "bg-yellow-500", pct: 50 }
  if (score <= 4) return { label: "Good", color: "bg-blue-500", pct: 75 }
  return { label: "Strong", color: "bg-green-500", pct: 100 }
}

export default function PasswordGeneratorPage() {
  const [length, setLength] = useState(16)
  const [lower, setLower] = useState(true)
  const [upper, setUpper] = useState(true)
  const [digits, setDigits] = useState(true)
  const [symbols, setSymbols] = useState(true)
  const [count, setCount] = useState(1)
  const [passwords, setPasswords] = useState<string[]>([])
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const generate = useCallback(() => {
    const pws = Array.from({ length: count }, () =>
      generatePassword(length, { lower, upper, digits, symbols })
    )
    setPasswords(pws)
    setCopiedIdx(null)
  }, [length, lower, upper, digits, symbols, count])

  const copy = (pw: string, idx: number) => {
    navigator.clipboard.writeText(pw)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const copyAll = () => {
    navigator.clipboard.writeText(passwords.join("\n"))
    setCopiedIdx(-1)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Lock className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Password Generator</h1>
      </div>
      <p className="text-muted-foreground">Generate cryptographically secure passwords.</p>

      <Card>
        <CardContent className="space-y-5 p-5">
          {/* Length slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Length</Label>
              <span className="rounded bg-muted px-2 py-0.5 text-sm font-mono">{length}</span>
            </div>
            <input
              type="range"
              min={4}
              max={64}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          {/* Character toggles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "a-z", checked: lower, set: setLower },
              { label: "A-Z", checked: upper, set: setUpper },
              { label: "0-9", checked: digits, set: setDigits },
              { label: "!@#$", checked: symbols, set: setSymbols },
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() => opt.set(!opt.checked)}
                className={`rounded-lg border px-3 py-2 text-sm font-mono transition-colors ${
                  opt.checked
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Count */}
          <div className="flex items-center gap-3">
            <Label className="shrink-0">Generate</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value))))}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">password{count > 1 ? "s" : ""}</span>
          </div>

          <Button onClick={generate} className="w-full gap-2">
            <RefreshCw className="h-4 w-4" /> Generate
          </Button>
        </CardContent>
      </Card>

      {/* Output */}
      {passwords.length > 0 && (
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{passwords.length} password{passwords.length > 1 ? "s" : ""}</span>
              {passwords.length > 1 && (
                <Button variant="outline" size="sm" onClick={copyAll} className="h-7 gap-1.5">
                  {copiedIdx === -1 ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedIdx === -1 ? "Copied All!" : "Copy All"}
                </Button>
              )}
            </div>

            {passwords.map((pw, i) => {
              const strength = getStrength(pw)
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <code className="selectable flex-1 truncate rounded bg-muted px-3 py-2 font-mono text-sm">
                      {pw}
                    </code>
                    <Button variant="ghost" size="sm" onClick={() => copy(pw, i)} className="h-8 w-8 p-0">
                      {copiedIdx === i ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-muted">
                      <div className={`h-1.5 rounded-full transition-all ${strength.color}`} style={{ width: `${strength.pct}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{strength.label}</span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
