import { NextRequest } from "next/server"

const BACKEND_URL = process.env.YT_DLP_BACKEND_URL || "http://localhost:3001"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mediaUrl = searchParams.get("url")
  const format = searchParams.get("format") || "bv*+ba/b"
  const filename = searchParams.get("filename") || "download.mp4"

  if (!mediaUrl) {
    return new Response(JSON.stringify({ error: "Missing url parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    // Proxy to yt-dlp backend download endpoint
    const backendUrl = `${BACKEND_URL}/api/download?url=${encodeURIComponent(mediaUrl)}&format=${encodeURIComponent(format)}&filename=${encodeURIComponent(filename)}`

    const upstream = await fetch(backendUrl, {
      signal: AbortSignal.timeout(300000), // 5 min timeout for large files
    })

    if (!upstream.ok) {
      const errText = await upstream.text()
      return new Response(errText, {
        status: upstream.status,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Stream the response through
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Download proxy failed"
    return new Response(
      JSON.stringify({ error: message }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    )
  }
}
