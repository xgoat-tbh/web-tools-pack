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
  HardDrive,
  User,
  Eye,
} from "lucide-react"

const currentTool = allTools.find((t) => t.slug === "video-downloader")!

// ── Types ──

interface VideoFormat {
  id: string
  label: string
  qualityLabel: string
  type: "video" | "audio"
  ext: string
  height?: number | null
  abr?: number | null
  filesize?: number | null
  filesizeLabel?: string | null
  isBest?: boolean
  needsConversion?: boolean
}

interface VideoMeta {
  status: "success" | "error"
  platform: string
  title: string
  thumbnail: string | null
  duration: string | null
  durationSeconds: number | null
  uploader: string | null
  uploaderUrl: string | null
  viewCount: number | null
  uploadDate: string | null
  formats: VideoFormat[]
  error?: string
  originalUrl: string
}

interface DownloadHistoryItem {
  title: string
  platform: string
  type: "video" | "audio"
  quality: string
  timestamp: number
}

// ── Platform styling ──

function getPlatformStyle(platform: string): { color: string; bg: string; border: string } {
  switch (platform) {
    case "YouTube": return { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" }
    case "Instagram": return { color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" }
    case "TikTok": return { color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" }
    case "Twitter / X": return { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" }
    case "Facebook": return { color: "text-blue-500", bg: "bg-blue-600/10", border: "border-blue-600/20" }
    case "Vimeo": return { color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" }
    case "Reddit": return { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" }
    case "SoundCloud": return { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" }
    default: return { color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" }
  }
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/
  )
  return match ? match[1] : null
}

function formatViewCount(count: number | null): string | null {
  if (!count) return null
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M views`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K views`
  return `${count} views`
}

// ── LocalStorage helpers ──

const HISTORY_KEY = "toolhex_video_download_history"
const MAX_HISTORY = 15

function getHistory(): DownloadHistoryItem[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") }
  catch { return [] }
}

function addToHistory(item: Omit<DownloadHistoryItem, "timestamp">) {
  const history = getHistory()
  history.unshift({ ...item, timestamp: Date.now() })
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
}

function clearHistory() { localStorage.removeItem(HISTORY_KEY) }

// ── Component ──

type Phase = "idle" | "analyzing" | "ready" | "error"

export default function VideoDownloaderPage() {
  const [url, setUrl] = useState("")
  const [phase, setPhase] = useState<Phase>("idle")
  const [meta, setMeta] = useState<VideoMeta | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null)
  const [history, setHistory] = useState<DownloadHistoryItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setHistory(getHistory()) }, [])

  // ── URL Cleaning & Validation ──
  const cleanInputUrl = useCallback((raw: string): string => {
    if (!raw) return ""
    let trimmed = raw.trim()
    const matches = trimmed.match(/https?:\/\/[^\s]+/g)
    if (matches && matches.length > 0) {
      let first = matches[0]
      const secondIdx = first.indexOf("http", 8)
      if (secondIdx > 0) {
        first = first.substring(0, secondIdx)
      }
      return first
    }
    return trimmed
  }, [])

  const isValidUrl = useCallback((value: string): boolean => {
    try {
      const parsed = new URL(value.trim())
      return ["http:", "https:"].includes(parsed.protocol)
    } catch { return false }
  }, [])

  // ── Fetch Video Info ──
  const fetchInfo = useCallback(async (inputUrl?: string) => {
    const target = cleanInputUrl(inputUrl || url)
    if (!target) { setError("Please paste a video link"); return }
    if (!isValidUrl(target)) { setError("Invalid URL — make sure it starts with https://"); return }

    setUrl(target)
    setPhase("analyzing")
    setError(null)
    setMeta(null)
    setSelectedFormat(null)
    setDownloadSuccess(null)

    try {
      const res = await fetch("/api/video/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      })

      const data: VideoMeta = await res.json()

      if (data.status === "error" || !data.formats?.length) {
        setError(data.error || "Could not extract video info. The URL may be private, age-restricted, or unsupported.")
        setPhase("error")
        return
      }

      setMeta(data)
      setSelectedFormat(data.formats[0]?.id || null) // Default to best quality
      setPhase("ready")
    } catch {
      setError("Failed to connect to the extraction server. Please try again.")
      setPhase("error")
    }
  }, [url, isValidUrl, cleanInputUrl])

  // ── Auto-detect pasted URL ──
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    const rawPasted = e.clipboardData.getData("text")
    const cleaned = cleanInputUrl(rawPasted)
    if (isValidUrl(cleaned)) {
      e.preventDefault()
      setUrl(cleaned)
      setTimeout(() => fetchInfo(cleaned), 100)
    }
  }, [fetchInfo, isValidUrl, cleanInputUrl])

  // ── Download handler ──
  const triggerDownload = useCallback(async () => {
    if (!meta || !selectedFormat) return

    const fmt = meta.formats.find((f) => f.id === selectedFormat)
    if (!fmt) return

    setDownloadingId(fmt.id)
    setError(null)
    setDownloadSuccess(null)

    const safeTitle = meta.title.replace(/[^a-zA-Z0-9\s\-_]/g, "").replace(/\s+/g, "_").slice(0, 60)
    const ext = fmt.needsConversion ? "mp3" : fmt.ext
    const filename = `${safeTitle}.${ext}`

    try {
      const proxyUrl = `/api/video/download?url=${encodeURIComponent(meta.originalUrl)}&format=${encodeURIComponent(fmt.id)}&filename=${encodeURIComponent(filename)}`
      const res = await fetch(proxyUrl)

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error || `Download failed with status ${res.status}`)
      }

      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)

      addToHistory({ title: meta.title, platform: meta.platform, type: fmt.type, quality: fmt.qualityLabel })
      setHistory(getHistory())
      setDownloadSuccess(fmt.id)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Download failed"
      setError(message)
    } finally {
      setDownloadingId(null)
    }
  }, [meta, selectedFormat])

  // ── Reset ──
  const handleReset = () => {
    setUrl(""); setPhase("idle"); setMeta(null); setError(null)
    setSelectedFormat(null); setDownloadingId(null); setDownloadSuccess(null)
    inputRef.current?.focus()
  }

  const ytId = meta?.originalUrl ? extractYouTubeId(meta.originalUrl) : null
  const videoFormats = meta?.formats.filter((f) => f.type === "video") || []
  const audioFormats = meta?.formats.filter((f) => f.type === "audio") || []

  const supportedPlatforms = [
    { name: "YouTube", color: "text-red-400" },
    { name: "Instagram", color: "text-pink-400" },
    { name: "TikTok", color: "text-cyan-400" },
    { name: "Twitter / X", color: "text-blue-400" },
    { name: "Facebook", color: "text-blue-500" },
    { name: "Reddit", color: "text-orange-400" },
    { name: "Vimeo", color: "text-sky-400" },
    { name: "SoundCloud", color: "text-amber-400" },
    { name: "Dailymotion", color: "text-blue-300" },
    { name: "1000+ sites", color: "text-green-400" },
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
          Powered by <span className="font-semibold text-foreground">yt-dlp</span> + <span className="font-semibold text-foreground">ffmpeg</span> — supports 1000+ websites. Paste any link and download in any quality.
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
                placeholder="https://youtu.be/... or any video URL"
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
                <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
              ) : (
                <><Search className="h-4 w-4" /> Fetch Video</>
              )}
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error</p>
                <p className="mt-0.5 opacity-90">{error}</p>
              </div>
            </div>
          )}

          {/* Analyzing state */}
          {phase === "analyzing" && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/50 p-4 rounded-xl border animate-pulse">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div>
                <p className="font-medium text-foreground">Extracting video information...</p>
                <p className="text-xs mt-0.5">Running yt-dlp — resolving URL, fetching metadata & available formats</p>
              </div>
            </div>
          )}

          {/* Platform badges */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
            <span className="font-semibold text-foreground text-xs mr-1">Supported:</span>
            {supportedPlatforms.map((p) => (
              <span key={p.name} className={`rounded-full bg-muted px-2.5 py-0.5 ${p.color} font-medium`}>
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
              Ready to Download
              <span className={`text-sm font-normal ml-1 ${getPlatformStyle(meta.platform).color}`}>
                — {meta.platform}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* ── Preview + Meta ── */}
            <div className="grid md:grid-cols-12 gap-5">
              {/* Thumbnail / Embed */}
              <div className="md:col-span-5">
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
                      <img src={meta.thumbnail} alt={meta.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
                          <Play className="h-8 w-8 text-white fill-white" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                      <ImageIcon className="h-10 w-10 mb-2 opacity-40 text-primary" />
                      <p className="text-xs font-medium">Preview unavailable</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Video info */}
              <div className="md:col-span-7 space-y-3">
                <h2 className="text-sm font-bold leading-snug line-clamp-2">{meta.title}</h2>

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getPlatformStyle(meta.platform).bg} ${getPlatformStyle(meta.platform).color} ${getPlatformStyle(meta.platform).border} border`}>
                    {meta.platform}
                  </span>
                  {meta.duration && (
                    <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full">
                      <Clock className="h-3 w-3" /> {meta.duration}
                    </span>
                  )}
                  {meta.viewCount && (
                    <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full">
                      <Eye className="h-3 w-3" /> {formatViewCount(meta.viewCount)}
                    </span>
                  )}
                </div>

                {meta.uploader && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    {meta.uploaderUrl ? (
                      <a href={meta.uploaderUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors underline underline-offset-2">
                        {meta.uploader}
                      </a>
                    ) : (
                      <span>{meta.uploader}</span>
                    )}
                  </div>
                )}

                {/* ── Format Selector ── */}
                <div className="space-y-2 pt-1">
                  {/* Video formats */}
                  {videoFormats.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <Video className="h-3 w-3" /> Video Formats
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {videoFormats.map((fmt) => (
                          <label
                            key={fmt.id}
                            className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all duration-150 text-xs ${
                              selectedFormat === fmt.id
                                ? "bg-primary/10 border-primary/40 ring-1 ring-primary/30"
                                : "bg-muted/30 border-border hover:bg-muted/60"
                            }`}
                          >
                            <input
                              type="radio"
                              name="format"
                              value={fmt.id}
                              checked={selectedFormat === fmt.id}
                              onChange={() => setSelectedFormat(fmt.id)}
                              className="accent-primary h-3.5 w-3.5"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">
                                {fmt.isBest ? "🏆 " : ""}{fmt.label}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {fmt.ext.toUpperCase()}
                                {fmt.filesizeLabel && ` • ~${fmt.filesizeLabel}`}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Audio formats */}
                  {audioFormats.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <Music className="h-3 w-3" /> Audio Formats
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {audioFormats.map((fmt) => (
                          <label
                            key={fmt.id}
                            className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all duration-150 text-xs ${
                              selectedFormat === fmt.id
                                ? "bg-purple-500/10 border-purple-500/40 ring-1 ring-purple-500/30"
                                : "bg-muted/30 border-border hover:bg-muted/60"
                            }`}
                          >
                            <input
                              type="radio"
                              name="format"
                              value={fmt.id}
                              checked={selectedFormat === fmt.id}
                              onChange={() => setSelectedFormat(fmt.id)}
                              className="accent-purple-500 h-3.5 w-3.5"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">
                                {fmt.isBest ? "🎵 " : ""}{fmt.label}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {fmt.needsConversion ? "MP3" : fmt.ext.toUpperCase()}
                                {fmt.filesizeLabel && ` • ~${fmt.filesizeLabel}`}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Download Button ── */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                onClick={triggerDownload}
                disabled={!selectedFormat || !!downloadingId}
                className={`h-12 px-8 gap-2.5 text-sm font-bold flex-1 sm:flex-none ${
                  downloadSuccess
                    ? "bg-green-600 hover:bg-green-700"
                    : ""
                }`}
              >
                {downloadingId ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Downloading & Converting...</>
                ) : downloadSuccess ? (
                  <><CheckCircle className="h-4 w-4" /> Downloaded Successfully!</>
                ) : (
                  <><Download className="h-4 w-4" /> Download Selected Format</>
                )}
              </Button>

              {meta.formats.length > 0 && (
                <button
                  onClick={() => window.open(meta.originalUrl, "_blank", "noopener,noreferrer")}
                  className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors h-12 px-4"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open original
                </button>
              )}
            </div>

            {/* Info banner */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-500">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Processed by yt-dlp + ffmpeg. File downloads directly to your device.</span>
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
                <Clock className="h-4 w-4 text-muted-foreground" /> Recent Downloads
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { clearHistory(); setHistory([]) }}
                className="h-7 text-xs text-muted-foreground hover:text-red-400"
              >
                <Trash2 className="h-3 w-3 mr-1" /> Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {history.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-lg text-xs bg-muted/30">
                  {item.type === "audio" ? (
                    <Music className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  ) : (
                    <Video className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  )}
                  <span className="truncate flex-1 font-medium">{item.title}</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <HardDrive className="h-2.5 w-2.5" /> {item.quality}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getPlatformStyle(item.platform).bg} ${getPlatformStyle(item.platform).color}`}>
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
