"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/copy-button"
import { Label } from "@/components/ui/label"

export default function BaseConverterPage() {
  const [decimal, setDecimal] = useState("")
  const [binary, setBinary] = useState("")
  const [hex, setHex] = useState("")
  const [octal, setOctal] = useState("")

  const updateFrom = (value: string, base: number) => {
    const num = parseInt(value, base)
    if (isNaN(num)) {
      if (base !== 10) setDecimal("")
      if (base !== 2) setBinary("")
      if (base !== 16) setHex("")
      if (base !== 8) setOctal("")
      return
    }
    if (base !== 10) setDecimal(num.toString(10))
    if (base !== 2) setBinary(num.toString(2))
    if (base !== 16) setHex(num.toString(16).toUpperCase())
    if (base !== 8) setOctal(num.toString(8))
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Number Base Converter</h1>
      <p className="text-muted-foreground text-sm">Convert between binary, decimal, hex, and octal.</p>

      <Card>
        <CardContent className="pt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Decimal (Base 10)</Label>
            <div className="flex gap-1">
              <Input className="font-mono" value={decimal} onChange={(e) => { setDecimal(e.target.value); updateFrom(e.target.value, 10) }} placeholder="255" />
              {decimal && <CopyButton text={decimal} />}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Binary (Base 2)</Label>
            <div className="flex gap-1">
              <Input className="font-mono" value={binary} onChange={(e) => { setBinary(e.target.value); updateFrom(e.target.value, 2) }} placeholder="11111111" />
              {binary && <CopyButton text={binary} />}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Hexadecimal (Base 16)</Label>
            <div className="flex gap-1">
              <Input className="font-mono" value={hex} onChange={(e) => { setHex(e.target.value); updateFrom(e.target.value, 16) }} placeholder="FF" />
              {hex && <CopyButton text={hex} />}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Octal (Base 8)</Label>
            <div className="flex gap-1">
              <Input className="font-mono" value={octal} onChange={(e) => { setOctal(e.target.value); updateFrom(e.target.value, 8) }} placeholder="377" />
              {octal && <CopyButton text={octal} />}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
