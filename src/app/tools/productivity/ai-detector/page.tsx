"use client"

import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  ScanSearch, AlertTriangle, CheckCircle2, RotateCcw, Sparkles,
  Brain, BarChart3, ShieldCheck, Loader2, Cpu, FlaskConical,
} from "lucide-react"

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface AnalysisResult {
  overallScore: number
  confidence: "low" | "medium" | "high"
  mlScore: number | null
  mlStatus: "success" | "loading" | "error" | "idle"
  mlError?: string
  heuristicScore: number
  signals: Signal[]
  summary: string
  verdict: "likely-human" | "mixed" | "likely-ai"
  sentenceScores: { text: string; score: number }[]
}

interface Signal {
  name: string
  description: string
  score: number
  weight: number
  detail: string
}

// ═══════════════════════════════════════════════════════════════
// ML DETECTION — HuggingFace Inference API (free, no key)
// ═══════════════════════════════════════════════════════════════

const HF_MODEL = "openai-community/roberta-base-openai-detector"
const HF_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`

interface HFResult {
  label: string
  score: number
}

async function queryHuggingFace(text: string): Promise<number> {
  const words = text.split(/\s+/)
  const chunkSize = 300
  const chunks: string[] = []

  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" "))
  }

  const toAnalyze = chunks.slice(0, 5)

  const results = await Promise.all(
    toAnalyze.map(async (chunk) => {
      const res = await fetch(HF_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: chunk }),
      })

      if (res.status === 503) {
        const body = await res.json()
        const wait = (body.estimated_time || 20) * 1000
        await new Promise((r) => setTimeout(r, Math.min(wait, 30000)))
        const retry = await fetch(HF_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputs: chunk }),
        })
        if (!retry.ok) throw new Error(`Model unavailable (${retry.status})`)
        return retry.json()
      }

      if (!res.ok) throw new Error(`API error (${res.status})`)
      return res.json()
    })
  )

  const aiScores = results.map((r: HFResult[][]) => {
    const labels = r[0] || r
    const fakeLabel = (labels as HFResult[]).find(
      (l) => l.label === "LABEL_1" || l.label.toLowerCase() === "fake"
    )
    return fakeLabel ? fakeLabel.score : 0
  })

  let weightedSum = 0
  let totalWeight = 0
  aiScores.forEach((score, i) => {
    const w = 1 / (1 + i * 0.3)
    weightedSum += score * w
    totalWeight += w
  })

  return (weightedSum / totalWeight) * 100
}

// ═══════════════════════════════════════════════════════════════
// HEURISTIC SIGNALS (secondary layer)
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
]

const CONTRACTIONS = [
  "i'm", "i've", "i'll", "i'd", "you're", "you've", "you'll",
  "he's", "she's", "it's", "we're", "they're", "we've", "they've",
  "isn't", "aren't", "wasn't", "weren't", "don't", "doesn't",
  "didn't", "won't", "wouldn't", "couldn't", "shouldn't", "can't",
  "hasn't", "haven't", "that's", "there's", "what's", "let's",
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

function runHeuristics(text: string): {
  score: number
  signals: Signal[]
  sentenceScores: { text: string; score: number }[]
} {
  const lower = text.toLowerCase()
  const words = text.split(/\s+/).filter(Boolean)
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 3)
  const wordCount = words.length
  const signals: Signal[] = []

  // 1. AI Phrases
  const found: string[] = []
  for (const p of AI_PHRASES) {
    if (lower.includes(p)) found.push(p)
  }
  const phrasePer100 = (found.length * 2) / Math.max(1, wordCount / 100)
  signals.push({
    name: "AI Phrases",
    description: "Common AI-overused expressions",
    score: clamp(phrasePer100 * 20),
    weight: 0.2,
    detail:
      found.length > 0
        ? `Found ${found.length}: "${found.slice(0, 3).join('", "')}"${found.length > 3 ? "..." : ""}`
        : "None detected",
  })

  // 2. AI Vocabulary
  let vocabHits = 0
  const foundV: string[] = []
  for (const w of AI_VOCABULARY) {
    const m = lower.match(new RegExp(`\\b${w}\\b`, "gi"))
    if (m) {
      vocabHits += m.length
      if (foundV.length < 5) foundV.push(w)
    }
  }
  signals.push({
    name: "AI Vocabulary",
    description: "Words disproportionately used by AI",
    score: clamp((vocabHits / Math.max(1, wordCount / 100)) * 18),
    weight: 0.15,
    detail: vocabHits > 0 ? `${vocabHits} hits: ${foundV.join(", ")}` : "None detected",
  })

  // 3. Sentence Uniformity
  const sentLengths = sentences.map((s) => s.trim().split(/\s+/).length)
  const sentCV = computeCV(sentLengths)
  signals.push({
    name: "Sentence Uniformity",
    description: "AI writes sentences of similar length",
    score: clamp(
      sentCV < 0.2 ? 90 : sentCV < 0.3 ? 70 : sentCV < 0.4 ? 45 : sentCV < 0.55 ? 25 : 10
    ),
    weight: 0.15,
    detail: `CV: ${(sentCV * 100).toFixed(0)}% — ${sentCV < 0.25 ? "very uniform" : sentCV < 0.4 ? "moderate" : "varied"}`,
  })

  // 4. Burstiness
  let burstyScore = 50
  if (sentences.length >= 6) {
    const windowAvgs: number[] = []
    for (let i = 0; i <= sentLengths.length - 3; i++) {
      const win = sentLengths.slice(i, i + 3)
      windowAvgs.push(win.reduce((a, b) => a + b, 0) / 3)
    }
    const bCV = computeCV(windowAvgs)
    burstyScore = clamp(
      bCV < 0.15 ? 85 : bCV < 0.25 ? 60 : bCV < 0.35 ? 35 : bCV < 0.5 ? 15 : 5
    )
  }
  signals.push({
    name: "Burstiness",
    description: "Humans write in varied bursts; AI is monotone",
    score: burstyScore,
    weight: 0.15,
    detail: sentences.length >= 6 ? `Analyzed ${sentences.length} sentences` : "Too few sentences",
  })

  // 5. Contraction Usage
  let contractionCount = 0
  for (const c of CONTRACTIONS) {
    contractionCount += countRegex(
      lower,
      new RegExp(`\\b${c.replace("'", "[''']")}\\b`, "gi")
    )
  }
  const cps = contractionCount / Math.max(1, sentences.length)
  signals.push({
    name: "Contractions",
    description: "Humans use contractions naturally; AI avoids them",
    score: clamp(
      cps < 0.05 ? 78 : cps < 0.15 ? 55 : cps < 0.3 ? 35 : cps < 0.5 ? 15 : 5
    ),
    weight: 0.1,
    detail: `${contractionCount} contractions (${cps.toFixed(2)}/sentence)`,
  })

  // 6. Personal Voice
  const firstPerson = countRegex(lower, /\b(i|me|my|mine|myself)\b/g)
  const informal = countRegex(
    lower,
    /\b(yeah|nope|okay|lol|haha|wow|cool|gonna|wanna|gotta|kinda|tbh|imo|btw|ngl|idk|honestly|literally|basically|stuff)\b/g
  )
  const fp100 = (firstPerson + informal) / Math.max(1, wordCount / 100)
  signals.push({
    name: "Personal Voice",
    description: "First-person, slang, informal language",
    score: clamp(
      fp100 < 0.3 ? 75 : fp100 < 1 ? 50 : fp100 < 2.5 ? 30 : fp100 < 5 ? 12 : 5
    ),
    weight: 0.1,
    detail: `${firstPerson} first-person + ${informal} informal (${fp100.toFixed(1)}/100 words)`,
  })

  // 7. Punctuation Diversity
  const punctTypes = [/\./g, /,/g, /!/g, /\?/g, /;/g, /:/g, /[—–]/g, /\.{3}|…/g, /[()]/g]
  const usedTypes = punctTypes.filter((p) => countRegex(text, p) > 0).length
  const diversity = usedTypes / punctTypes.length
  signals.push({
    name: "Punctuation Diversity",
    description: "Humans use diverse punctuation",
    score: clamp(
      diversity < 0.25 ? 72 : diversity < 0.35 ? 50 : diversity < 0.5 ? 30 : diversity < 0.65 ? 15 : 5
    ),
    weight: 0.15,
    detail: `${usedTypes}/${punctTypes.length} punctuation types used`,
  })

  // Weighted heuristic score
  const totalW = signals.reduce((a, s) => a + s.weight, 0)
  const hScore = Math.round(signals.reduce((sum, s) => sum + s.score * s.weight, 0) / totalW)

  // Per-sentence scoring
  const sentenceScores = sentences.slice(0, 25).map((sent) => {
    const sL = sent.toLowerCase()
    let sc = 0
    for (const p of AI_PHRASES) {
      if (sL.includes(p)) {
        sc += 25
        break
      }
    }
    for (const v of AI_VOCABULARY) {
      if (new RegExp(`\\b${v}\\b`, "i").test(sL)) {
        sc += 12
        if (sc > 60) break
      }
    }
    if (!CONTRACTIONS.some((c) => new RegExp(`\\b${c.replace("'", "['']")}\\b`, "i").test(sL)))
      sc += 8
    if (!/\b(i|me|my|we|our)\b/i.test(sL)) sc += 6
    return { text: sent.trim(), score: clamp(sc) }
  })

  return { score: hScore, signals, sentenceScores }
}

// ═══════════════════════════════════════════════════════════════
// VERDICT LOGIC
// ═══════════════════════════════════════════════════════════════

function getVerdict(score: number): {
  verdict: AnalysisResult["verdict"]
  summary: string
} {
  if (score >= 65)
    return {
      verdict: "likely-ai",
      summary:
        "This text shows strong indicators of AI generation based on both ML classification and linguistic patterns.",
    }
  if (score >= 40)
    return {
      verdict: "mixed",
      summary:
        "This text has mixed signals. It may be AI-assisted, AI-generated then edited, or stylistically formal human writing.",
    }
  return {
    verdict: "likely-human",
    summary:
      "This text appears primarily human-written based on ML analysis and linguistic patterns.",
  }
}

// ═══════════════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════════════

function getScoreColor(score: number) {
  if (score >= 65) return "text-red-400"
  if (score >= 40) return "text-yellow-400"
  return "text-green-400"
}

function getScoreBarColor(score: number) {
  if (score >= 65) return "bg-red-500"
  if (score >= 40) return "bg-yellow-500"
  return "bg-green-500"
}

function getVerdictIcon(verdict: AnalysisResult["verdict"]) {
  switch (verdict) {
    case "likely-ai":
      return <Sparkles className="h-6 w-6 text-red-400" />
    case "mixed":
      return <AlertTriangle className="h-6 w-6 text-yellow-400" />
    case "likely-human":
      return <CheckCircle2 className="h-6 w-6 text-green-400" />
  }
}

function getVerdictLabel(verdict: AnalysisResult["verdict"]) {
  switch (verdict) {
    case "likely-ai":
      return "Likely AI-Generated"
    case "mixed":
      return "Mixed / AI-Assisted"
    case "likely-human":
      return "Likely Human-Written"
  }
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function AIDetectorPage() {
  const [text, setText] = useState("")
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [showSentences, setShowSentences] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "patterns" | "sentences">("overview")

  const handleAnalyze = useCallback(async () => {
    const trimmed = text.trim()
    if (trimmed.split(/\s+/).length < 30) return

    setAnalyzing(true)
    setShowSentences(false)
    setActiveTab("overview")

    // Run heuristics immediately
    const heuristic = runHeuristics(trimmed)

    const wordCount = trimmed.split(/\s+/).length
    const confidence: AnalysisResult["confidence"] =
      wordCount >= 200 ? "high" : wordCount >= 80 ? "medium" : "low"

    // Start with heuristic-only result (shown while ML loads)
    const initial: AnalysisResult = {
      overallScore: heuristic.score,
      confidence,
      mlScore: null,
      mlStatus: "loading",
      heuristicScore: heuristic.score,
      signals: heuristic.signals,
      sentenceScores: heuristic.sentenceScores,
      ...getVerdict(heuristic.score),
    }
    setResult(initial)

    // Then call ML model
    try {
      const mlScore = await queryHuggingFace(trimmed)
      const mlRound = Math.round(mlScore)

      // Combine: ML 70%, Heuristic 30%
      const combined = Math.round(mlRound * 0.7 + heuristic.score * 0.3)
      const { verdict, summary } = getVerdict(combined)

      setResult({
        overallScore: combined,
        confidence: wordCount >= 200 ? "high" : wordCount >= 80 ? "medium" : "low",
        mlScore: mlRound,
        mlStatus: "success",
        heuristicScore: heuristic.score,
        signals: heuristic.signals,
        sentenceScores: heuristic.sentenceScores,
        verdict,
        summary,
      })
    } catch (err) {
      setResult((prev) =>
        prev
          ? {
              ...prev,
              mlScore: null,
              mlStatus: "error",
              mlError: err instanceof Error ? err.message : "ML model unavailable",
            }
          : null
      )
    } finally {
      setAnalyzing(false)
    }
  }, [text])

  const reset = () => {
    setText("")
    setResult(null)
    setShowSentences(false)
    setActiveTab("overview")
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
        <ScanSearch className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">AI Content Detector</h1>
      </div>
      <p className="text-muted-foreground text-sm">
        Uses a <strong>RoBERTa ML model</strong> (via HuggingFace) combined with
        linguistic pattern analysis to detect AI-generated text.
      </p>

      {/* Input */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <Textarea
            placeholder="Paste the text you want to analyze (minimum 30 words, 200+ recommended)..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[200px] resize-y font-mono text-sm"
          />
          <div className="flex items-center justify-between">
            <span
              className={`text-xs ${wordCount < 30 ? "text-muted-foreground" : wordCount < 200 ? "text-yellow-500" : "text-green-500"}`}
            >
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
              <Button
                onClick={handleAnalyze}
                disabled={wordCount < 30 || analyzing}
                size="sm"
                className="gap-1.5"
              >
                {analyzing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Brain className="h-3.5 w-3.5" />
                )}
                {analyzing ? "Analyzing..." : "Analyze"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          {/* Verdict card */}
          <Card
            className={`border-2 ${
              result.verdict === "likely-ai"
                ? "border-red-500/30 bg-red-500/5"
                : result.verdict === "mixed"
                  ? "border-yellow-500/30 bg-yellow-500/5"
                  : "border-green-500/30 bg-green-500/5"
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                {getVerdictIcon(result.verdict)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold">{getVerdictLabel(result.verdict)}</h2>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                        result.confidence === "high"
                          ? "border-green-500/50 text-green-400"
                          : result.confidence === "medium"
                            ? "border-yellow-500/50 text-yellow-400"
                            : "border-muted-foreground/50 text-muted-foreground"
                      }`}
                    >
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      {result.confidence} confidence
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{result.summary}</p>
                </div>
                <div className="text-right">
                  <div
                    className={`text-3xl font-bold font-mono ${getScoreColor(result.overallScore)}`}
                  >
                    {result.overallScore}%
                  </div>
                  <p className="text-[10px] text-muted-foreground">AI Probability</p>
                </div>
              </div>

              {/* Overall bar */}
              <div className="mt-4 h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${getScoreBarColor(result.overallScore)}`}
                  style={{ width: `${result.overallScore}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>Human</span>
                <span>AI</span>
              </div>

              {/* Score sources */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                {/* ML Score */}
                <div className="rounded-lg border border-border/50 bg-card/50 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Cpu className="h-3 w-3" />
                    ML Model (RoBERTa)
                    {result.mlStatus === "loading" && (
                      <Loader2 className="h-3 w-3 animate-spin ml-auto" />
                    )}
                  </div>
                  {result.mlStatus === "success" && result.mlScore !== null ? (
                    <div className="flex items-end gap-1.5">
                      <span
                        className={`text-xl font-bold font-mono ${getScoreColor(result.mlScore)}`}
                      >
                        {result.mlScore}%
                      </span>
                      <span className="text-[10px] text-muted-foreground mb-0.5">
                        weight: 70%
                      </span>
                    </div>
                  ) : result.mlStatus === "loading" ? (
                    <span className="text-xs text-muted-foreground">Running model...</span>
                  ) : result.mlStatus === "error" ? (
                    <span className="text-xs text-red-400">
                      {result.mlError || "Unavailable"} &mdash; using patterns only
                    </span>
                  ) : null}
                </div>

                {/* Heuristic Score */}
                <div className="rounded-lg border border-border/50 bg-card/50 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <FlaskConical className="h-3 w-3" />
                    Pattern Analysis
                  </div>
                  <div className="flex items-end gap-1.5">
                    <span
                      className={`text-xl font-bold font-mono ${getScoreColor(result.heuristicScore)}`}
                    >
                      {result.heuristicScore}%
                    </span>
                    <span className="text-[10px] text-muted-foreground mb-0.5">
                      weight: {result.mlStatus === "success" ? "30%" : "100%"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="flex gap-1 rounded-lg border border-border/50 bg-card/50 p-1">
            {(["overview", "patterns", "sentences"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "overview"
                  ? "Overview"
                  : tab === "patterns"
                    ? "Pattern Breakdown"
                    : "Sentence Analysis"}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {activeTab === "overview" && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold text-sm">How it works</h3>
                <div className="space-y-3 text-xs text-muted-foreground">
                  <div className="flex gap-3 items-start">
                    <div className="shrink-0 h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Cpu className="h-3 w-3 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        ML Model &mdash; RoBERTa (70% weight)
                      </p>
                      <p>
                        A transformer model fine-tuned by OpenAI to classify text as human or
                        AI-generated. Runs via HuggingFace&apos;s free Inference API. Long texts
                        are split into chunks and scores are aggregated.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="shrink-0 h-6 w-6 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <FlaskConical className="h-3 w-3 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        Pattern Analysis &mdash; 7 Signals (30% weight)
                      </p>
                      <p>
                        Checks for AI-overused phrases, vocabulary, sentence uniformity,
                        burstiness, contraction usage, personal voice, and punctuation diversity.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="shrink-0 h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center">
                      <BarChart3 className="h-3 w-3 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Combined Score</p>
                      <p>
                        The final score blends both approaches. If the ML model is unavailable,
                        pattern analysis is used at 100% weight.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Patterns tab */}
          {activeTab === "patterns" && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Pattern Breakdown</h3>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {result.signals.length} signals
                  </span>
                </div>

                {result.signals.map((signal, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium">{signal.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {signal.description}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-mono font-bold ${getScoreColor(signal.score)}`}
                      >
                        {signal.score}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${getScoreBarColor(signal.score)}`}
                        style={{ width: `${signal.score}%`, transitionDelay: `${i * 80}ms` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{signal.detail}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Sentences tab */}
          {activeTab === "sentences" && result.sentenceScores.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-2">
                <h3 className="font-semibold text-sm mb-3">Sentence-Level Analysis</h3>
                <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                  {result.sentenceScores.map((s, i) => (
                    <div
                      key={i}
                      className={`text-xs p-2 rounded border-l-2 ${
                        s.score >= 50
                          ? "border-l-red-500 bg-red-500/5"
                          : s.score >= 25
                            ? "border-l-yellow-500 bg-yellow-500/5"
                            : "border-l-green-500 bg-green-500/5"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={`font-mono font-bold shrink-0 ${getScoreColor(s.score)}`}
                        >
                          {s.score}%
                        </span>
                        <span className="text-muted-foreground">{s.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground text-center pt-1">
                  🔴 High AI probability &nbsp; 🟡 Mixed &nbsp; 🟢 Likely human
                </p>
              </CardContent>
            </Card>
          )}

          {/* Disclaimer */}
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
            <p className="text-xs text-muted-foreground">
              ⚠️ No AI detector is 100% accurate. This tool combines ML classification with
              pattern analysis for best results. The RoBERTa model was trained on GPT-2 outputs
              and may be less accurate on newer models. Always use human judgment.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
