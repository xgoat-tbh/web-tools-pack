"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Activity } from "lucide-react"

export default function FPSTest() {
  const [running, setRunning] = useState(false)
  const [fps, setFps] = useState(0)
  const [minFps, setMinFps] = useState(60)
  const [maxFps, setMaxFps] = useState(0)
  const [avgFps, setAvgFps] = useState(0)
  const [frameCount, setFrameCount] = useState(0)
  
  const requestRef = useRef<number>()
  const startTimeRef = useRef<number>()
  const prevTimeRef = useRef<number>()
  const framesRef = useRef(0)
  const totalFpsRef = useRef(0)

  const animate = (time: number) => {
    if (!startTimeRef.current) startTimeRef.current = time
    
    if (prevTimeRef.current) {
      const delta = time - prevTimeRef.current
      if (delta > 0) {
        const currentFps = 1000 / delta
        
        // Update refs
        framesRef.current += 1
        totalFpsRef.current += currentFps
        
        // Update state periodically to reduce re-renders
        if (framesRef.current % 10 === 0) {
          setFps(Math.round(currentFps))
          setFrameCount(framesRef.current)
          
          const currentAvg = Math.round(totalFpsRef.current / framesRef.current)
          setAvgFps(currentAvg)
          
          setMinFps(prev => Math.min(prev, Math.round(currentFps)))
          setMaxFps(prev => Math.max(prev, Math.round(currentFps)))
        }
      }
    }
    
    prevTimeRef.current = time
    requestRef.current = requestAnimationFrame(animate)
  }

  const start = () => {
    if (running) return
    setRunning(true)
    framesRef.current = 0
    totalFpsRef.current = 0
    startTimeRef.current = undefined
    prevTimeRef.current = undefined
    setMinFps(60)
    setMaxFps(0)
    setAvgFps(0)
    requestRef.current = requestAnimationFrame(animate)
  }

  const stop = () => {
    setRunning(false)
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current)
      requestRef.current = undefined
    }
  }

  const reset = () => {
    stop()
    setFps(0)
    setMinFps(60)
    setMaxFps(0)
    setAvgFps(0)
    setFrameCount(0)
    framesRef.current = 0
    totalFpsRef.current = 0
    startTimeRef.current = undefined
    prevTimeRef.current = undefined
  }

  useEffect(() => {
    return () => stop()
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="w-8 h-8" />
            FPS Stability Test
          </h1>
          <p className="text-muted-foreground">
            Measures rendering performance by stressing the browser with particles.
          </p>
        </div>
        <div className="flex gap-2">
          {!running ? (
            <Button onClick={start} size="lg"><Play className="w-4 h-4 mr-2"/> Start Test</Button>
          ) : (
            <Button variant="destructive" onClick={stop} size="lg"><Pause className="w-4 h-4 mr-2"/> Stop</Button>
          )}
          <Button variant="outline" onClick={reset} size="icon"><RotateCcw className="w-4 h-4"/></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Current FPS</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold ${fps < 30 ? "text-destructive" : "text-primary"}`}>
              {fps}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Average FPS</CardTitle></CardHeader>
          <CardContent><div className="text-4xl font-bold">{avgFps}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Low (1%)</CardTitle></CardHeader>
          <CardContent><div className="text-4xl font-bold text-orange-500">{minFps === 60 && frameCount === 0 ? "-" : minFps}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Peak FPS</CardTitle></CardHeader>
          <CardContent><div className="text-4xl font-bold text-green-500">{maxFps}</div></CardContent>
        </Card>
      </div>

      {/* Visual Stress Test Area */}
      <Card className="h-96 relative overflow-hidden bg-slate-950 border-2">
        {running ? (
           <div className="absolute inset-0">
             {/* Spinning Central Hub */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
               <div className="w-32 h-32 bg-primary/20 rounded-full animate-spin border-4 border-primary border-t-transparent" style={{ animationDuration: '1s' }} />
             </div>
             
             {/* Flying Particles */}
             {Array.from({ length: 100 }).map((_, i) => (
               <div 
                 key={i}
                 className="absolute w-2 h-2 bg-white rounded-full animate-ping"
                 style={{
                   left: `${(i * 13) % 100}%`,
                   top: `${(i * 7) % 100}%`,
                   animationDuration: `${(i % 5) + 0.5}s`,
                   animationDelay: `${i * 0.1}s`,
                   opacity: 0.5
                 }}
               />
             ))}
             
             {/* Moving Blocks */}
             {Array.from({ length: 20 }).map((_, i) => (
               <div 
                 key={`block-${i}`}
                 className="absolute w-16 h-16 border border-primary/30 rounded-lg animate-bounce"
                 style={{
                   left: `${(i * 20) % 90}%`,
                   animationDuration: `${(i % 3) + 2}s`,
                   animationDelay: `${i * 0.2}s`
                 }}
               />
             ))}
           </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <div className="text-center">
              <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">Press Start to begin performance test</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
