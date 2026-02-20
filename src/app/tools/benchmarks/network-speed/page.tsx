"use client"

import { useCallback, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wifi, Gauge, Timer, AlertTriangle } from "lucide-react"

type Phase = "idle" | "running" | "done" | "error"

interface SpeedResult {
  downloadMbps?: number
  uploadMbps?: number
  latencyMs?: number
  loadedLatencyMs?: number
}

export default function NetworkSpeedBenchmarkPage() {
  const [phase, setPhase] = useState<Phase>("idle")
  const [stage, setStage] = useState<string | null>(null)
  const [result, setResult] = useState<SpeedResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const testRef = useRef<any | null>(null)

  const startTest = useCallback(async () => {
    setError(null)
    setResult(null)
    setStage(null)
    setPhase("running")

    try {
      const { default: SpeedTest } = await import("@cloudflare/speedtest")

      const test: any = new SpeedTest({
        autoStart: false,
        // Shortened measurement set for a quick, in-browser check
        measurements: [
          { type: "latency", numPackets: 5 },
          { type: "download", bytes: 1e6, count: 4 },
          { type: "download", bytes: 1e7, count: 4 },
        ],
      } as any)

      testRef.current = test

      test.onResultsChange = (info: { type?: string } = {}) => {
        if (info.type === "latency") {
          setStage("Measuring latency…")
        } else if (info.type === "download") {
          setStage("Measuring download speed…")
        }
      }

      test.onError = (err: unknown) => {
        console.error(err)
        setError("Speed test failed. Please try again.")
        setPhase("error")
        setStage(null)
        testRef.current = null
      }

      test.onFinish = (results: any) => {
        try {
          const downloadBps = typeof results.getDownloadBandwidth === "function" ? results.getDownloadBandwidth() : undefined
          const uploadBps = typeof results.getUploadBandwidth === "function" ? results.getUploadBandwidth() : undefined
          const latency = typeof results.getUnloadedLatency === "function" ? results.getUnloadedLatency() : undefined
          const loadedLatency =
            typeof results.getDownLoadedLatency === "function" ? results.getDownLoadedLatency() : undefined

          setResult({
            downloadMbps: typeof downloadBps === "number" ? downloadBps / 1_000_000 : undefined,
            uploadMbps: typeof uploadBps === "number" ? uploadBps / 1_000_000 : undefined,
            latencyMs: typeof latency === "number" ? latency : undefined,
            loadedLatencyMs: typeof loadedLatency === "number" ? loadedLatency : undefined,
          })
        } catch (e) {
          console.error(e)
        } finally {
          setPhase("done")
          setStage(null)
          testRef.current = null
        }
      }

      test.play()
    } catch (e) {
      console.error(e)
      setError("Unable to start the speed test. Please check your connection and try again.")
      setPhase("error")
      setStage(null)
      testRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    if (testRef.current && typeof testRef.current.pause === "function") {
      try {
        testRef.current.pause()
      } catch {
        // ignore
      }
    }
    testRef.current = null
    setPhase("idle")
    setStage(null)
    setResult(null)
    setError(null)
  }, [])

  const primaryValue =
    result?.downloadMbps !== undefined ? `${result.downloadMbps.toFixed(1)} Mbps` : phase === "running" ? "Testing…" : "—"

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Wifi className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Network Speed Check</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Measure your connection&apos;s download speed and latency using Cloudflare&apos;s global edge network.
      </p>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
            <Gauge className="h-4 w-4 text-primary" />
            <span>Download Benchmark</span>
          </div>

          <div className="text-4xl font-bold font-mono">{primaryValue}</div>
          <p className="text-xs text-muted-foreground">
            {phase === "idle" && "Click below to run a short speed test (~10–20 seconds)."}
            {phase === "running" && (stage || "Running speed test…")}
            {phase === "done" && "Test complete. You can run it again to compare results."}
            {phase === "error" && error}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={startTest}
              disabled={phase === "running"}
              className="gap-2"
            >
              <Timer className="h-4 w-4" />
              {phase === "running" ? "Testing…" : phase === "done" ? "Run Again" : "Start Speed Test"}
            </Button>
            {phase !== "idle" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={reset}
              >
                Reset
              </Button>
            )}
          </div>

          <p className="mt-1 text-[10px] text-muted-foreground">
            This test sends a series of download requests to Cloudflare speed endpoints. Results are approximate and can
            vary with each run.
          </p>

          {phase === "error" && error && (
            <div className="mt-2 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-[10px] uppercase text-muted-foreground">Download</p>
              <p className="text-lg font-mono font-bold text-primary">
                {result.downloadMbps !== undefined ? result.downloadMbps.toFixed(1) : "—"}{" "}
                <span className="text-[10px] font-normal text-muted-foreground">Mbps</span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-[10px] uppercase text-muted-foreground">Upload</p>
              <p className="text-lg font-mono font-bold">
                {result.uploadMbps !== undefined ? result.uploadMbps.toFixed(1) : "—"}{" "}
                <span className="text-[10px] font-normal text-muted-foreground">Mbps</span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-[10px] uppercase text-muted-foreground">Latency (idle)</p>
              <p className="text-lg font-mono font-bold">
                {result.latencyMs !== undefined ? Math.round(result.latencyMs) : "—"}{" "}
                <span className="text-[10px] font-normal text-muted-foreground">ms</span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-[10px] uppercase text-muted-foreground">Latency (download)</p>
              <p className="text-lg font-mono font-bold">
                {result.loadedLatencyMs !== undefined ? Math.round(result.loadedLatencyMs) : "—"}{" "}
                <span className="text-[10px] font-normal text-muted-foreground">ms</span>
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
