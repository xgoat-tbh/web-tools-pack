"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MousePointer2, Keyboard, Zap, RotateCcw } from "lucide-react"

export default function InputTest() {
  const [clickEvents, setClickEvents] = useState<{ type: string; time: number; delta: number }[]>([])
  const [keyEvents, setKeyEvents] = useState<{ key: string; time: number; delta: number }[]>([])
  const lastTimeRef = useRef<number>(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    const now = performance.now()
    const delta = lastTimeRef.current ? now - lastTimeRef.current : 0
    lastTimeRef.current = now
    
    setClickEvents(prev => [{ type: "mousedown", time: now, delta }, ...prev].slice(0, 10))
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    const now = performance.now()
    const delta = lastTimeRef.current ? now - lastTimeRef.current : 0
    lastTimeRef.current = now

    setClickEvents(prev => [{ type: "mouseup", time: now, delta }, ...prev].slice(0, 10))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const now = performance.now()
    const delta = lastTimeRef.current ? now - lastTimeRef.current : 0
    lastTimeRef.current = now

    setKeyEvents(prev => [{ key: e.key, time: now, delta }, ...prev].slice(0, 10))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MousePointer2 className="w-8 h-8" />
          Input Latency Tester
        </h1>
        <p className="text-muted-foreground">
          Analyze input event timing and responsiveness.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mouse Test Area */}
        <Card className="h-64 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointer2 className="w-4 h-4" /> Mouse Click Test
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div 
              className="w-full h-full bg-primary/10 border-2 border-dashed border-primary/50 rounded-lg flex items-center justify-center cursor-pointer hover:bg-primary/20 active:bg-primary/30 transition-colors select-none"
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            >
              <div className="text-center">
                <p className="font-bold text-lg">Click Here</p>
                <p className="text-xs text-muted-foreground">Test mousedown/mouseup timing</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Test Area */}
        <Card className="h-64 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="w-4 h-4" /> Keyboard Test
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <textarea 
              className="w-full h-full bg-background border rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Type here to test key latency..."
              onKeyDown={handleKeyDown}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mouse Log */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Mouse Event Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-xs">
              <div className="grid grid-cols-3 font-bold border-b pb-1">
                <span>Event</span>
                <span>Time (ms)</span>
                <span>Delta (ms)</span>
              </div>
              {clickEvents.map((e, i) => (
                <div key={i} className="grid grid-cols-3">
                  <span>{e.type}</span>
                  <span>{e.time.toFixed(2)}</span>
                  <span className={e.delta > 100 ? "text-destructive" : "text-green-500"}>
                    {e.delta > 0 ? `+${e.delta.toFixed(2)}` : "-"}
                  </span>
                </div>
              ))}
              {clickEvents.length === 0 && <div className="text-muted-foreground italic">No events yet</div>}
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Log */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Keyboard Event Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-xs">
              <div className="grid grid-cols-3 font-bold border-b pb-1">
                <span>Key</span>
                <span>Time (ms)</span>
                <span>Delta (ms)</span>
              </div>
              {keyEvents.map((e, i) => (
                <div key={i} className="grid grid-cols-3">
                  <span>{e.key}</span>
                  <span>{e.time.toFixed(2)}</span>
                  <span className={e.delta > 100 ? "text-destructive" : "text-green-500"}>
                    {e.delta > 0 ? `+${e.delta.toFixed(2)}` : "-"}
                  </span>
                </div>
              ))}
              {keyEvents.length === 0 && <div className="text-muted-foreground italic">No events yet</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
