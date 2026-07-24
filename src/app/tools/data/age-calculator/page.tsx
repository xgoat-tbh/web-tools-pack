"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function AgeCalculatorPage() {
  const [birthdate, setBirthdate] = useState("")

  const age = useMemo(() => {
    if (!birthdate) return null
    const birth = new Date(birthdate)
    const now = new Date()
    if (isNaN(birth.getTime()) || birth > now) return null

    let years = now.getFullYear() - birth.getFullYear()
    let months = now.getMonth() - birth.getMonth()
    let days = now.getDate() - birth.getDate()
    if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate() }
    if (months < 0) { years--; months += 12 }

    const totalDays = Math.floor((now.getTime() - birth.getTime()) / 86400000)
    const totalWeeks = Math.floor(totalDays / 7)
    const totalMonths = years * 12 + months
    const nextBirthday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate())
    if (nextBirthday <= now) nextBirthday.setFullYear(nextBirthday.getFullYear() + 1)
    const daysUntilBirthday = Math.ceil((nextBirthday.getTime() - now.getTime()) / 86400000)

    return { years, months, days, totalDays, totalWeeks, totalMonths, daysUntilBirthday }
  }, [birthdate])

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Age Calculator</h1>
      <p className="text-muted-foreground text-sm">Calculate your exact age from your birthdate.</p>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-1 max-w-xs">
            <Label className="text-xs">Birthdate</Label>
            <Input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {age && (
        <>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-4xl font-bold text-primary">{age.years} years, {age.months} months, {age.days} days</div>
            </CardContent>
          </Card>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {([["Total Days", age.totalDays], ["Total Weeks", age.totalWeeks], ["Total Months", age.totalMonths], ["Days to Birthday", age.daysUntilBirthday]] as const).map(([label, val]) => (
              <Card key={label}>
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold text-primary">{val.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
