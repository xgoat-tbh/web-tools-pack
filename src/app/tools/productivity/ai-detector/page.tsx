"use client"

import { useState, useCallback, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  ScanSearch, RotateCcw, Brain, BarChart3, Loader2, Cpu,
  FlaskConical, ChevronDown, ChevronUp, RefreshCw,
} from "lucide-react"

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface SentenceResult {
  text: string
  hScore: number
  mlScore: number
  combined: number
  isAI: boolean
}

interface AnalysisResult {
  overallScore: number
  mlScore: number | null
  mlStatus: "success" | "loading" | "error" | "retrying"
  mlError?: string
  mlRetryCount?: number
  heuristicScore: number
  sentences: SentenceResult[]
  signals: Signal[]
  aiSentenceCount: number
  totalSentences: number
}

interface Signal {
  name: string
  score: number
  weight: number
  detail: string
}

// ═══════════════════════════════════════════════════════════════
// ML: HuggingFace Inference API — called directly from client
// HF supports CORS for public models, no API key needed
// ═══════════════════════════════════════════════════════════════

// Multiple models as fallbacks
const HF_MODELS = [
  "openai-community/roberta-base-openai-detector",
  "Hello-SimpleAI/chatgpt-detector-roberta",
  "roberta-base-openai-detector",
]

interface HFLabel {
  label: string
  score: number
}

function extractAIScore(data: HFLabel[] | HFLabel[][]): number {
  const labels: HFLabel[] = Array.isArray(data[0])
    ? (data as HFLabel[][])[0]
    : (data as HFLabel[])
  // Different models use different label conventions
  const fake =
    labels.find((l) => l.label === "LABEL_1") ||
    labels.find((l) => l.label.toLowerCase().includes("fake")) ||
    labels.find((l) => l.label.toLowerCase().includes("ai")) ||
    labels.find((l) => l.label.toLowerCase() === "chatgpt")
  return fake ? fake.score * 100 : 0
}

async function tryModel(
  modelUrl: string,
  text: string,
  signal: AbortSignal
): Promise<number> {
  const res = await fetch(modelUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
    signal,
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`${res.status}: ${body.slice(0, 100)}`)
  }

  const data = await res.json()
  return extractAIScore(data)
}

// Main ML function: tries models with retries + fallbacks
async function runML(
  text: string,
  onStatus: (status: string) => void,
  abortSignal: AbortSignal
): Promise<number> {
  const words = text.split(/\s+/)
  const chunkSize = 300
  const chunks: string[] = []
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" "))
  }
  const toAnalyze = chunks.slice(0, 5)

  // Try each model
  for (let mi = 0; mi < HF_MODELS.length; mi++) {
    const model = HF_MODELS[mi]
    const url = `https://api-inference.huggingface.co/models/${model}`
    const modelName = model.split("/").pop() || model

    // Retry up to 3 times per model
    for (let attempt = 1; attempt <= 3; attempt++) {
      if (abortSignal.aborted) throw new Error("Cancelled")

      onStatus(
        attempt === 1
          ? `Connecting to ${modelName}...`
          : `Retry ${attempt}/3 for ${modelName}...`
      )

      try {
        // Classify all chunks with this model
        const scores = await Promise.all(
          toAnalyze.map((chunk) => tryModel(url, chunk, abortSignal))
        )

        // Weighted average (earlier chunks weigh more)
        let wSum = 0,
          wTotal = 0
        scores.forEach((s, i) => {
          const w = 1 / (1 + i * 0.25)
          wSum += s * w
          wTotal += w
        })
        return wSum / wTotal
      } catch (err) {
        if (abortSignal.aborted) throw new Error("Cancelled")
        const msg = err instanceof Error ? err.message : ""

        // 503 = model loading, wait and retry
        if (msg.includes("503") && attempt < 3) {
          onStatus(`Model loading, waiting 15s (attempt ${attempt}/3)...`)
          await new Promise((r) => setTimeout(r, 15000))
          continue
        }

        // Other errors or last attempt — try next model
        if (attempt === 3 || !msg.includes("503")) {
          onStatus(
            mi < HF_MODELS.length - 1
              ? `${modelName} failed, trying next model...`
              : `All models failed`
          )
          break
        }
      }
    }
  }

  throw new Error("All ML models unavailable — using patterns only")
}

