"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function PercentageCalcPage() {
  const [val, setVal] = useState("")
  const [pct, setPct] = useState("")
  const [of, setOf] = useState("")
  const [isWhat, setIsWhat] = useState("")

  const result1 = val && pct ? ((parseFloat(val) * parseFloat(pct)) / 100).toFixed(4) : ""
  const result2 = val && of ? ((parseFloat(val) / parseFloat(of)) * 100).toFixed(4) + "%" : ""
  const result3 = pct && isWhat ? ((parseFloat(isWhat) * 100) / parseFloat(pct)).toFixed(4) : ""

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Percentage Calculator</h1>
      <p className="text-muted-foreground text-sm">Calculate percentages quickly.</p>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">X% of Y</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">Percentage</Label><Input type="number" value={pct} onChange={(e) => setPct(e.target.value)} placeholder="25" /></div>
            <div className="space-y-1"><Label className="text-xs">Of value</Label><Input type="number" value={val} onChange={(e) => setVal(e.target.value)} placeholder="200" /></div>
            {result1 && <div className="text-lg font-bold text-primary">{result1}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">X is what % of Y</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">Value</Label><Input type="number" value={val} onChange={(e) => setVal(e.target.value)} placeholder="50" /></div>
            <div className="space-y-1"><Label className="text-xs">Of total</Label><Input type="number" value={of} onChange={(e) => setOf(e.target.value)} placeholder="200" /></div>
            {result2 && <div className="text-lg font-bold text-primary">{result2}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">X% is Y, what is 100%?</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">Percentage</Label><Input type="number" value={pct} onChange={(e) => setPct(e.target.value)} placeholder="25" /></div>
            <div className="space-y-1"><Label className="text-xs">Is value</Label><Input type="number" value={isWhat} onChange={(e) => setIsWhat(e.target.value)} placeholder="50" /></div>
            {result3 && <div className="text-lg font-bold text-primary">{result3}</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
