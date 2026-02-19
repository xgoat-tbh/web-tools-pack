"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Ruler, ArrowRightLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UnitCategory {
  name: string
  units: { name: string; abbr: string; toBase: (v: number) => number; fromBase: (v: number) => number }[]
}

const UNIT_CATEGORIES: UnitCategory[] = [
  {
    name: "Length",
    units: [
      { name: "Meters", abbr: "m", toBase: (v) => v, fromBase: (v) => v },
      { name: "Kilometers", abbr: "km", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { name: "Centimeters", abbr: "cm", toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      { name: "Millimeters", abbr: "mm", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { name: "Miles", abbr: "mi", toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
      { name: "Yards", abbr: "yd", toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
      { name: "Feet", abbr: "ft", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      { name: "Inches", abbr: "in", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
      { name: "Nautical Miles", abbr: "nmi", toBase: (v) => v * 1852, fromBase: (v) => v / 1852 },
    ],
  },
  {
    name: "Weight",
    units: [
      { name: "Kilograms", abbr: "kg", toBase: (v) => v, fromBase: (v) => v },
      { name: "Grams", abbr: "g", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { name: "Milligrams", abbr: "mg", toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
      { name: "Pounds", abbr: "lb", toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
      { name: "Ounces", abbr: "oz", toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
      { name: "Metric Tons", abbr: "t", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { name: "Stones", abbr: "st", toBase: (v) => v * 6.35029, fromBase: (v) => v / 6.35029 },
    ],
  },
  {
    name: "Temperature",
    units: [
      { name: "Celsius", abbr: "°C", toBase: (v) => v, fromBase: (v) => v },
      { name: "Fahrenheit", abbr: "°F", toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
      { name: "Kelvin", abbr: "K", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ],
  },
  {
    name: "Speed",
    units: [
      { name: "Meters/sec", abbr: "m/s", toBase: (v) => v, fromBase: (v) => v },
      { name: "Km/hour", abbr: "km/h", toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
      { name: "Miles/hour", abbr: "mph", toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
      { name: "Knots", abbr: "kn", toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
      { name: "Feet/sec", abbr: "ft/s", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    ],
  },
  {
    name: "Area",
    units: [
      { name: "Sq Meters", abbr: "m²", toBase: (v) => v, fromBase: (v) => v },
      { name: "Sq Kilometers", abbr: "km²", toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
      { name: "Sq Feet", abbr: "ft²", toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
      { name: "Sq Yards", abbr: "yd²", toBase: (v) => v * 0.836127, fromBase: (v) => v / 0.836127 },
      { name: "Acres", abbr: "ac", toBase: (v) => v * 4046.86, fromBase: (v) => v / 4046.86 },
      { name: "Hectares", abbr: "ha", toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
      { name: "Sq Miles", abbr: "mi²", toBase: (v) => v * 2.59e6, fromBase: (v) => v / 2.59e6 },
    ],
  },
  {
    name: "Volume",
    units: [
      { name: "Liters", abbr: "L", toBase: (v) => v, fromBase: (v) => v },
      { name: "Milliliters", abbr: "mL", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { name: "Gallons (US)", abbr: "gal", toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
      { name: "Quarts", abbr: "qt", toBase: (v) => v * 0.946353, fromBase: (v) => v / 0.946353 },
      { name: "Cups", abbr: "cup", toBase: (v) => v * 0.236588, fromBase: (v) => v / 0.236588 },
      { name: "Fl Ounces", abbr: "fl oz", toBase: (v) => v * 0.0295735, fromBase: (v) => v / 0.0295735 },
      { name: "Cubic Meters", abbr: "m³", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    ],
  },
  {
    name: "Data Storage",
    units: [
      { name: "Bytes", abbr: "B", toBase: (v) => v, fromBase: (v) => v },
      { name: "Kilobytes", abbr: "KB", toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
      { name: "Megabytes", abbr: "MB", toBase: (v) => v * 1048576, fromBase: (v) => v / 1048576 },
      { name: "Gigabytes", abbr: "GB", toBase: (v) => v * 1073741824, fromBase: (v) => v / 1073741824 },
      { name: "Terabytes", abbr: "TB", toBase: (v) => v * 1099511627776, fromBase: (v) => v / 1099511627776 },
      { name: "Bits", abbr: "bit", toBase: (v) => v / 8, fromBase: (v) => v * 8 },
    ],
  },
  {
    name: "Time",
    units: [
      { name: "Seconds", abbr: "s", toBase: (v) => v, fromBase: (v) => v },
      { name: "Milliseconds", abbr: "ms", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { name: "Minutes", abbr: "min", toBase: (v) => v * 60, fromBase: (v) => v / 60 },
      { name: "Hours", abbr: "hr", toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
      { name: "Days", abbr: "d", toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
      { name: "Weeks", abbr: "wk", toBase: (v) => v * 604800, fromBase: (v) => v / 604800 },
      { name: "Years", abbr: "yr", toBase: (v) => v * 31557600, fromBase: (v) => v / 31557600 },
    ],
  },
]

export default function UnitConverterPage() {
  const [catIdx, setCatIdx] = useState(0)
  const [fromIdx, setFromIdx] = useState(0)
  const [toIdx, setToIdx] = useState(1)
  const [value, setValue] = useState("1")

  const cat = UNIT_CATEGORIES[catIdx]
  const fromUnit = cat.units[fromIdx] || cat.units[0]
  const toUnit = cat.units[toIdx] || cat.units[1]

  const result = useMemo(() => {
    const num = parseFloat(value)
    if (isNaN(num)) return ""
    const base = fromUnit.toBase(num)
    return toUnit.fromBase(base)
  }, [value, fromUnit, toUnit])

  const swap = () => {
    setFromIdx(toIdx)
    setToIdx(fromIdx)
  }

  const handleCategoryChange = (idx: number) => {
    setCatIdx(idx)
    setFromIdx(0)
    setToIdx(1)
  }

  // All conversions for the reference table
  const allConversions = useMemo(() => {
    const num = parseFloat(value)
    if (isNaN(num)) return []
    const base = fromUnit.toBase(num)
    return cat.units.map((u) => ({
      name: u.name,
      abbr: u.abbr,
      value: u.fromBase(base),
    }))
  }, [value, fromUnit, cat])

  const formatNum = (n: number) => {
    if (Math.abs(n) > 1e12 || (Math.abs(n) < 0.0001 && n !== 0)) return n.toExponential(4)
    return n.toLocaleString(undefined, { maximumFractionDigits: 8 })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center gap-2">
        <Ruler className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Unit Converter</h1>
      </div>
      <p className="text-muted-foreground">Convert between units of length, weight, temperature, speed, area, volume, data, and time.</p>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5">
        {UNIT_CATEGORIES.map((c, i) => (
          <button
            key={c.name}
            onClick={() => handleCategoryChange(i)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
              catIdx === i
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Converter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            {/* From */}
            <div className="flex-1 w-full space-y-2">
              <Label className="text-xs text-muted-foreground">From</Label>
              <select
                value={fromIdx}
                onChange={(e) => setFromIdx(Number(e.target.value))}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {cat.units.map((u, i) => (
                  <option key={u.abbr} value={i}>{u.name} ({u.abbr})</option>
                ))}
              </select>
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="text-xl font-bold h-14"
                placeholder="0"
              />
            </div>

            {/* Swap */}
            <Button variant="outline" size="icon" onClick={swap} className="mt-6 shrink-0 rounded-full h-10 w-10">
              <ArrowRightLeft className="h-4 w-4" />
            </Button>

            {/* To */}
            <div className="flex-1 w-full space-y-2">
              <Label className="text-xs text-muted-foreground">To</Label>
              <select
                value={toIdx}
                onChange={(e) => setToIdx(Number(e.target.value))}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {cat.units.map((u, i) => (
                  <option key={u.abbr} value={i}>{u.name} ({u.abbr})</option>
                ))}
              </select>
              <div className="flex items-center h-14 rounded-md border bg-muted/30 px-3">
                <span className="text-xl font-bold">
                  {result !== "" ? formatNum(result as number) : "—"}
                </span>
                <span className="ml-2 text-sm text-muted-foreground">{toUnit.abbr}</span>
              </div>
            </div>
          </div>

          {/* Formula */}
          {result !== "" && (
            <div className="mt-4 rounded-lg border bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
              {value} {fromUnit.abbr} = {formatNum(result as number)} {toUnit.abbr}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All conversions */}
      <Card>
        <CardContent className="p-4">
          <h3 className="mb-3 text-sm font-semibold">All {cat.name} Conversions</h3>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {allConversions.map((c) => (
              <div
                key={c.abbr}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
                  c.abbr === toUnit.abbr ? "border-primary/50 bg-primary/5" : "border-border/50"
                }`}
              >
                <span className="font-medium">{c.name}</span>
                <span className="text-muted-foreground font-mono text-xs">{formatNum(c.value)} {c.abbr}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
