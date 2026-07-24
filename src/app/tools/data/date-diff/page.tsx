"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function DateDiffPage() {
  const [date1, setDate1] = useState("")
  const [date2, setDate2] = useState("")

  const diff = useMemo(() => {
    if (!date1 || !date2) return null
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null
    const ms = Math.abs(d2.getTime() - d1.getTime())
    const days = Math.floor(ms / 86400000)
    const weeks = Math.floor(days / 7)
    const months = Math.floor(days / 30.44)
    const years = Math.floor(days / 365.25)
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor(ms / 60000)
    return { days, weeks, months, years, hours, minutes }
  }, [date1, date2])

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Date Difference Calculator</h1>
      <p className="text-muted-foreground text-sm">Calculate the difference between two dates.</p>

      <Card>
        <CardContent className="pt-6 flex gap-4 items-end flex-wrap">
          <div className="space-y-1"><Label className="text-xs">Start Date</Label><Input type="date" value={date1} onChange={(e) => setDate1(e.target.value)} className="w-44" /></div>
          <div className="space-y-1"><Label className="text-xs">End Date</Label><Input type="date" value={date2} onChange={(e) => setDate2(e.target.value)} className="w-44" /></div>
        </CardContent>
      </Card>

      {diff && (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {([["Years", diff.years], ["Months", diff.months], ["Weeks", diff.weeks], ["Days", diff.days], ["Hours", diff.hours], ["Minutes", diff.minutes]] as const).map(([label, val]) => (
            <Card key={label}>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-primary">{val.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
