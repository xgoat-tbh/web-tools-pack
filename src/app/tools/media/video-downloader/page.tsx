"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/json-ld"
import { allTools } from "@/lib/tools-config"
import {
  Video,
  Download,
  Music,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Loader2,
  Play,
  ExternalLink,
  CheckCircle,
  Clock,
  Image as ImageIcon,
  Trash2,
  Link,
  Search,
} from "lucide-react"

const currentTool = allTools.find((t) => t.slug === "video-downloader")!

// ── Types ──

interface VideoFormat {
  label: string
  type: "video" | "audio"
  url: string
  extension: string
}

interface VideoMeta {
  status: "success" | "error"
  platform: string
  title: string
  thumbnail: string | null
  duration: string | null
  formats: VideoFormat[]
  error?: string
  originalUrl: string
}

interface DownloadHistoryItem {
  title: string
  platform: string
  type: "video" | "audio"
  timestamp: number
}

// ── Platform styling ──

function getPlatformStyle(platform: string): { color: string; bg: string } {
  switch (platform) {
    case "YouTube": return { color: "text-red-400", bg: "bg-red-500/10" }
    case "Instagram": return { color: "text-pink-400", bg: "bg-pink-500/10" }
    case "TikTok": return { color: "text-cyan-400", bg: "bg-cyan-500/10" }
    case "Twitter / X": return { color: "text-blue-400", bg: "bg-blue-500/10" }
    case "Facebook": return { color: "text-blue-500", bg: "bg-blue-600/10" }
    case "Vimeo": return { color: "text-sky-400", bg: "bg-sky-500/10" }
    case "Reddit": return { color: "text-orange-400", bg: "bg-orange-500/10" }
    case "SoundCloud": return { color: "text-amber-400", bg: "bg-amber-500/10" }
    default: return { color: "text-primary", bg: "bg-primary/10" }
  }
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/
  )
  return match ? match[1] : null
}

// ── LocalStorage helpers for download history ──

const HISTORY_KEY = "toolhex_video_download_history"
const MAX_HISTORY = 10

function getHistory(): DownloadHistoryItem[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]")
  } catch {
    return []
  }
}

function addToHistory(item: Omit<DownloadHistoryItem, "timestamp">) {
  const history = getHistory()
  history.unshift({ ...item, timestamp: Date.now() })
  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(history.slice(0, MAX_HISTORY))
  )
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY)
}

// ── Phases ──

type Phase = "idle" | "analyzing" | "ready" | "downloading" | "error"

// ── Component ──

