import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.YT_DLP_BACKEND_URL || "http://localhost:3001"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { status: "error", error: "Missing or invalid URL" },
        { status: 400 }
      )
    }

    // Proxy to yt-dlp backend
    const res = await fetch(`${BACKEND_URL}/api/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(35000),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Backend unavailable"

    // Check if it's a timeout or connection error
    if (message.includes("fetch failed") || message.includes("ECONNREFUSED")) {
      return NextResponse.json(
        {
          status: "error",
          error: "Video extraction backend is currently offline. Please try again later.",
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { status: "error", error: message },
      { status: 500 }
    )
  }
}
