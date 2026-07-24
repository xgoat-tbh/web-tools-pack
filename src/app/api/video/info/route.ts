import { NextRequest, NextResponse } from "next/server"
import { getVideoInfo } from "@/lib/cobalt"

export const runtime = "edge" // Use edge runtime for faster cold starts

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

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { status: "error", error: "Invalid URL format. Please paste a valid video link." },
        { status: 400 }
      )
    }

    const metadata = await getVideoInfo(url)
    return NextResponse.json(metadata)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json(
      { status: "error", error: message },
      { status: 500 }
    )
  }
}
