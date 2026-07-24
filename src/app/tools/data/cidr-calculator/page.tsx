"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CopyButton } from "@/components/copy-button"
import { JsonLd } from "@/components/json-ld"
import { allTools } from "@/lib/tools-config"
import { Network, Sparkles, AlertCircle } from "lucide-react"

const currentTool = allTools.find((t) => t.slug === "cidr-calculator")!

function ipToLong(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0
}

function longToIp(long: number): string {
  return [
    (long >>> 24) & 255,
    (long >>> 16) & 255,
    (long >>> 8) & 255,
    long & 255,
  ].join(".")
}

function toBinary(long: number): string {
  const str = (long >>> 0).toString(2).padStart(32, "0")
  return [
    str.slice(0, 8),
    str.slice(8, 16),
    str.slice(16, 24),
    str.slice(24, 32),
  ].join(".")
}

function calculateCidr(inputStr: string) {
  const parts = inputStr.trim().split("/")
  const ipStr = parts[0]
  const maskBits = parts.length > 1 ? parseInt(parts[1], 10) : 24

  if (isNaN(maskBits) || maskBits < 0 || maskBits > 32) {
    throw new Error("CIDR prefix must be between /0 and /32")
  }

  const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/
  if (!ipRegex.test(ipStr)) {
    throw new Error("Invalid IP address format (e.g. 192.168.1.1)")
  }

  const ipLong = ipToLong(ipStr)
  const maskLong = maskBits === 0 ? 0 : (~0 << (32 - maskBits)) >>> 0
  const wildcardLong = (~maskLong) >>> 0
  const netLong = (ipLong & maskLong) >>> 0
  const bcastLong = (netLong | wildcardLong) >>> 0

  const totalHosts = Math.pow(2, 32 - maskBits)
  const usableHosts = maskBits >= 31 ? (maskBits === 32 ? 1 : 2) : totalHosts - 2

  const firstHostLong = maskBits >= 31 ? netLong : netLong + 1
  const lastHostLong = maskBits >= 31 ? bcastLong : bcastLong - 1

  return {
    ip: ipStr,
    cidr: `${longToIp(netLong)}/${maskBits}`,
    mask: longToIp(maskLong),
    wildcard: longToIp(wildcardLong),
    network: longToIp(netLong),
    broadcast: longToIp(bcastLong),
    firstHost: longToIp(firstHostLong),
    lastHost: longToIp(lastHostLong),
    totalHosts: totalHosts.toLocaleString(),
    usableHosts: usableHosts.toLocaleString(),
    binaryIp: toBinary(ipLong),
    binaryMask: toBinary(maskLong),
  }
}

export default function CidrCalculatorPage() {
  const [input, setInput] = useState("192.168.1.100/24")

  const { data, error } = useMemo(() => {
    try {
      if (!input.trim()) return { data: null, error: null }
      return { data: calculateCidr(input), error: null }
    } catch (err: any) {
      return { data: null, error: err.message || "Invalid CIDR format" }
    }
  }, [input])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {currentTool && <JsonLd tool={currentTool} />}

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Network className="h-6 w-6 text-primary" />
          Subnet / CIDR IP Calculator
        </h1>
        <p className="text-sm text-muted-foreground">
          Calculate IP address network ranges, subnet masks, wildcard masks, broadcast addresses, and usable hosts.
        </p>
      </div>

      {/* Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">IP Address & Prefix (CIDR)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. 10.0.0.1/16 or 192.168.1.1/24"
              className="font-mono text-lg h-12"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {data && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Subnet Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center p-2 rounded bg-muted/40 border">
                <span className="text-muted-foreground">Network CIDR</span>
                <span className="font-bold text-primary">{data.cidr}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-muted/40 border">
                <span className="text-muted-foreground">Subnet Mask</span>
                <span className="font-bold">{data.mask}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-muted/40 border">
                <span className="text-muted-foreground">Wildcard Mask</span>
                <span className="font-bold">{data.wildcard}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-muted/40 border">
                <span className="text-muted-foreground">Usable Hosts</span>
                <span className="font-bold text-green-500">{data.usableHosts}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Address Boundaries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center p-2 rounded bg-muted/40 border">
                <span className="text-muted-foreground">Network IP</span>
                <span className="font-bold">{data.network}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-muted/40 border">
                <span className="text-muted-foreground">First Usable IP</span>
                <span className="font-bold">{data.firstHost}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-muted/40 border">
                <span className="text-muted-foreground">Last Usable IP</span>
                <span className="font-bold">{data.lastHost}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-muted/40 border">
                <span className="text-muted-foreground">Broadcast IP</span>
                <span className="font-bold">{data.broadcast}</span>
              </div>
            </CardContent>
          </Card>

          {/* Binary Representation */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Binary Representation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 font-mono text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded bg-muted/40 border gap-1">
                <span className="text-muted-foreground">IP Address Binary:</span>
                <span className="text-primary tracking-wider font-bold">{data.binaryIp}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded bg-muted/40 border gap-1">
                <span className="text-muted-foreground">Netmask Binary:</span>
                <span className="text-blue-400 tracking-wider font-bold">{data.binaryMask}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
