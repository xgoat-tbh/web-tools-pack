import { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mediaUrl = searchParams.get("url")
  const filename = searchParams.get("filename") || "download.mp4"

  if (!mediaUrl) {
    return new Response(JSON.stringify({ error: "Missing url parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    // Fetch the media file server-side (bypasses CORS)
    const upstream = await fetch(mediaUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(25000),
    })

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: `Upstream responded with ${upstream.status}` }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      )
    }

    // Determine content type
    const contentType =
      upstream.headers.get("Content-Type") || "application/octet-stream"
    const contentLength = upstream.headers.get("Content-Length")

    // Build response headers for download
    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      "Cache-Control": "no-cache",
    }

    if (contentLength) {
      headers["Content-Length"] = contentLength
    }

    // Stream the response body through to the client
    return new Response(upstream.body, {
      status: 200,
      headers,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Download proxy failed"

    // If it's a timeout, return a special response
    if (message.includes("timed out") || message.includes("abort")) {
      return new Response(
        JSON.stringify({
          error: "Download timed out. Try the direct download link instead.",
          fallback: mediaUrl,
        }),
        { status: 504, headers: { "Content-Type": "application/json" } }
      )
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
