"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { JsonLd } from "@/components/json-ld"
import { allTools } from "@/lib/tools-config"
import { Video, Download, Music, ShieldCheck, Sparkles, AlertCircle, Loader2, Play } from "lucide-react"

const currentTool = allTools.find((t) => t.slug === "video-downloader")!

const COBALT_ENDPOINTS = [
  "https://co.wuk.sh/api/json",
  "https://api.cobalt.tools/api/json",
  "https://cobalt.api.scotty.rip/api/json",
]

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/)
  return match ? match[1] : null
}

function cleanAndNormalizeUrl(rawUrl: string): string {
  let u = rawUrl.trim()
  const ytId = extractYouTubeId(u)
  if (ytId) {
    return `https://www.youtube.com/watch?v=${ytId}`
  }
  if (u.includes("instagram.com")) {
    return u.split("?")[0]
  }
  if (u.includes("tiktok.com")) {
    return u.split("?")[0]
  }
  if (u.includes("x.com/")) {
    return u.replace("x.com/", "twitter.com/").split("?")[0]
  }
  return u
}

function detectPlatform(url: string): { name: string; color: string } {
  const lower = url.toLowerCase()
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return { name: "YouTube", color: "text-red-500" }
  if (lower.includes("instagram.com")) return { name: "Instagram", color: "text-pink-500" }
  if (lower.includes("tiktok.com")) return { name: "TikTok", color: "text-cyan-400" }
  if (lower.includes("twitter.com") || lower.includes("x.com")) return { name: "Twitter / X", color: "text-blue-400" }
  if (lower.includes("facebook.com")) return { name: "Facebook", color: "text-blue-600" }
  if (lower.includes("vimeo.com")) return { name: "Vimeo", color: "text-sky-400" }
  return { name: "Universal Media", color: "text-primary" }
}

async function fetchFromCobalt(url: string, downloadMode: "auto" | "audio" = "auto") {
  const cleanUrl = cleanAndNormalizeUrl(url)
  
  for (const endpoint of COBALT_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: cleanUrl,
          downloadMode: downloadMode,
          vQuality: "1080",
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.url || (data.picker && data.picker.length > 0)) {
          return data
        }
      }
    } catch {
      // try next endpoint
    }
  }
  return null
}

interface FormatOption {
  label: string
  extension: string
  type: "video" | "audio"
  mode?: "audio" | "auto"
}

