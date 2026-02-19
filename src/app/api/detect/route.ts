import { NextRequest, NextResponse } from "next/server"

const HF_MODEL = "openai-community/roberta-base-openai-detector"
const HF_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`

interface HFLabel {
  label: string
  score: number
}

async function classifyChunk(text: string): Promise<number> {
  const res = await fetch(HF_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inputs: text }),
  })

  if (res.status === 503) {
    const body = await res.json()
    const wait = Math.min((body.estimated_time || 20) * 1000, 30000)
    await new Promise((r) => setTimeout(r, wait))
    const retry = await fetch(HF_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: text }),
    })
    if (!retry.ok) throw new Error(`Model loading (${retry.status})`)
    const data = await retry.json()
    return extractAIScore(data)
  }

  if (!res.ok) throw new Error(`HF API error (${res.status})`)
  const data = await res.json()
  return extractAIScore(data)
}

function extractAIScore(data: HFLabel[] | HFLabel[][]): number {
  const labels: HFLabel[] = Array.isArray(data[0]) ? (data as HFLabel[][])[0] : (data as HFLabel[])
  const fake = labels.find((l) => l.label === "LABEL_1" || l.label.toLowerCase() === "fake")
  return fake ? fake.score * 100 : 0
}

export async function POST(req: NextRequest) {
  try {
    const { sentences } = (await req.json()) as { sentences: string[] }

    if (!sentences || !Array.isArray(sentences) || sentences.length === 0) {
      return NextResponse.json({ error: "No sentences provided" }, { status: 400 })
    }

    // Group sentences into chunks of ~280 words for the model's 512-token limit
    const chunks: { text: string; sentenceIndices: number[] }[] = []
    let currentChunk = ""
    let currentIndices: number[] = []
    let currentWordCount = 0

    sentences.forEach((sent, i) => {
      const words = sent.trim().split(/\s+/).length
      if (currentWordCount + words > 280 && currentChunk) {
        chunks.push({ text: currentChunk.trim(), sentenceIndices: [...currentIndices] })
        currentChunk = ""
        currentIndices = []
        currentWordCount = 0
      }
      currentChunk += sent + " "
      currentIndices.push(i)
      currentWordCount += words
    })
    if (currentChunk.trim()) {
      chunks.push({ text: currentChunk.trim(), sentenceIndices: [...currentIndices] })
    }

    // Classify each chunk (limit to 8 chunks)
    const toProcess = chunks.slice(0, 8)
    const chunkScores = await Promise.all(
      toProcess.map(async (chunk) => {
        try {
          const score = await classifyChunk(chunk.text)
          return { score, indices: chunk.sentenceIndices }
        } catch {
          return { score: -1, indices: chunk.sentenceIndices } // -1 = failed
        }
      })
    )

    // Map scores back to sentences
    const sentenceScores: number[] = new Array(sentences.length).fill(-1)
    for (const cs of chunkScores) {
      if (cs.score >= 0) {
        for (const idx of cs.indices) {
          sentenceScores[idx] = cs.score
        }
      }
    }

    // Compute overall ML score (weighted: earlier chunks matter more)
    const validScores = chunkScores.filter((c) => c.score >= 0)
    let mlScore = -1
    if (validScores.length > 0) {
      let wSum = 0, wTotal = 0
      validScores.forEach((c, i) => {
        const w = 1 / (1 + i * 0.2)
        wSum += c.score * w
        wTotal += w
      })
      mlScore = wSum / wTotal
    }

    return NextResponse.json({ mlScore, sentenceScores })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error", mlScore: -1, sentenceScores: [] },
      { status: 500 }
    )
  }
}
