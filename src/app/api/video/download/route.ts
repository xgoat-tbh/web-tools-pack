import { NextRequest } from "next/server"

export const runtime = "edge"

function getBackendUrl(): string | null {
  const envUrl = process.env.YT_DLP_BACKEND_URL
  if (!envUrl) return null
  const cleaned = envUrl.trim().replace(/\/+$/, "")
  if (process.env.VERCEL && cleaned.includes("localhost")) return null
  return cleaned
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mediaUrl = searchParams.get("url")
  const format = searchParams.get("format") || "bv*+ba/b"
  const filename = searchParams.get("filename") || "download.mp4"
  const directUrl = searchParams.get("directUrl")

  if (!mediaUrl && !directUrl) {
    return new Response(JSON.stringify({ error: "Missing url parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const backendUrl = getBackendUrl()

  // Strategy 1: Try custom yt-dlp backend download proxy if format is yt-dlp format
  if (backendUrl && !directUrl) {
    try {
      const proxyUrl = `${backendUrl}/api/download?url=${encodeURIComponent(mediaUrl!)}&format=${encodeURIComponent(format)}&filename=${encodeURIComponent(filename)}`

      const upstream = await fetch(proxyUrl, {
        signal: AbortSignal.timeout(300000), // 5 min timeout for large files
      })

      if (upstream.ok) {
        const headers: Record<string, string> = {
          "Content-Type": upstream.headers.get("Content-Type") || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
          "Cache-Control": "no-cache",
        }

        const contentLength = upstream.headers.get("Content-Length")
        if (contentLength) {
          headers["Content-Length"] = contentLength
        }

        return new Response(upstream.body, { status: 200, headers })
      }
    } catch (e) {
      console.warn("yt-dlp backend download failed, falling back to direct stream:", e)
    }
  }

  // Strategy 2: Direct stream proxy from media URL or Cobalt direct URL
  const targetStreamUrl = directUrl || mediaUrl
  if (targetStreamUrl) {
    try {
      const upstream = await fetch(targetStreamUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(30000),
      })

      if (upstream.ok) {
        const headers: Record<string, string> = {
          "Content-Type": upstream.headers.get("Content-Type") || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
          "Cache-Control": "no-cache",
        }

        const contentLength = upstream.headers.get("Content-Length")
        if (contentLength) {
          headers["Content-Length"] = contentLength
        }

        return new Response(upstream.body, { status: 200, headers })
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Direct download failed"
      return new Response(
        JSON.stringify({ error: message, fallback: targetStreamUrl }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      )
    }
  }

  return new Response(JSON.stringify({ error: "Download stream could not be established." }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  })
}
