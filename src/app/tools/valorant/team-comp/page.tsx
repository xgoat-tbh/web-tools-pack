"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { maps, getAgent, roleColors, roleIcons, type Role } from "@/lib/valorant-data"

export default function TeamCompPage() {
  const [selectedMap, setSelectedMap] = useState(maps[0].name)

  const mapData = maps.find((m) => m.name === selectedMap)!

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Valorant Team Comp Suggester</h1>
        <p className="text-muted-foreground text-sm">Get balanced agent compositions for every map based on pro-play meta.</p>
      </div>

      {/* Map Selector */}
      <div className="flex flex-wrap gap-2">
        {maps.map((m) => (
          <button
            key={m.name}
            onClick={() => setSelectedMap(m.name)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              selectedMap === m.name
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border hover:bg-accent"
            }`}
          >
            {m.name}
          </button>
        ))}
      </div>

      {/* Role Legend */}
      <div className="flex flex-wrap gap-3">
        {(["Duelist", "Initiator", "Controller", "Sentinel"] as Role[]).map((role) => (
          <div key={role} className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs ${roleColors[role]}`}>
            <span>{roleIcons[role]}</span>
            <span>{role}</span>
          </div>
        ))}
      </div>

      {/* Compositions */}
      <div className="grid gap-4 lg:grid-cols-2">
        {mapData.compositions.map((comp, idx) => {
          const agentDetails = comp.agents.map((agentName) => ({ ...getAgent(agentName)!, name: agentName }))
          const roleCount: Record<string, number> = {}
          agentDetails.forEach((a) => { roleCount[a.role] = (roleCount[a.role] || 0) + 1 })

          return (
            <Card key={idx} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Comp {idx + 1}</CardTitle>
                  <Badge className="bg-primary/10 text-primary border-primary/20">{comp.style}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Agents Grid */}
                <div className="grid grid-cols-5 gap-2">
                  {agentDetails.map((agent) => (
                    <div key={agent.name} className="flex flex-col items-center gap-1">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold border ${roleColors[agent.role]}`}>
                        {agent.name.charAt(0)}
                      </div>
                      <span className="text-xs font-medium text-center leading-tight">{agent.name}</span>
                      <span className={`text-[10px] rounded px-1 ${roleColors[agent.role]}`}>{agent.role}</span>
                    </div>
                  ))}
                </div>

                {/* Role Balance */}
                <div className="flex gap-2">
                  {Object.entries(roleCount).map(([role, count]) => (
                    <div key={role} className={`text-xs rounded-md border px-2 py-0.5 ${roleColors[role as Role]}`}>
                      {roleIcons[role as Role]} {count}× {role}
                    </div>
                  ))}
                </div>

                {/* Reasoning */}
                <CardDescription className="text-xs leading-relaxed">
                  {comp.reasoning}
                </CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
