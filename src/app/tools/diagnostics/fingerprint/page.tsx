"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Fingerprint, Monitor, Globe, Clock, Shield, Cpu, Lock, ShieldAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function BrowserFingerprint() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const d = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages.join(", "),
      platform: navigator.platform,
      screen: `${window.screen.width}x${window.screen.height}`,
      colorDepth: `${window.screen.colorDepth}-bit`,
      pixelRatio: window.devicePixelRatio,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack || "Unspecified",
      cores: navigator.hardwareConcurrency || "Unknown",
      memory: (navigator as any).deviceMemory ? `~${(navigator as any).deviceMemory} GB` : "Unknown",
      canvas: "Supported", // Placeholder for actual canvas fingerprinting
      webgl: "Supported"   // Placeholder
    }
    setData(d)
  }, [])

  if (!data) return <div className="p-8 text-center">Loading fingerprint data...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Fingerprint className="w-8 h-8" />
          Browser Fingerprint
        </h1>
        <p className="text-muted-foreground">
          These data points are exposed to every website you visit and can be used to track you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Identity & System</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">User Agent</div>
              <div className="text-xs font-mono bg-muted p-2 rounded mt-1 break-all">
                {data.userAgent}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Platform</div>
                <div className="font-semibold">{data.platform}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Do Not Track</div>
                <Badge variant={data.doNotTrack === "1" ? "default" : "secondary"}>
                  {data.doNotTrack === "1" ? "Enabled" : "Disabled/Unspecified"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location & Locale */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locale & Time</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Language</div>
                <div className="font-semibold">{data.language}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Timezone</div>
                <div className="font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {data.timezone}
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Accept Languages</div>
              <div className="text-sm">{data.languages}</div>
            </div>
          </CardContent>
        </Card>

        {/* Hardware */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hardware Exposure</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">CPU Cores</div>
                <div className="font-semibold">{data.cores}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Memory</div>
                <div className="font-semibold">{data.memory}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Screen */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Display</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Resolution</div>
                <div className="font-semibold">{data.screen}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Color Depth</div>
                <div className="font-semibold">{data.colorDepth}</div>
              </div>
            </div>
             <div>
                <div className="text-sm font-medium text-muted-foreground">Pixel Ratio</div>
                <div className="font-semibold">{data.pixelRatio}x</div>
              </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Raw Data</CardTitle>
          <CardDescription>
            This is exactly what websites see when you visit them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs font-mono max-h-96">
            {JSON.stringify(data, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Fingerprint className="w-4 h-4" />
              What is a Fingerprint?
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Just like your real fingerprint, your browser has a unique combination of settings (screen size, fonts, time zone, battery level) that makes it distinguishable from millions of others.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
             <h3 className="font-semibold mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Why does it matter?
            </h3>
             <p className="text-sm text-muted-foreground leading-relaxed">
               Advertisers use this "fingerprint" to track you across the web, even if you clear your cookies or use Incognito mode. It's a way to identify you without your permission.
             </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