// ═══════════════════════════════════════════════════════════════
// HEURISTIC ENGINE
// ═══════════════════════════════════════════════════════════════

const AI_PHRASES = [
  "it's important to note", "it is important to note",
  "it's worth noting", "it is worth noting",
  "in today's digital age", "in today's rapidly evolving",
  "in the realm of", "in the ever-evolving",
  "this comprehensive guide", "delve into", "delve deeper",
  "without further ado", "plays a crucial role", "plays a vital role",
  "leverage the power", "harness the power", "navigate the complexities",
  "tapestry of", "a testament to", "stands as a testament",
  "it cannot be overstated", "the intricacies of", "paves the way",
  "a myriad of", "it's crucial to", "it is crucial to",
  "it's essential to", "it is essential to",
  "when it comes to", "in order to", "a wide range of",
  "the landscape of", "first and foremost", "last but not least",
  "on the other hand", "in conclusion", "in summary",
  "transformative force", "one of the most",
  "significant opportunities", "important challenges",
  "as education continues", "for example,", "for instance,",
  "however,", "moreover,", "furthermore,", "additionally,",
  "consequently,", "nevertheless,", "this approach",
  "should be viewed as", "rather than a replacement",
  "remain essential", "the future of", "will likely involve",
  "balanced partnership", "aiming to create",
]

const AI_VOCABULARY = [
  "multifaceted", "seamlessly", "robust", "foster", "empower",
  "elevate", "streamline", "utilize", "facilitate", "encompass",
  "underscore", "meticulous", "intricate", "holistic", "pivotal",
  "paradigm", "synergy", "myriad", "nuanced", "comprehensive",
  "leverage", "optimize", "paramount", "indispensable",
  "groundbreaking", "transformative", "unprecedented",
  "cornerstone", "ecosystem", "catalyst", "scalable",
  "actionable", "noteworthy", "invaluable", "compelling",
  "foundational", "bolster", "cultivate", "demystify",
  "personalized", "adaptive", "accordingly", "accommodate",
  "integration", "significant", "ultimately", "inclusive",
  "opportunities", "challenges", "essential", "effective",
  "engaging", "innovative", "supportive", "responsible",
  "analyzing", "evolving",
]

const CONTRACTIONS = [
  "i'm", "i've", "i'll", "i'd", "you're", "you've", "you'll",
  "he's", "she's", "it's", "we're", "they're", "we've", "they've",
  "isn't", "aren't", "wasn't", "weren't", "don't", "doesn't",
  "didn't", "won't", "wouldn't", "couldn't", "shouldn't", "can't",
  "hasn't", "haven't", "that's", "there's", "what's", "let's",
]

const TRANSITIONS = [
  "however", "therefore", "furthermore", "moreover", "additionally",
  "consequently", "nevertheless", "nonetheless", "meanwhile",
  "subsequently", "accordingly", "hence", "thus", "notably",
  "significantly", "importantly", "conversely", "alternatively",
  "specifically", "essentially", "fundamentally", "ultimately",
  "undoubtedly", "arguably", "evidently",
]

function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v))
}

function computeCV(values: number[]): number {
  if (values.length < 2) return 0
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length
  return avg > 0 ? Math.sqrt(variance) / avg : 0
}

function countRegex(text: string, pattern: RegExp): number {
  return (text.match(pattern) || []).length
}

