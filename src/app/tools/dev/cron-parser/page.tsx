"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/copy-button"
import { JsonLd } from "@/components/json-ld"
import { allTools } from "@/lib/tools-config"
import { Clock, Calendar, Sparkles, Check } from "lucide-react"

const currentTool = allTools.find((t) => t.slug === "cron-parser")!

const EXAMPLES = [
  { label: "Every minute", cron: "* * * * *" },
  { label: "Every 15 mins", cron: "*/15 * * * *" },
  { label: "Every hour", cron: "0 * * * *" },
  { label: "Midnight daily", cron: "0 0 * * *" },
  { label: "Weekdays at 9am", cron: "0 9 * * 1-5" },
  { label: "1st of month at 4am", cron: "0 4 1 * *" },
]

function parseCronPart(part: string, min: number, max: number, names?: string[]): string {
  if (part === "*") return "every"
  if (part.startsWith("*/")) return `every ${part.slice(2)}`
  if (part.includes(",")) return `at ${part.split(",").join(", ")}`
  if (part.includes("-")) return `from ${part.split("-")[0]} through ${part.split("-")[1]}`
  if (names && !isNaN(Number(part))) return names[Number(part)] || part
  return `at ${part}`
}

function explainCron(cronStr: string): string {
  const parts = cronStr.trim().split(/\s+/)
  if (parts.length !== 5) return "Invalid cron format (requires 5 fields: minute hour day-of-month month day-of-week)"

  const [min, hour, dom, month, dow] = parts

  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  let exp = ""

  // minute
  if (min === "*") exp += "At every minute"
  else if (min.startsWith("*/")) exp += `Every ${min.slice(2)} minutes`
  else exp += `At minute ${min}`

  // hour
  if (hour === "*") exp += ", every hour"
  else if (hour.startsWith("*/")) exp += `, every ${hour.slice(2)} hours`
  else exp += `, at ${hour.padStart(2, "0")}:00`

  // day of month
  if (dom !== "*") {
    exp += `, on day ${dom} of the month`
  }

  // month
  if (month !== "*") {
    exp += `, in ${parseCronPart(month, 1, 12, months)}`
  }

  // day of week
  if (dow !== "*") {
    if (dow === "1-5") exp += ", Monday through Friday"
    else if (dow === "0,6" || dow === "6,0") exp += ", on weekends"
    else exp += `, on ${parseCronPart(dow, 0, 7, days)}`
  }

  return exp + "."
}

function getNextExecutions(cronStr: string, count = 5): string[] {
  const parts = cronStr.trim().split(/\s+/)
  if (parts.length !== 5) return []

  const dates: string[] = []
  let now = new Date()
  now.setSeconds(0)
  now.setMilliseconds(0)

  // simple incremental step check
  let iterations = 0
  while (dates.length < count && iterations < 100000) {
    now = new Date(now.getTime() + 60000) // add 1 min
    iterations++

    const m = now.getMinutes()
    const h = now.getHours()
    const dom = now.getDate()
    const mon = now.getMonth() + 1
    const dow = now.getDay()

    const matchPart = (part: string, val: number) => {
      if (part === "*") return true
      if (part.startsWith("*/")) {
        const step = parseInt(part.slice(2), 10)
        return step > 0 && val % step === 0
      }
      if (part.includes(",")) return part.split(",").map(Number).includes(val)
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number)
        return val >= start && val <= end
      }
      return parseInt(part, 10) === val
    }

    if (
      matchPart(parts[0], m) &&
      matchPart(parts[1], h) &&
      matchPart(parts[2], dom) &&
      matchPart(parts[3], mon) &&
      matchPart(parts[4], dow)
    ) {
      dates.push(now.toLocaleString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }))
    }
  }

  return dates
}

export default function CronParserPage() {
  const [cron, setCron] = useState("*/15 * * * *")

  const explanation = useMemo(() => explainCron(cron), [cron])
  const nextRuns = useMemo(() => getNextExecutions(cron), [cron])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {currentTool && <JsonLd tool={currentTool} />}

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Clock className="h-6 w-6 text-primary" />
          Cron Expression Parser & Schedule Builder
        </h1>
        <p className="text-sm text-muted-foreground">
          Convert crontab syntax into human-readable descriptions and calculate upcoming execution schedules.
        </p>
      </div>

      {/* Main Input Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Crontab Expression</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Input
              value={cron}
              onChange={(e) => setCron(e.target.value)}
              placeholder="e.g. */15 * * * *"
              className="font-mono text-lg h-12 text-center tracking-widest font-bold"
            />
            <CopyButton text={cron} />
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {EXAMPLES.map((ex) => (
              <Button
                key={ex.cron}
                variant={cron === ex.cron ? "default" : "outline"}
                size="sm"
                onClick={() => setCron(ex.cron)}
                className="text-xs"
              >
                {ex.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Explanation Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              Human Explanation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-primary/5 p-4 border border-primary/20">
              <p className="text-base font-medium text-foreground leading-relaxed">
                “{explanation}”
              </p>
            </div>

            {/* Field Breakdown */}
            <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs font-mono">
              {cron.trim().split(/\s+/).map((p, idx) => {
                const labels = ["MIN", "HOUR", "DOM", "MON", "DOW"]
                return (
                  <div key={idx} className="rounded border bg-muted p-2">
                    <div className="font-bold text-primary">{p}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{labels[idx] || ""}</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Schedule Preview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Calendar className="h-4 w-4 text-blue-400" />
              Next Scheduled Executions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextRuns.length > 0 ? (
              <ul className="space-y-2">
                {nextRuns.map((time, idx) => (
                  <li key={idx} className="flex items-center gap-2 rounded border bg-muted/40 px-3 py-2 text-xs font-mono">
                    <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    <span>{time}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">Invalid cron expression.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
