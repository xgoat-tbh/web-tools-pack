import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

const COBALT_ENDPOINTS = [
  "https://api.cobalt.tools/api/json",
  "https://co.wuk.sh/api/json",
  "https://cobalt.api.scotty.rip/api/json",
  "https://co.eepy.today/api/json",
]

function getBackendUrl(): string | null {
  const envUrl = process.env.YT_DLP_BACKEND_URL
  if (!envUrl) return null
  const cleaned = envUrl.trim().replace(/\/+$/, "")
  // Skip localhost if running on Vercel production
  if (process.env.VERCEL && cleaned.includes("localhost")) return null
  return cleaned
}

function detectPlatform(url: string): string {
  const u = url.toLowerCase()
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "YouTube"
  if (u.includes("instagram.com")) return "Instagram"
  if (u.includes("tiktok.com")) return "TikTok"
  if (u.includes("twitter.com") || u.includes("x.com")) return "Twitter / X"
  if (u.includes("facebook.com") || u.includes("fb.watch")) return "Facebook"
  if (u.includes("vimeo.com")) return "Vimeo"
  if (u.includes("reddit.com") || u.includes("redd.it")) return "Reddit"
  if (u.includes("soundcloud.com")) return "SoundCloud"
  if (u.includes("twitch.tv")) return "Twitch"
  if (u.includes("dailymotion.com") || u.includes("dai.ly")) return "Dailymotion"
  if (u.includes("pinterest.com") || u.includes("pin.it")) return "Pinterest"
  return "Media"
}

function cleanUrlInput(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== "string") return ""
  let trimmed = rawUrl.trim()
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
}

// ── Fallback Cobalt + oEmbed extractor ──
async function extractWithCobalt(url: string) {
  const platform = detectPlatform(url)
  let title = `${platform} Video`
  let thumbnail: string | null = null

  // Enrich YouTube metadata via oEmbed
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/))([\w-]{11})/)
  if (ytMatch) {
    const videoId = ytMatch[1]
    thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        { signal: AbortSignal.timeout(5000) }
      )
      if (oembedRes.ok) {
        const oembed = await oembedRes.json()
        if (oembed.title) title = oembed.title
      }
    } catch {
      // ignore oembed timeout
    }
  }

  for (const endpoint of COBALT_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          downloadMode: "auto",
          vQuality: "1080",
        }),
        signal: AbortSignal.timeout(10000),
      })

      if (!res.ok) continue
      const contentType = res.headers.get("content-type") || ""
      if (!contentType.includes("application/json")) continue

      const data = await res.json()
      const mediaUrl = data.url || (data.picker && data.picker[0]?.url)
      if (!mediaUrl) continue

      return {
        status: "success",
        platform,
        title,
        thumbnail,
        duration: null,
        durationSeconds: null,
        uploader: null,
        uploaderUrl: null,
        viewCount: null,
        uploadDate: null,
        formats: [
          {
            id: "cobalt-video",
            label: "Best Quality (Video + Audio)",
            qualityLabel: "Best",
            type: "video",
            ext: "mp4",
            directUrl: mediaUrl,
            isBest: true,
          },
          {
            id: "cobalt-audio",
            label: "Best Audio (MP3)",
            qualityLabel: "Best",
            type: "audio",
            ext: "mp3",
            directUrl: mediaUrl,
            isBest: true,
            needsConversion: true,
          },
        ],
        originalUrl: url,
      }
    } catch {
      continue
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const rawUrl = body.url
    const url = cleanUrlInput(rawUrl)

    if (!url) {
      return NextResponse.json(
        { status: "error", error: "Missing or invalid URL" },
        { status: 400 }
      )
    }

    const backendUrl = getBackendUrl()

    // Strategy 1: Try custom yt-dlp backend if configured
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/api/info`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
          signal: AbortSignal.timeout(25000),
        })

        const contentType = res.headers.get("content-type") || ""

        if (res.ok && contentType.includes("application/json")) {
          const data = await res.json()
          if (data.status === "success" && data.formats?.length > 0) {
            return NextResponse.json(data)
          }
        }
      } catch (e) {
        console.warn("yt-dlp backend unavailable, falling back to serverless extraction:", e)
      }
    }

    // Strategy 2: Fallback to Cobalt + oEmbed serverless extraction
    const fallback = await extractWithCobalt(url)
    if (fallback) {
      return NextResponse.json(fallback)
    }

    return NextResponse.json(
      {
        status: "error",
        error: "Could not extract video information. Please make sure the video link is public and valid.",
      },
      { status: 422 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Extraction failed"
    return NextResponse.json(
      { status: "error", error: message },
      { status: 500 }
    )
  }
}