export default function VideoDownloaderPage() {
  const [url, setUrl] = useState("")
  const [phase, setPhase] = useState<Phase>("idle")
  const [meta, setMeta] = useState<VideoMeta | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloadingLabel, setDownloadingLabel] = useState<string | null>(null)
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null)
  const [history, setHistory] = useState<DownloadHistoryItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Load history on mount
  useEffect(() => {
    setHistory(getHistory())
  }, [])

  // ── URL Validation ──
  const isValidUrl = useCallback((value: string): boolean => {
    try {
      const parsed = new URL(value.trim())
      return ["http:", "https:"].includes(parsed.protocol)
    } catch {
      return false
    }
  }, [])

  // ── Fetch Video Info ──
  const fetchInfo = useCallback(async (inputUrl?: string) => {
    const target = (inputUrl || url).trim()
    if (!target) {
      setError("Please paste a video link")
      return
    }
    if (!isValidUrl(target)) {
      setError("That doesn't look like a valid URL. Make sure it starts with https://")
      return
    }

    setPhase("analyzing")
    setError(null)
    setMeta(null)
    setDownloadSuccess(null)

    try {
      const res = await fetch("/api/video/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      })

      const data: VideoMeta = await res.json()

      if (data.status === "error" || data.formats.length === 0) {
        setError(
          data.error ||
          "Could not extract download links. The video may be private, age-restricted, or unsupported."
        )
        setPhase("error")
        return
      }

      setMeta(data)
      setPhase("ready")
    } catch {
      setError("Failed to connect to the server. Please check your internet and try again.")
      setPhase("error")
    }
  }, [url, isValidUrl])

  // ── Auto-detect pasted URL ──
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pasted = e.clipboardData.getData("text").trim()
      if (isValidUrl(pasted)) {
        setUrl(pasted)
        // Small delay to let React update state
        setTimeout(() => fetchInfo(pasted), 100)
      }
    },
    [fetchInfo, isValidUrl]
  )

  // ── Download handler ──
  const triggerDownload = useCallback(
    async (format: VideoFormat) => {
      if (!meta) return
      setDownloadingLabel(format.label)
      setError(null)
      setDownloadSuccess(null)

      const safeTitle = meta.title
        .replace(/[^a-zA-Z0-9\s-_]/g, "")
        .replace(/\s+/g, "_")
        .slice(0, 60)
      const filename = `${safeTitle}_${format.type}.${format.extension}`

      try {
        // Try the streaming proxy first
        const proxyUrl = `/api/video/download?url=${encodeURIComponent(format.url)}&filename=${encodeURIComponent(filename)}`
        const res = await fetch(proxyUrl)

        if (res.ok) {
          const blob = await res.blob()
          const blobUrl = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = blobUrl
          a.download = filename
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(blobUrl)

          // Record in history
          addToHistory({
            title: meta.title,
            platform: meta.platform,
            type: format.type,
          })
          setHistory(getHistory())
          setDownloadSuccess(format.label)
          return
        }

        // If proxy failed (e.g., timeout), try the JSON error response
        let fallbackUrl = format.url
        try {
          const errData = await res.json()
          if (errData.fallback) fallbackUrl = errData.fallback
        } catch {
          // ignore JSON parse errors
        }

        // Fallback: open direct URL in new tab
        const a = document.createElement("a")
        a.href = fallbackUrl
        a.download = filename
        a.target = "_blank"
        a.rel = "noopener noreferrer"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        addToHistory({
          title: meta.title,
          platform: meta.platform,
          type: format.type,
        })
        setHistory(getHistory())
        setDownloadSuccess(format.label)
      } catch {
        // Last resort: open the URL directly
        window.open(format.url, "_blank", "noopener,noreferrer")
        setError("Proxy download failed. Opening in new tab — use right-click → Save As.")
      } finally {
        setDownloadingLabel(null)
      }
    },
    [meta]
  )

  // ── Reset ──
  const handleReset = () => {
    setUrl("")
    setPhase("idle")
    setMeta(null)
    setError(null)
    setDownloadingLabel(null)
    setDownloadSuccess(null)
    inputRef.current?.focus()
  }

  // ── YouTube ID for embed ──
  const ytId = meta?.originalUrl ? extractYouTubeId(meta.originalUrl) : null

  // ── Platform badges ──
  const supportedPlatforms = [
    { name: "YouTube", color: "text-red-400" },
    { name: "Instagram", color: "text-pink-400" },
    { name: "TikTok", color: "text-cyan-400" },
    { name: "Twitter / X", color: "text-blue-400" },
    { name: "Facebook", color: "text-blue-500" },
    { name: "Reddit", color: "text-orange-400" },
    { name: "Vimeo", color: "text-sky-400" },
    { name: "Pinterest", color: "text-red-500" },
    { name: "SoundCloud", color: "text-amber-400" },
    { name: "Dailymotion", color: "text-blue-300" },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {currentTool && <JsonLd tool={currentTool} />}

      {/* ── Header ── */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Video className="h-6 w-6 text-primary" />
          Universal Video & Audio Downloader
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Paste any link — share URLs, direct links, Shorts, Reels, TikToks — and download video or audio directly to your device.
        </p>
      </div>

      {/* ── URL Input Card ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Link className="h-4 w-4 text-muted-foreground" />
            Paste Video or Share Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onPaste={handlePaste}
                placeholder="https://youtu.be/... or any video link"
                className="h-12 text-sm pr-10"
                onKeyDown={(e) => e.key === "Enter" && fetchInfo()}
                disabled={phase === "analyzing"}
              />
              {url && (
                <button
                  onClick={handleReset}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  title="Clear"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              onClick={() => fetchInfo()}
              disabled={phase === "analyzing" || !url.trim()}
              className="h-12 px-6 gap-2 text-sm font-semibold shrink-0"
            >
              {phase === "analyzing" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" /> Fetch Video
                </>
              )}
            </Button>
          </div>

          {/* Error display */}
          {error && (
            <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Something went wrong</p>
                <p className="mt-0.5 opacity-90">{error}</p>
              </div>
            </div>
          )}

          {/* Analyzing state */}
          {phase === "analyzing" && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/50 p-4 rounded-xl border animate-pulse">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div>
                <p className="font-medium text-foreground">Analyzing link...</p>
                <p className="text-xs mt-0.5">Resolving share URL, extracting metadata, finding download streams</p>
              </div>
            </div>
          )}

          {/* Platform badges */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
            <span className="font-semibold text-foreground text-xs mr-1">Supported:</span>
            {supportedPlatforms.map((p) => (
              <span
                key={p.name}
                className={`rounded-full bg-muted px-2.5 py-0.5 ${p.color} font-medium`}
              >
                {p.name}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Results Card ── */}
      {meta && phase === "ready" && (
        <Card className="animate-fade-in-up overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span>
                Ready to Download
                <span className={`ml-2 text-sm font-normal ${getPlatformStyle(meta.platform).color}`}>
                  — {meta.platform}
                </span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-12 gap-6 items-start">
              {/* ── Left: Preview ── */}
              <div className="md:col-span-6 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Play className="h-3 w-3" /> Live Preview
                </p>
                <div className="relative aspect-video w-full rounded-xl bg-black overflow-hidden border shadow-lg">
                  {ytId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}?autoplay=0&rel=0`}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={meta.title}
                    />
                  ) : meta.thumbnail ? (
                    <div className="relative w-full h-full group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={meta.thumbnail}
                        alt={meta.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
                          <Play className="h-8 w-8 text-white fill-white" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
                      <ImageIcon className="h-10 w-10 mb-2 opacity-40 text-primary" />
                      <p className="text-xs font-medium">Preview unavailable</p>
                      <p className="text-[10px] opacity-75 mt-1">
                        Download is still available below
                      </p>
                    </div>
                  )}
                </div>

                {/* Video title */}
                <div className="space-y-1">
                  <p className="text-sm font-semibold leading-snug line-clamp-2">
                    {meta.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${getPlatformStyle(meta.platform).bg} ${getPlatformStyle(meta.platform).color}`}
                    >
                      {meta.platform}
                    </span>
                    {meta.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {meta.duration}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Right: Download Options ── */}
              <div className="md:col-span-6 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Download className="h-3 w-3" /> Download Options
                </p>

                <div className="space-y-2.5">
                  {meta.formats.map((fmt, idx) => {
                    const isBusy = downloadingLabel === fmt.label
                    const isDone = downloadSuccess === fmt.label
                    const isAudio = fmt.type === "audio"

                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 ${
                          isDone
                            ? "bg-green-500/10 border-green-500/30"
                            : "bg-muted/40 hover:bg-muted/70 border-border"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {isAudio ? (
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                              <Music className="h-4 w-4" />
                            </div>
                          ) : (
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                              <Video className="h-4 w-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">{fmt.label}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">
                              {fmt.extension.toUpperCase()} • Saves to Downloads folder
                            </p>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          disabled={isBusy}
                          onClick={() => triggerDownload(fmt)}
                          className={`gap-1.5 text-xs shrink-0 font-semibold ml-3 ${
                            isDone ? "bg-green-600 hover:bg-green-700" : ""
                          }`}
                        >
                          {isBusy ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                            </>
                          ) : isDone ? (
                            <>
                              <CheckCircle className="h-3.5 w-3.5" /> Saved!
                            </>
                          ) : (
                            <>
                              <Download className="h-3.5 w-3.5" />{" "}
                              {isAudio ? "Save MP3" : "Save MP4"}
                            </>
                          )}
                        </Button>
                      </div>
                    )
                  })}
                </div>

                {/* Direct link fallback */}
                {meta.formats.length > 0 && (
                  <div className="pt-1">
                    <button
                      onClick={() => {
                        window.open(meta.formats[0].url, "_blank", "noopener,noreferrer")
                      }}
                      className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open stream directly in browser
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Security notice */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-500">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>
                Downloads are proxied through our server for reliability. No data is stored — files stream directly to your device.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Download History ── */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Recent Downloads
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearHistory()
                  setHistory([])
                }}
                className="h-7 text-xs text-muted-foreground hover:text-red-400"
              >
                <Trash2 className="h-3 w-3 mr-1" /> Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2 rounded-lg text-xs bg-muted/30"
                >
                  {item.type === "audio" ? (
                    <Music className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  ) : (
                    <Video className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  )}
                  <span className="truncate flex-1 font-medium">{item.title}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${getPlatformStyle(item.platform).bg} ${getPlatformStyle(item.platform).color}`}
                  >
                    {item.platform}
                  </span>
                  <span className="text-muted-foreground text-[10px] shrink-0">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
