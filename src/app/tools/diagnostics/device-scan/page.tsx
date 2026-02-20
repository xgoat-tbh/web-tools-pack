"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Laptop, Smartphone, Tablet, Cpu, Battery, Wifi, Monitor, HardDrive, RefreshCw } from "lucide-react"

interface DeviceInfo {
  type: "Mobile" | "Tablet" | "Desktop" | "Unknown"
  os: string
  browser: string
  screen: {
    width: number
    height: number
    colorDepth: number
    pixelRatio: number
  }
  hardware: {
    cores: number
    memory?: number // GB
  }
  connection?: {
    type: string
    effectiveType: string
    rtt: number
    downlink: number
  }
  battery?: {
    level: number
    charging: boolean
    chargingTime: number
    dischargingTime: number
  }
}

export default function DeviceScan() {
  const [info, setInfo] = useState<DeviceInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const scanDevice = async () => {
    setLoading(true)
    
    // Simulate scan delay for UX
    await new Promise(resolve => setTimeout(resolve, 800))

    const ua = navigator.userAgent
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
    const isTablet = /iPad|Android/i.test(ua) && !/Mobile/i.test(ua)
    
    // Hardware Concurrency
    const cores = navigator.hardwareConcurrency || 0
    // @ts-ignore
    const memory = navigator.deviceMemory || undefined

    // Network
    // @ts-ignore
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    const connection = conn ? {
      type: conn.type,
      effectiveType: conn.effectiveType,
      rtt: conn.rtt,
      downlink: conn.downlink
    } : undefined

    // Battery
    let batteryInfo = undefined
    try {
      // @ts-ignore
      if (navigator.getBattery) {
        // @ts-ignore
        const bat = await navigator.getBattery()
        batteryInfo = {
          level: bat.level * 100,
          charging: bat.charging,
          chargingTime: bat.chargingTime,
          dischargingTime: bat.dischargingTime
        }
      }
    } catch (e) {
      console.log("Battery API not supported")
    }

    setInfo({
      type: isTablet ? "Tablet" : (isMobile ? "Mobile" : "Desktop"),
      os: getOS(ua),
      browser: getBrowser(ua),
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        colorDepth: window.screen.colorDepth,
        pixelRatio: window.devicePixelRatio
      },
      hardware: {
        cores,
        memory
      },
      connection,
      battery: batteryInfo
    })
    setLoading(false)
  }

  useEffect(() => {
    scanDevice()
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Device Diagnostics</h1>
        <Button onClick={scanDevice} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Scanning..." : "Rescan Device"}
        </Button>
      </div>

      {info && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Device Identity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Device Identity</CardTitle>
              {info.type === "Mobile" ? <Smartphone className="h-4 w-4 text-muted-foreground" /> : 
               info.type === "Tablet" ? <Tablet className="h-4 w-4 text-muted-foreground" /> : 
               <Laptop className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{info.os}</div>
              <p className="text-xs text-muted-foreground">
                {info.browser} on {info.type}
              </p>
            </CardContent>
          </Card>

          {/* Screen */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Display</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{info.screen.width} x {info.screen.height}</div>
              <div className="flex gap-2 mt-1">
                <Badge variant="secondary">Running @ {info.screen.pixelRatio}x</Badge>
                <Badge variant="outline">{info.screen.colorDepth}-bit Color</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Hardware */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hardware</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{info.hardware.cores} Cores</div>
              <p className="text-xs text-muted-foreground">
                {info.hardware.memory ? `${info.hardware.memory}GB RAM (approx)` : "RAM info unavailable"}
              </p>
            </CardContent>
          </Card>

          {/* Network */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Network Estimate</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {info.connection ? `${info.connection.downlink} Mbps` : "Unknown"}
              </div>
              <p className="text-xs text-muted-foreground">
                {info.connection ? `${info.connection.effectiveType.toUpperCase()} • ${info.connection.rtt}ms RTT` : "Network API not supported"}
              </p>
            </CardContent>
          </Card>

          {/* Battery */}
          {info.battery && (
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Battery Health</CardTitle>
                <Battery className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold">{Math.round(info.battery.level)}%</div>
                  <Badge variant={info.battery.charging ? "default" : "secondary"}>
                    {info.battery.charging ? "Charging" : "Discharging"}
                  </Badge>
                </div>
                <div className="w-full bg-secondary h-2 mt-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-500" 
                    style={{ width: `${info.battery.level}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              Hardware Cores?
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>Cores</strong> are the "brains" of your processor. More cores allow your device to do more things at once (multitasking) without slowing down. 
              <br/>
              Most modern phones have 8 cores, while laptops range from 4 to 16+.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
             <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Pixel Ratio?
            </h3>
             <p className="text-sm text-muted-foreground leading-relaxed">
               This tells you how sharp your screen is. A ratio of <strong>2x or 3x</strong> (Retina/High-DPI) means the screen packs more physical pixels into each "software" pixel, making text and images look incredibly crisp.
             </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function getOS(ua: string) {
  if (ua.indexOf("Win") !== -1) return "Windows"
  if (ua.indexOf("Mac") !== -1) return "macOS"
  if (ua.indexOf("Linux") !== -1) return "Linux"
  if (ua.indexOf("Android") !== -1) return "Android"
  if (ua.indexOf("like Mac") !== -1) return "iOS"
  return "Unknown OS"
}

function getBrowser(ua: string) {
  if (ua.indexOf("Chrome") !== -1) return "Chrome"
  if (ua.indexOf("Firefox") !== -1) return "Firefox"
  if (ua.indexOf("Safari") !== -1) return "Safari"
  if (ua.indexOf("Edge") !== -1) return "Edge"
  return "Unknown Browser"
}