function scoreSentence(sent: string): number {
  const lower = sent.toLowerCase()
  const words = sent.split(/\s+/).filter(Boolean)
  const wc = words.length
  let score = 0

  let phraseHits = 0
  for (const p of AI_PHRASES) {
    if (lower.includes(p)) phraseHits++
  }
  score += Math.min(40, phraseHits * 18)

  let vocabHits = 0
  for (const v of AI_VOCABULARY) {
    if (new RegExp(`\\b${v}\\b`, "i").test(lower)) vocabHits++
  }
  score += Math.min(35, vocabHits * 7)

  const hasContraction = CONTRACTIONS.some((c) =>
    new RegExp(`\\b${c.replace("'", "[''']")}\\b`, "i").test(lower)
  )
  if (!hasContraction && wc > 5) score += 10

  if (!/\b(i|me|my|we|our|you|your)\b/i.test(lower) && wc > 8) score += 8

  const firstWord = words[0]?.toLowerCase().replace(/[^a-z]/g, "") || ""
  if (TRANSITIONS.includes(firstWord)) score += 12

  if (wc >= 15 && wc <= 35) score += 8
  if (wc >= 20 && wc <= 30) score += 5

  if (/\b(one of the most|both .+ and|offers? .+ opportunities|plays? a .+ role|capable of|can be .+ as|should be|rather than|aims? to|continues? to)\b/i.test(sent))
    score += 12

  const commaCount = (sent.match(/,/g) || []).length
  if (commaCount >= 3 && wc > 12) score += 8
  if (commaCount >= 4) score += 5

  return clamp(score)
}

function runHeuristics(text: string): { score: number; signals: Signal[] } {
  const lower = text.toLowerCase()
  const words = text.split(/\s+/).filter(Boolean)
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 3)
  const wordCount = words.length
  const signals: Signal[] = []

  let phraseHits = 0
  const foundP: string[] = []
  for (const p of AI_PHRASES) {
    if (lower.includes(p)) { phraseHits++; if (foundP.length < 4) foundP.push(p) }
  }
  signals.push({ name: "AI Phrases", score: clamp(Math.min(100, phraseHits * 12)), weight: 0.20,
    detail: foundP.length > 0 ? `${phraseHits} found: "${foundP.slice(0, 3).join('", "')}"...` : "None" })

  let vocabHits = 0
  for (const w of AI_VOCABULARY) {
    const m = lower.match(new RegExp(`\\b${w}\\b`, "gi"))
    if (m) vocabHits += m.length
  }
  signals.push({ name: "AI Vocabulary", score: clamp((vocabHits / Math.max(1, wordCount / 100)) * 14), weight: 0.15,
    detail: `${vocabHits} AI-favored words per ${wordCount} words` })

  const sentLengths = sentences.map((s) => s.trim().split(/\s+/).length)
  const sentCV = computeCV(sentLengths)
  signals.push({ name: "Sentence Uniformity", score: clamp(sentCV < 0.18 ? 95 : sentCV < 0.25 ? 80 : sentCV < 0.35 ? 60 : sentCV < 0.45 ? 35 : 12), weight: 0.15,
    detail: `CV: ${(sentCV * 100).toFixed(0)}%` })

  let bScore = 50
  if (sentences.length >= 5) {
    const windowAvgs: number[] = []
    for (let i = 0; i <= sentLengths.length - 3; i++) {
      const win = sentLengths.slice(i, i + 3)
      windowAvgs.push(win.reduce((a, b) => a + b, 0) / 3)
    }
    const bCV = computeCV(windowAvgs)
    bScore = clamp(bCV < 0.12 ? 92 : bCV < 0.2 ? 75 : bCV < 0.3 ? 50 : bCV < 0.45 ? 20 : 5)
  }
  signals.push({ name: "Burstiness", score: bScore, weight: 0.12, detail: `${sentences.length} sentences` })

  let cc = 0
  for (const c of CONTRACTIONS) {
    cc += countRegex(lower, new RegExp(`\\b${c.replace("'", "[''']")}\\b`, "gi"))
  }
  const cps = cc / Math.max(1, sentences.length)
  signals.push({ name: "Contractions", score: clamp(cps < 0.03 ? 90 : cps < 0.1 ? 70 : cps < 0.25 ? 45 : cps < 0.4 ? 20 : 5), weight: 0.12,
    detail: `${cc} contractions (${cps.toFixed(2)}/sent)` })

  let tc = 0
  for (const tw of TRANSITIONS) {
    tc += countRegex(lower, new RegExp(`\\b${tw}\\b`, "gi"))
  }
  const tDensity = tc / Math.max(1, sentences.length)
  signals.push({ name: "Transition Words", score: clamp(tDensity > 0.45 ? 90 : tDensity > 0.3 ? 72 : tDensity > 0.18 ? 50 : tDensity > 0.08 ? 25 : 8), weight: 0.12,
    detail: `${tc} transitions (${(tDensity * 100).toFixed(0)}% density)` })

  const firstPerson = countRegex(lower, /\b(i|me|my|mine|myself)\b/g)
  const informal = countRegex(lower, /\b(yeah|nope|okay|lol|haha|wow|cool|gonna|wanna|gotta|kinda|tbh|imo|btw|ngl|idk|honestly|literally|basically|stuff|pretty much)\b/g)
  const fp100 = (firstPerson + informal) / Math.max(1, wordCount / 100)
  signals.push({ name: "Personal Voice", score: clamp(fp100 < 0.2 ? 85 : fp100 < 0.8 ? 60 : fp100 < 2 ? 35 : fp100 < 4 ? 12 : 5), weight: 0.14,
    detail: `${firstPerson + informal} personal/informal markers` })

  const totalW = signals.reduce((a, s) => a + s.weight, 0)
  const hScore = Math.round(signals.reduce((sum, s) => sum + s.score * s.weight, 0) / totalW)

  return { score: hScore, signals }
}

