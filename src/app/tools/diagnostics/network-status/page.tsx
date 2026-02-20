"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wifi, Globe, ArrowRight, RefreshCw, Signal, CheckCircle2, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function NetworkStatus() {
  const [latency, setLatency] = useState<number | null>(null)
  const [status, setStatus] = useState<"Online" | "Offline">("Online")
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<number[]>([])
  const [avgLatency, setAvgLatency] = useState<number | null>(null)

  const checkNetwork = async () => {
    setLoading(true)
    const start = performance.now()
    try {
      // Fetch a small static asset with cache busting
      await fetch('/icon.svg?t=' + Date.now(), { method: 'HEAD', cache: 'no-store' })
      const end = performance.now()
      const lat = Math.round(end - start)
      
      setLatency(lat)
      setStatus("Online")
      
      const newHistory = [...history, lat].slice(-10) // Keep last 10
      setHistory(newHistory)
      
      const avg = Math.round(newHistory.reduce((a, b) => a + b, 0) / newHistory.length)
      setAvgLatency(avg)
      
    } catch (e) {
      setStatus("Offline")
      setLatency(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    setStatus(navigator.onLine ? "Online" : "Offline")
    checkNetwork()
    
    const handleOnline = () => {
      setStatus("Online")
      checkNetwork()
    }
    const handleOffline = () => setStatus("Offline")

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const getLatencyColor = (ms: number) => {
    if (ms < 50) return "text-green-500"
    if (ms < 100) return "text-lime-500"
    if (ms < 200) return "text-yellow-500"
    return "text-destructive"
  }

  const getQualityLabel = (ms: number) => {
    if (ms < 50) return "Excellent"
    if (ms < 100) return "Good"
    if (ms < 200) return "Fair"
    return "Poor"
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wifi className="w-8 h-8" />
            Network Diagnostics
          </h1>
          <p className="text-muted-foreground">
            Real-time connection status and API latency measurement.
          </p>
        </div>
        <Button onClick={checkNetwork} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Testing..." : "Test Connection"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Card */}
        <Card className={status === "Online" ? "border-green-500/50 bg-green-500/5" : "border-destructive/50 bg-destructive/5"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {status === "Online" ? (
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              ) : (
                <XCircle className="w-8 h-8 text-destructive" />
              )}
              <div className="text-2xl font-bold">{status}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {status === "Online" ? "Connected to Internet" : "No Internet Connection"}
            </p>
          </CardContent>
        </Card>

        {/* Latency Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Latency</CardTitle>
            <Signal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold ${latency ? getLatencyColor(latency) : ""}`}>
              {latency !== null ? `${latency}ms` : "-"}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {latency ? `Quality: ${getQualityLabel(latency)}` : "Test pending..."}
            </p>
          </CardContent>
        </Card>

        {/* Average Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average (Last 10)</CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {avgLatency !== null ? `${avgLatency}ms` : "-"}
            </div>
            <div className="flex gap-1 mt-2 h-2">
               {history.map((h, i) => (
                 <div 
                   key={i} 
                   className={`flex-1 rounded-full ${getLatencyColor(h).replace('text-', 'bg-')}`} 
                   title={`${h}ms`}
                 />
               ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Signal className="w-4 h-4" />
              What is Latency?
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>Latency (or Ping)</strong> is the time it takes for a signal to travel from your computer to a server and back.
              <br/><br/>
              • <strong>&lt;50ms:</strong> Excellent. Instant feel.<br/>
              • <strong>50-100ms:</strong> Good. Normal for most browsing.<br/>
              • <strong>&gt;200ms:</strong> Poor. You will feel delays.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
             <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              Why does it change?
            </h3>
             <p className="text-sm text-muted-foreground leading-relaxed">
               Your internet speed can fluctuate due to many factors: Wi-Fi interference, other people streaming video on your network, or congestion at your ISP. The "Average" helps smooth out these temporary spikes.
             </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
