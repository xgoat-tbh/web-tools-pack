/**
 * Server-side Cobalt API client with multi-endpoint failover.
 * Handles URL normalization, redirect resolution, and metadata extraction.
 */

// Cobalt API v10+ endpoints — community-hosted instances with automatic failover
const COBALT_ENDPOINTS = [
  "https://api.cobalt.tools",
  "https://cobalt.api.timelessnesses.me",
  "https://cobalt-api.ayo.tf",
  "https://co.eepy.today",
  "https://cobalt.canine.tools",
]

export interface CobaltFormat {
  label: string
  type: "video" | "audio"
  url: string
  extension: string
}

export interface VideoMetadata {
  status: "success" | "error"
  platform: string
  title: string
  thumbnail: string | null
  duration: string | null
  formats: CobaltFormat[]
  error?: string
  originalUrl: string
}

// ── URL Normalization ──

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/
  )
  return match ? match[1] : null
}

function detectPlatform(url: string): string {
  const lower = url.toLowerCase()
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "YouTube"
  if (lower.includes("instagram.com") || lower.includes("instagr.am")) return "Instagram"
  if (lower.includes("tiktok.com") || lower.includes("vm.tiktok.com")) return "TikTok"
  if (lower.includes("twitter.com") || lower.includes("x.com")) return "Twitter / X"
  if (lower.includes("facebook.com") || lower.includes("fb.watch")) return "Facebook"
  if (lower.includes("vimeo.com")) return "Vimeo"
  if (lower.includes("reddit.com") || lower.includes("redd.it")) return "Reddit"
  if (lower.includes("pinterest.com") || lower.includes("pin.it")) return "Pinterest"
  if (lower.includes("dailymotion.com") || lower.includes("dai.ly")) return "Dailymotion"
  if (lower.includes("soundcloud.com")) return "SoundCloud"
  if (lower.includes("tumblr.com")) return "Tumblr"
  if (lower.includes("twitch.tv")) return "Twitch"
  if (lower.includes("bilibili.com")) return "Bilibili"
  return "Media"
}

/**
 * Resolve short/share URLs by following redirects server-side.
 * Short URLs like vm.tiktok.com, youtu.be, instagr.am etc. redirect to the canonical URL.
 */
async function resolveRedirects(url: string): Promise<string> {
  const shortDomains = [
    "vm.tiktok.com", "vt.tiktok.com",
    "youtu.be",
    "instagr.am",
    "fb.watch",
    "redd.it",
    "pin.it",
    "dai.ly",
    "t.co",
  ]

  const isShortUrl = shortDomains.some((d) => url.includes(d))
  if (!isShortUrl) return url

  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      },
    })
    return res.url || url
  } catch {
    return url
  }
}

function normalizeUrl(url: string): string {
  let u = url.trim()

  // YouTube: always normalize to canonical watch URL
  const ytId = extractYouTubeId(u)
  if (ytId) return `https://www.youtube.com/watch?v=${ytId}`

  // Instagram: strip tracking params
  if (u.includes("instagram.com")) {
    try {
      const parsed = new URL(u)
      return `${parsed.origin}${parsed.pathname}`
    } catch {
      return u.split("?")[0]
    }
  }

  // TikTok: strip tracking params
  if (u.includes("tiktok.com")) {
    try {
      const parsed = new URL(u)
      return `${parsed.origin}${parsed.pathname}`
    } catch {
      return u.split("?")[0]
    }
  }

  // Twitter/X normalization
  if (u.includes("x.com/")) {
    u = u.replace("x.com/", "twitter.com/")
    try {
      const parsed = new URL(u)
      return `${parsed.origin}${parsed.pathname}`
    } catch {
      return u.split("?")[0]
    }
  }

  return u
}

// ── YouTube oEmbed for metadata ──

interface OEmbedData {
  title?: string
  thumbnail_url?: string
  author_name?: string
}

async function fetchYouTubeOEmbed(videoId: string): Promise<OEmbedData | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// ── Cobalt API Call with Failover ──

interface CobaltResponse {
  status?: string
  url?: string
  picker?: Array<{ url: string; type?: string; thumb?: string }>
  text?: string
  error?: string
}

async function callCobalt(
  url: string,
  mode: "auto" | "audio" = "auto"
): Promise<CobaltResponse | null> {
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
          downloadMode: mode,
          filenameStyle: "pretty",
          videoQuality: "1080",
          audioFormat: "mp3",
        }),
        signal: AbortSignal.timeout(12000),
      })

      if (!res.ok) continue

      const data: CobaltResponse = await res.json()
      if (data.url || (data.picker && data.picker.length > 0)) {
        return data
      }
      // If Cobalt returns an error response, try the next endpoint
      if (data.error || data.status === "error") continue
    } catch {
      // Network error or timeout, try next endpoint
      continue
    }
  }
  return null
}

// ── Main Exported Function ──

export async function getVideoInfo(rawUrl: string): Promise<VideoMetadata> {
  // Step 1: Resolve short/share URLs
  const resolvedUrl = await resolveRedirects(rawUrl)
  const cleanUrl = normalizeUrl(resolvedUrl)
  const platform = detectPlatform(cleanUrl)
  const ytId = extractYouTubeId(cleanUrl)

  // Step 2: Fetch metadata enrichment (YouTube oEmbed)
  let title = `${platform} Video`
  let thumbnail: string | null = null

  if (ytId) {
    const oembed = await fetchYouTubeOEmbed(ytId)
    if (oembed) {
      title = oembed.title || title
      thumbnail =
        `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`
    } else {
      thumbnail = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
    }
  }

  // Step 3: Call Cobalt for video stream URL
  const [videoData, audioData] = await Promise.all([
    callCobalt(cleanUrl, "auto"),
    callCobalt(cleanUrl, "audio"),
  ])

  const formats: CobaltFormat[] = []

  // Video format
  const videoUrl =
    videoData?.url || (videoData?.picker && videoData.picker[0]?.url) || null
  if (videoUrl) {
    formats.push({
      label: "Video (Best Quality)",
      type: "video",
      url: videoUrl,
      extension: "mp4",
    })
  }

  // Audio format
  const audioUrl =
    audioData?.url || (audioData?.picker && audioData.picker[0]?.url) || null
  if (audioUrl) {
    formats.push({
      label: "Audio Only (MP3)",
      type: "audio",
      url: audioUrl,
      extension: "mp3",
    })
  }

  // If we got picker items (e.g., Instagram carousel), add them as individual downloads
  if (videoData?.picker && videoData.picker.length > 1) {
    videoData.picker.forEach((item, idx) => {
      formats.push({
        label: `Media ${idx + 1}`,
        type: "video",
        url: item.url,
        extension: "mp4",
      })
    })
  }

  if (formats.length === 0) {
    return {
      status: "error",
      platform,
      title,
      thumbnail,
      duration: null,
      formats: [],
      error:
        "Could not extract download links. The video may be private, age-restricted, or the URL is unsupported.",
      originalUrl: cleanUrl,
    }
  }

  return {
    status: "success",
    platform,
    title,
    thumbnail,
    duration: null,
    formats,
    originalUrl: cleanUrl,
  }
}

export { extractYouTubeId, detectPlatform, normalizeUrl }
