"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const timezones = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Tokyo", "Asia/Shanghai",
  "Asia/Kolkata", "Asia/Dubai", "Australia/Sydney", "Pacific/Auckland",
  "America/Sao_Paulo", "Africa/Cairo", "Asia/Singapore",
]

export default function TimezonePage() {
  const [dateStr, setDateStr] = useState(() => {
    const d = new Date()
    return d.toISOString().slice(0, 16)
  })
  const [fromTz, setFromTz] = useState("UTC")

  const converted = useMemo(() => {
    try {
      // Build a date in the "from" timezone
      const d = new Date(dateStr + ":00")
      if (isNaN(d.getTime())) return []
      return timezones.map((tz) => ({
        tz,
        time: d.toLocaleString("en-US", { timeZone: tz, dateStyle: "medium", timeStyle: "long" }),
      }))
    } catch {
      return []
    }
  }, [dateStr, fromTz])

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Timezone Converter</h1>
      <p className="text-muted-foreground text-sm">See a date/time across multiple timezones.</p>

      <Card>
        <CardContent className="pt-6 flex gap-4 items-end flex-wrap">
          <div className="space-y-1">
            <Label className="text-xs">Date & Time</Label>
            <Input type="datetime-local" value={dateStr} onChange={(e) => setDateStr(e.target.value)} className="w-56" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Source Timezone</Label>
            <Select value={fromTz} onValueChange={setFromTz}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>{timezones.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">All Timezones</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1">
            {converted.map((c) => (
              <div key={c.tz} className="flex items-center gap-4 py-1.5 border-b last:border-0">
                <span className="text-sm font-medium w-44 shrink-0">{c.tz}</span>
                <span className="text-sm text-muted-foreground">{c.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