// ═══════════════════════════════════════════════════════════════
// CIRCULAR GAUGE
// ═══════════════════════════════════════════════════════════════

function CircularGauge({ score, size = 180 }: { score: number; size?: number }) {
  const strokeWidth = 14
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference

  const getColor = (s: number) => {
    if (s >= 80) return "#ef4444"
    if (s >= 60) return "#f97316"
    if (s >= 40) return "#eab308"
    if (s >= 20) return "#84cc16"
    return "#22c55e"
  }

  const getLabel = (s: number) => {
    if (s >= 85) return "AI Generated"
    if (s >= 65) return "Mostly AI"
    if (s >= 40) return "Mixed"
    if (s >= 20) return "Mostly Human"
    return "Human Written"
  }

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor" strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={getColor(score)} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold font-mono" style={{ color: getColor(score) }}>
          {score}%
        </span>
        <span className="text-xs text-muted-foreground font-medium mt-0.5">
          {getLabel(score)}
        </span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function AIDetectorPage() {
  const [text, setText] = useState("")
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [showSignals, setShowSignals] = useState(false)
  const [mlStatusText, setMlStatusText] = useState("")
  const abortRef = useRef<AbortController | null>(null)

  const splitSentences = (t: string): string[] =>
    t.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 3)

  const handleAnalyze = useCallback(async () => {
    const trimmed = text.trim()
    const wc = trimmed.split(/\s+/).length
    if (wc < 30) return

    // Cancel any previous ML request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setAnalyzing(true)
    setShowSignals(false)
    setMlStatusText("")

    const sentences = splitSentences(trimmed)
    const heuristic = runHeuristics(trimmed)
    const sentenceHScores = sentences.map((s) => scoreSentence(s))

    // Show heuristic result immediately
    const hSentences: SentenceResult[] = sentences.map((s, i) => ({
      text: s, hScore: sentenceHScores[i], mlScore: -1,
      combined: sentenceHScores[i], isAI: sentenceHScores[i] >= 45,
    }))

    setResult({
      overallScore: heuristic.score,
      mlScore: null,
      mlStatus: "loading",
      heuristicScore: heuristic.score,
      sentences: hSentences,
      signals: heuristic.signals,
      aiSentenceCount: hSentences.filter((s) => s.isAI).length,
      totalSentences: sentences.length,
    })

    // Run ML asynchronously
    try {
      const mlScore = await runML(trimmed, setMlStatusText, controller.signal)
      if (controller.signal.aborted) return
      const mlRound = Math.round(mlScore)
      const combined = Math.round(mlRound * 0.65 + heuristic.score * 0.35)

      const finalSentences: SentenceResult[] = sentences.map((s, i) => {
        const h = sentenceHScores[i]
        // For per-sentence, blend ML overall with heuristic sentence score
        const c = Math.round(mlRound * 0.5 + h * 0.5)
        return { text: s, hScore: h, mlScore: mlRound, combined: c, isAI: c >= 45 }
      })

      setResult({
        overallScore: combined,
        mlScore: mlRound,
        mlStatus: "success",
        heuristicScore: heuristic.score,
        sentences: finalSentences,
        signals: heuristic.signals,
        aiSentenceCount: finalSentences.filter((s) => s.isAI).length,
        totalSentences: sentences.length,
      })
      setMlStatusText("")
    } catch (err) {
      if (controller.signal.aborted) return
      setResult((prev) =>
        prev ? { ...prev, mlStatus: "error", mlError: err instanceof Error ? err.message : "ML unavailable" } : null
      )
      setMlStatusText("")
    } finally {
      setAnalyzing(false)
    }
  }, [text])

  const retryML = useCallback(async () => {
    if (!result || !text.trim()) return
    const trimmed = text.trim()

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setResult((prev) => prev ? { ...prev, mlStatus: "loading", mlError: undefined } : null)
    setMlStatusText("")

    try {
      const mlScore = await runML(trimmed, setMlStatusText, controller.signal)
      if (controller.signal.aborted) return
      const mlRound = Math.round(mlScore)
      const combined = Math.round(mlRound * 0.65 + result.heuristicScore * 0.35)

      const sentences = splitSentences(trimmed)
      const sentenceHScores = sentences.map((s) => scoreSentence(s))

      const finalSentences: SentenceResult[] = sentences.map((s, i) => {
        const h = sentenceHScores[i]
        const c = Math.round(mlRound * 0.5 + h * 0.5)
        return { text: s, hScore: h, mlScore: mlRound, combined: c, isAI: c >= 45 }
      })

      setResult({
        overallScore: combined,
        mlScore: mlRound,
        mlStatus: "success",
        heuristicScore: result.heuristicScore,
        sentences: finalSentences,
        signals: result.signals,
        aiSentenceCount: finalSentences.filter((s) => s.isAI).length,
        totalSentences: sentences.length,
      })
      setMlStatusText("")
    } catch (err) {
      if (controller.signal.aborted) return
      setResult((prev) =>
        prev ? { ...prev, mlStatus: "error", mlError: err instanceof Error ? err.message : "ML unavailable" } : null
      )
      setMlStatusText("")
    }
  }, [result, text])

  const reset = () => {
    abortRef.current?.abort()
    setText("")
    setResult(null)
    setShowSignals(false)
    setMlStatusText("")
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-red-500"
    if (s >= 60) return "text-orange-500"
    if (s >= 40) return "text-yellow-500"
    if (s >= 20) return "text-lime-500"
    return "text-green-500"
  }

  const getBarColor = (s: number) => {
    if (s >= 65) return "bg-red-500"
    if (s >= 40) return "bg-yellow-500"
    return "bg-green-500"
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center gap-2">
        <ScanSearch className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">AI Content Detector</h1>
      </div>
      <p className="text-muted-foreground text-sm">
        Detects AI-generated text using a <strong>RoBERTa ML model</strong> + pattern analysis.
        AI-generated sentences are <span className="bg-yellow-500/30 px-1 rounded">highlighted</span>.
      </p>

      {/* Input */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <Textarea
            placeholder="Paste the text you want to analyze (minimum 30 words, 200+ recommended)..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[180px] resize-y text-sm"
          />
          <div className="flex items-center justify-between">
            <span className={`text-xs ${wordCount < 30 ? "text-muted-foreground" : wordCount < 200 ? "text-yellow-500" : "text-green-500"}`}>
              {wordCount} words
              {wordCount > 0 && wordCount < 30 && ` (need ${30 - wordCount} more)`}
              {wordCount >= 30 && wordCount < 200 && " (200+ recommended)"}
              {wordCount >= 200 && " \u2713"}
            </span>
            <div className="flex gap-2">
              {text && (
                <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" /> Clear
                </Button>
              )}
              <Button onClick={handleAnalyze} disabled={wordCount < 30 || analyzing} size="sm" className="gap-1.5">
                {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
                {analyzing ? "Analyzing..." : "Detect AI Content"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          {/* Score Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <CircularGauge score={result.overallScore} />

                <div className="flex-1 space-y-3 text-center sm:text-left">
                  <div>
                    <h2 className={`text-xl font-bold ${getScoreColor(result.overallScore)}`}>
                      {result.overallScore >= 85
                        ? "Your Text is AI Generated"
                        : result.overallScore >= 65
                          ? "Your Text is Mostly AI Generated"
                          : result.overallScore >= 40
                            ? "Your Text is Mixed (AI + Human)"
                            : result.overallScore >= 20
                              ? "Your Text is Mostly Human Written"
                              : "Your Text is Human Written"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {result.aiSentenceCount} of {result.totalSentences} sentences appear AI-generated
                    </p>
                  </div>

                  {/* ML + Pattern scores */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border/50 bg-card/50 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Cpu className="h-3 w-3" />
                        ML Model
                        {result.mlStatus === "loading" && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
                      </div>
                      {result.mlStatus === "success" && result.mlScore !== null ? (
                        <span className={`text-lg font-bold font-mono ${getScoreColor(result.mlScore)}`}>
                          {result.mlScore}%
                        </span>
                      ) : result.mlStatus === "loading" ? (
                        <div>
                          <span className="text-xs text-blue-400">
                            {mlStatusText || "Connecting..."}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-400">Failed</span>
                          <button
                            onClick={retryML}
                            className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                          >
                            <RefreshCw className="h-3 w-3" /> Retry
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="rounded-lg border border-border/50 bg-card/50 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <FlaskConical className="h-3 w-3" />
                        Patterns
                      </div>
                      <span className={`text-lg font-bold font-mono ${getScoreColor(result.heuristicScore)}`}>
                        {result.heuristicScore}%
                      </span>
                    </div>
                  </div>

                  {/* Status text while loading */}
                  {result.mlStatus === "loading" && mlStatusText && (
                    <p className="text-[10px] text-muted-foreground animate-pulse">
                      {mlStatusText}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sentence Highlighting */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Sentence Analysis</h3>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded bg-yellow-500/40 border border-yellow-500/60" />
                    AI-generated
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded bg-transparent border border-border" />
                    Human
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-border/50 bg-muted/20 p-4 text-sm leading-relaxed">
                {result.sentences.map((s, i) => (
                  <span
                    key={i}
                    className={`${s.isAI ? "bg-yellow-500/30" : ""}`}
                    title={`AI: ${s.combined}%`}
                  >
                    {s.text}{" "}
                  </span>
                ))}
              </div>

              <div className="mt-4 space-y-1.5 max-h-[400px] overflow-y-auto">
                {result.sentences.map((s, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 text-xs p-2 rounded ${
                      s.isAI ? "bg-yellow-500/10 border-l-2 border-l-yellow-500" : "bg-muted/20 border-l-2 border-l-green-500"
                    }`}
                  >
                    <span className={`font-mono font-bold shrink-0 w-8 text-right ${
                      s.combined >= 65 ? "text-red-400" : s.combined >= 45 ? "text-yellow-400" : "text-green-400"
                    }`}>
                      {s.combined}%
                    </span>
                    <span className="text-muted-foreground">{s.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Signal Breakdown */}
          <Card>
            <CardContent className="p-4">
              <button
                onClick={() => setShowSignals(!showSignals)}
                className="flex items-center justify-between w-full text-sm font-semibold"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Pattern Breakdown ({result.signals.length} signals)
                </div>
                {showSignals ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {showSignals && (
                <div className="mt-4 space-y-3">
                  {result.signals.map((signal, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{signal.name}</span>
                        <span className={`font-mono font-bold ${
                          signal.score >= 65 ? "text-red-400" : signal.score >= 40 ? "text-yellow-400" : "text-green-400"
                        }`}>
                          {signal.score}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${getBarColor(signal.score)}`}
                          style={{ width: `${signal.score}%`, transitionDelay: `${i * 60}ms` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{signal.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
            <p className="text-[10px] text-muted-foreground">
              &#9888;&#65039; No AI detector is 100% accurate. The ML model may take 15-30s on first use while it loads.
              Results combine ML classification (RoBERTa) with linguistic pattern analysis for best accuracy.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
