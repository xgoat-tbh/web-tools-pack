"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { DollarSign, ArrowRightLeft, RefreshCw, TrendingUp } from "lucide-react"

const CURRENCIES: Record<string, { name: string; symbol: string }> = {
  USD: { name: "US Dollar", symbol: "$" },
  EUR: { name: "Euro", symbol: "€" },
  GBP: { name: "British Pound", symbol: "£" },
  INR: { name: "Indian Rupee", symbol: "₹" },
  JPY: { name: "Japanese Yen", symbol: "¥" },
  AUD: { name: "Australian Dollar", symbol: "A$" },
  CAD: { name: "Canadian Dollar", symbol: "C$" },
  CHF: { name: "Swiss Franc", symbol: "Fr" },
  CNY: { name: "Chinese Yuan", symbol: "¥" },
  KRW: { name: "South Korean Won", symbol: "₩" },
  SGD: { name: "Singapore Dollar", symbol: "S$" },
  AED: { name: "UAE Dirham", symbol: "د.إ" },
  SAR: { name: "Saudi Riyal", symbol: "﷼" },
  BRL: { name: "Brazilian Real", symbol: "R$" },
  MXN: { name: "Mexican Peso", symbol: "MX$" },
  RUB: { name: "Russian Ruble", symbol: "₽" },
  TRY: { name: "Turkish Lira", symbol: "₺" },
  ZAR: { name: "South African Rand", symbol: "R" },
  THB: { name: "Thai Baht", symbol: "฿" },
  SEK: { name: "Swedish Krona", symbol: "kr" },
}

// Fallback static rates (vs USD) - used if API fails
const FALLBACK_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.5, JPY: 150.2, AUD: 1.53,
  CAD: 1.36, CHF: 0.88, CNY: 7.24, KRW: 1330, SGD: 1.34, AED: 3.67,
  SAR: 3.75, BRL: 4.97, MXN: 17.15, RUB: 91.5, TRY: 30.8, ZAR: 18.9,
  THB: 35.6, SEK: 10.5,
}

export default function CurrencyConverterPage() {
  const [amount, setAmount] = useState("1")
  const [from, setFrom] = useState("USD")
  const [to, setTo] = useState("INR")
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchRates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`)
      if (!res.ok) throw new Error("API unavailable")
      const data = await res.json()
      // Filter to our supported currencies
      const filtered: Record<string, number> = {}
      for (const code of Object.keys(CURRENCIES)) {
        if (data.rates[code]) filtered[code] = data.rates[code]
      }
      setRates(filtered)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch {
      setError("Using offline rates (API unavailable)")
      setRates(FALLBACK_RATES)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRates()
  }, [fetchRates])

  const swap = () => {
    setFrom(to)
    setTo(from)
  }

  const converted = (() => {
    const num = parseFloat(amount)
    if (isNaN(num) || !rates[from] || !rates[to]) return 0
    return (num / rates[from]) * rates[to]
  })()

  const rate = rates[to] / rates[from]

  const codes = Object.keys(CURRENCIES)

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center gap-2">
        <DollarSign className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Currency Converter</h1>
      </div>
      <p className="text-muted-foreground">Convert between 20 world currencies with live exchange rates.</p>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Main converter */}
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            {/* From */}
            <div className="flex-1 w-full space-y-2">
              <Label className="text-xs text-muted-foreground">From</Label>
              <select
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {codes.map((c) => (
                  <option key={c} value={c}>{c} — {CURRENCIES[c].name}</option>
                ))}
              </select>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
                  {CURRENCIES[from]?.symbol}
                </span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10 text-xl font-bold h-14"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Swap button */}
            <Button variant="outline" size="icon" onClick={swap} className="mt-6 shrink-0 rounded-full h-10 w-10">
              <ArrowRightLeft className="h-4 w-4" />
            </Button>

            {/* To */}
            <div className="flex-1 w-full space-y-2">
              <Label className="text-xs text-muted-foreground">To</Label>
              <select
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {codes.map((c) => (
                  <option key={c} value={c}>{c} — {CURRENCIES[c].name}</option>
                ))}
              </select>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
                  {CURRENCIES[to]?.symbol}
                </span>
                <div className="flex items-center h-14 rounded-md border bg-muted/30 pl-10 pr-3">
                  <span className="text-xl font-bold">
                    {converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Rate info */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">1 {from} =</span>
              <span className="font-semibold">{rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} {to}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {lastUpdated && <span>Updated: {lastUpdated}</span>}
              {error && <span className="text-yellow-500">{error}</span>}
              <Button variant="ghost" size="sm" onClick={fetchRates} disabled={loading} className="h-7 gap-1 text-xs">
                <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick reference table */}
      <Card>
        <CardContent className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Quick Reference — 1 {from} equals:</h3>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {codes
              .filter((c) => c !== from)
              .map((c) => {
                const r = rates[c] / rates[from]
                return (
                  <button
                    key={c}
                    onClick={() => setTo(c)}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-accent/50 ${
                      to === c ? "border-primary/50 bg-primary/5" : "border-border/50"
                    }`}
                  >
                    <span className="font-medium">{c}</span>
                    <span className="text-muted-foreground">{CURRENCIES[c].symbol}{r.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                  </button>
                )
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