export default function VideoDownloaderPage() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null)
  const [youtubeId, setYoutubeId] = useState<string | null>(null)
  const [directStreamUrl, setDirectStreamUrl] = useState<string | null>(null)
  const [platform, setPlatform] = useState<string>("Media")
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const handleFetchInfo = async () => {
    if (!url.trim()) {
      setError("Please enter a valid video link")
      return
    }

    setLoading(true)
    setError(null)
    setHasSearched(true)

    const cleanUrl = cleanAndNormalizeUrl(url)
    const ytId = extractYouTubeId(cleanUrl)
    setYoutubeId(ytId)
    const platformInfo = detectPlatform(cleanUrl)
    setPlatform(platformInfo.name)

    try {
      const data = await fetchFromCobalt(cleanUrl, "auto")
      if (data?.url) {
        setDirectStreamUrl(data.url)
      } else if (data?.picker && data.picker.length > 0) {
        setDirectStreamUrl(data.picker[0].url)
      } else {
        setDirectStreamUrl(null)
      }
    } catch {
      setDirectStreamUrl(null)
    } finally {
      setLoading(false)
    }
  }

  // Robust download trigger
  const triggerDownload = async (format: FormatOption) => {
    setDownloadingFormat(format.label)
    setError(null)

    try {
      const cleanUrl = cleanAndNormalizeUrl(url)
      const mode = format.type === "audio" ? "audio" : "auto"
      const data = await fetchFromCobalt(cleanUrl, mode)

      const downloadUrl = data?.url || (data?.picker && data.picker[0]?.url) || directStreamUrl
      const fileName = `${platform.toLowerCase().replace(/\s+/g, "_")}_${format.type}.${format.extension}`

      if (downloadUrl) {
        // Attempt Blob download first for seamless native file save dialog
        try {
          const fetchRes = await fetch(downloadUrl)
          if (!fetchRes.ok) throw new Error("Blob fetch error")
          const blob = await fetchRes.blob()
          const blobUrl = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = blobUrl
          a.download = fileName
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(blobUrl)
          return
        } catch {
          // Fallback: direct window anchor trigger without throwing error
          const a = document.createElement("a")
          a.href = downloadUrl
          a.download = fileName
          a.target = "_blank"
          a.rel = "noopener noreferrer"
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          return
        }
      }

      // Fallback for YouTube videos via Invidious stream mirror
      const ytId = youtubeId || extractYouTubeId(url)
      if (ytId) {
        const fallbackUrl = format.type === "audio" 
          ? `https://yewtu.be/latest_version?id=${ytId}&italic=true`
          : `https://yewtu.be/latest_version?id=${ytId}&itag=22`
        
        const a = document.createElement("a")
        a.href = fallbackUrl
        a.download = fileName
        a.target = "_blank"
        a.rel = "noopener noreferrer"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        return
      }

      throw new Error("Could not fetch direct video stream. Please check the URL.")
    } catch (err: any) {
      setError(err.message || "Download request failed. Please check the URL and try again.")
    } finally {
      setDownloadingFormat(null)
    }
  }

  const formats: FormatOption[] = [
    { label: "Download Video (MP4 - Best Quality)", extension: "mp4", type: "video" },
    { label: "Download Video (720p HD)", extension: "mp4", type: "video" },
    { label: "Download Audio Only (MP3)", extension: "mp3", type: "audio", mode: "audio" },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {currentTool && <JsonLd tool={currentTool} />}

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Video className="h-6 w-6 text-primary" />
          Universal Video & Audio Downloader
        </h1>
        <p className="text-sm text-muted-foreground">
          Supports share links, YouTube Shorts, Reels, TikTok, Twitter/X, and direct media URLs.
        </p>
      </div>

      {/* URL Input Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Paste Video / Share Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste any link (e.g. https://youtu.be/... or Instagram Reel / TikTok share link)"
              className="flex-1 h-12 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleFetchInfo()}
            />
            <Button
              onClick={handleFetchInfo}
              disabled={loading}
              className="h-12 px-6 gap-2 text-sm font-semibold shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" /> Load Video & Options
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Platform badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
            <span className="font-semibold text-foreground">Supported:</span>
            <span className="rounded bg-muted px-2 py-0.5 text-red-400">YouTube & Shorts</span>
            <span className="rounded bg-muted px-2 py-0.5 text-pink-400">Instagram Reels & Posts</span>
            <span className="rounded bg-muted px-2 py-0.5 text-cyan-400">TikTok</span>
            <span className="rounded bg-muted px-2 py-0.5 text-blue-400">Twitter / X</span>
            <span className="rounded bg-muted px-2 py-0.5 text-blue-600">Facebook</span>
            <span className="rounded bg-muted px-2 py-0.5 text-sky-400">Vimeo</span>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Preview & Download Result Card */}
      {hasSearched && (
        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              {platform} Video Preview & Downloads
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-12 gap-6 items-start">
              
              {/* ── Left / Top: Interactive Video Player Preview ── */}
              <div className="md:col-span-6 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Interactive Live Preview
                </p>
                <div className="relative aspect-video w-full rounded-xl bg-black overflow-hidden border shadow-lg">
                  {youtubeId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0`}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="YouTube Video Preview"
                    />
                  ) : directStreamUrl ? (
                    <video
                      src={directStreamUrl}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
                      <Play className="h-10 w-10 mb-2 opacity-50 text-primary" />
                      <p className="text-xs font-medium">{platform} Media Preview Ready</p>
                      <p className="text-[10px] opacity-75 mt-1">Select your format to download directly to desktop</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Right / Bottom: Direct Download Options ── */}
              <div className="md:col-span-6 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Download Directly To Your Device
                </p>

                <div className="space-y-2.5">
                  {formats.map((fmt, idx) => {
                    const isBusy = downloadingFormat === fmt.label
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/40 hover:bg-muted/70 transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          {fmt.type === "audio" ? (
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                              <Music className="h-4 w-4 shrink-0" />
                            </div>
                          ) : (
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                              <Video className="h-4 w-4 shrink-0" />
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-semibold">{fmt.label}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{fmt.extension.toUpperCase()} File</p>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          disabled={isBusy}
                          onClick={() => triggerDownload(fmt)}
                          className="gap-1.5 text-xs shrink-0 font-semibold"
                        >
                          {isBusy ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                            </>
                          ) : (
                            <>
                              <Download className="h-3.5 w-3.5" /> Save {fmt.type === "audio" ? "MP3" : "MP4"}
                            </>
                          )}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-500">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Direct browser stream download. Saves directly to your Downloads / Desktop.</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
