"use client"

import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  ScanSearch, RotateCcw, Brain, BarChart3, Loader2, Cpu,
  FlaskConical, ChevronDown, ChevronUp,
} from "lucide-react"

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface SentenceResult {
  text: string
  hScore: number
  mlScore: number   // -1 if unavailable
  combined: number
  isAI: boolean
}

interface AnalysisResult {
  overallScore: number
  mlScore: number | null
  mlStatus: "success" | "loading" | "error"
  mlError?: string
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
// HEURISTIC ENGINE — tuned aggressively for AI text
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

// Score a single sentence for AI-likelihood (0-100)
function scoreSentence(sent: string): number {
  const lower = sent.toLowerCase()
  const words = sent.split(/\s+/).filter(Boolean)
  const wc = words.length
  let score = 0

  // 1. AI phrases in this sentence
  let phraseHits = 0
  for (const p of AI_PHRASES) {
    if (lower.includes(p)) phraseHits++
  }
  score += Math.min(40, phraseHits * 18)

  // 2. AI vocabulary words
  let vocabHits = 0
  for (const v of AI_VOCABULARY) {
    if (new RegExp(`\\b${v}\\b`, "i").test(lower)) vocabHits++
  }
  score += Math.min(35, vocabHits * 7)

  // 3. No contractions (AI avoids them)
  const hasContraction = CONTRACTIONS.some((c) =>
    new RegExp(`\\b${c.replace("'", "[''']")}\\b`, "i").test(lower)
  )
  if (!hasContraction && wc > 5) score += 10

  // 4. No first-person or informal language
  if (!/\b(i|me|my|we|our|you|your)\b/i.test(lower) && wc > 8) score += 8

  // 5. Starts with transition word
  const firstWord = words[0]?.toLowerCase().replace(/[^a-z]/g, "") || ""
  if (TRANSITIONS.includes(firstWord)) score += 12

  // 6. Sentence length in "sweet spot" (15-30 words = typical AI)
  if (wc >= 15 && wc <= 35) score += 8
  if (wc >= 20 && wc <= 30) score += 5

  // 7. Formal tone indicators
  const formalPatterns = /\b(one of the most|both .+ and|offers? .+ opportunities|plays? a .+ role|capable of|can be .+ as|should be|rather than|aims? to|continues? to)\b/i
  if (formalPatterns.test(sent)) score += 12

  // 8. Comma-heavy (AI loves commas in complex sentences)
  const commaCount = (sent.match(/,/g) || []).length
  if (commaCount >= 3 && wc > 12) score += 8
  if (commaCount >= 4) score += 5

  return clamp(score)
}

// Full-text heuristic analysis
function runHeuristics(text: string): { score: number; signals: Signal[] } {
  const lower = text.toLowerCase()
  const words = text.split(/\s+/).filter(Boolean)
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 3)
  const wordCount = words.length
  const signals: Signal[] = []

  // 1. AI Phrases
  let phraseHits = 0
  const foundP: string[] = []
  for (const p of AI_PHRASES) {
    if (lower.includes(p)) { phraseHits++; if (foundP.length < 4) foundP.push(p) }
  }
  const pScore = clamp(Math.min(100, phraseHits * 12))
  signals.push({ name: "AI Phrases", score: pScore, weight: 0.20,
    detail: foundP.length > 0 ? `${phraseHits} found: "${foundP.slice(0, 3).join('", "')}"...` : "None" })

  // 2. AI Vocabulary
  let vocabHits = 0
  for (const w of AI_VOCABULARY) {
    const m = lower.match(new RegExp(`\\b${w}\\b`, "gi"))
    if (m) vocabHits += m.length
  }
  const vScore = clamp((vocabHits / Math.max(1, wordCount / 100)) * 14)
  signals.push({ name: "AI Vocabulary", score: vScore, weight: 0.15,
    detail: `${vocabHits} AI-favored words per ${wordCount} words` })

  // 3. Sentence Uniformity
  const sentLengths = sentences.map((s) => s.trim().split(/\s+/).length)
  const sentCV = computeCV(sentLengths)
  const uScore = clamp(sentCV < 0.18 ? 95 : sentCV < 0.25 ? 80 : sentCV < 0.35 ? 60 : sentCV < 0.45 ? 35 : 12)
  signals.push({ name: "Sentence Uniformity", score: uScore, weight: 0.15,
    detail: `CV: ${(sentCV * 100).toFixed(0)}% — ${sentCV < 0.25 ? "very uniform (AI)" : sentCV < 0.4 ? "moderate" : "varied (human)"}` })

  // 4. Burstiness
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
  signals.push({ name: "Burstiness", score: bScore, weight: 0.12,
    detail: `${sentences.length} sentences analyzed` })

  // 5. Contractions
  let cc = 0
  for (const c of CONTRACTIONS) {
    cc += countRegex(lower, new RegExp(`\\b${c.replace("'", "[''']")}\\b`, "gi"))
  }
  const cps = cc / Math.max(1, sentences.length)
  const cScore = clamp(cps < 0.03 ? 90 : cps < 0.1 ? 70 : cps < 0.25 ? 45 : cps < 0.4 ? 20 : 5)
  signals.push({ name: "Contractions", score: cScore, weight: 0.12,
    detail: `${cc} contractions in ${sentences.length} sentences (${cps.toFixed(2)}/sent)` })

  // 6. Transition Density
  let tc = 0
  for (const tw of TRANSITIONS) {
    tc += countRegex(lower, new RegExp(`\\b${tw}\\b`, "gi"))
  }
  const tDensity = tc / Math.max(1, sentences.length)
  const tScore = clamp(tDensity > 0.45 ? 90 : tDensity > 0.3 ? 72 : tDensity > 0.18 ? 50 : tDensity > 0.08 ? 25 : 8)
  signals.push({ name: "Transition Words", score: tScore, weight: 0.12,
    detail: `${tc} transitions (${(tDensity * 100).toFixed(0)}% density)` })

  // 7. Personal Voice
  const firstPerson = countRegex(lower, /\b(i|me|my|mine|myself)\b/g)
  const informal = countRegex(lower, /\b(yeah|nope|okay|lol|haha|wow|cool|gonna|wanna|gotta|kinda|tbh|imo|btw|ngl|idk|honestly|literally|basically|stuff|pretty much)\b/g)
  const fp100 = (firstPerson + informal) / Math.max(1, wordCount / 100)
  const pVoice = clamp(fp100 < 0.2 ? 85 : fp100 < 0.8 ? 60 : fp100 < 2 ? 35 : fp100 < 4 ? 12 : 5)
  signals.push({ name: "Personal Voice", score: pVoice, weight: 0.14,
    detail: `${firstPerson + informal} personal/informal markers` })

  // Weighted overall
  const totalW = signals.reduce((a, s) => a + s.weight, 0)
  const hScore = Math.round(signals.reduce((sum, s) => sum + s.score * s.weight, 0) / totalW)

  return { score: hScore, signals }
}

// ═══════════════════════════════════════════════════════════════
// CIRCULAR GAUGE COMPONENT
// ═══════════════════════════════════════════════════════════════

function CircularGauge({ score, size = 180 }: { score: number; size?: number }) {
  const strokeWidth = 14
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference

  const getColor = (s: number) => {
    if (s >= 80) return "#ef4444"  // red
    if (s >= 60) return "#f97316"  // orange
    if (s >= 40) return "#eab308"  // yellow
    if (s >= 20) return "#84cc16"  // lime
    return "#22c55e"               // green
  }

  const getLabel = (s: number) => {
    if (s >= 85) return "AI Generated"
    if (s >= 65) return "Mostly AI"
    if (s >= 40) return "Mixed"
    if (s >= 20) return "Mostly Human"
    return "Human Written"
  }

  const color = getColor(score)

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor" strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Score arc */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold font-mono" style={{ color }}>
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

  const splitSentences = (t: string): string[] => {
    return t
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 3)
  }

  const handleAnalyze = useCallback(async () => {
    const trimmed = text.trim()
    const wc = trimmed.split(/\s+/).length
    if (wc < 30) return

    setAnalyzing(true)
    setShowSignals(false)

    const sentences = splitSentences(trimmed)

    // Run heuristics
    const heuristic = runHeuristics(trimmed)
    const sentenceHScores = sentences.map((s) => scoreSentence(s))

    // Show heuristic-only result immediately
    const hSentences: SentenceResult[] = sentences.map((s, i) => ({
      text: s,
      hScore: sentenceHScores[i],
      mlScore: -1,
      combined: sentenceHScores[i],
      isAI: sentenceHScores[i] >= 45,
    }))

    const hAICount = hSentences.filter((s) => s.isAI).length
    setResult({
      overallScore: heuristic.score,
      mlScore: null,
      mlStatus: "loading",
      heuristicScore: heuristic.score,
      sentences: hSentences,
      signals: heuristic.signals,
      aiSentenceCount: hAICount,
      totalSentences: sentences.length,
    })

    // Call ML model via API route
    try {
      const res = await fetch("/api/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentences }),
      })

      if (!res.ok) throw new Error(`API error (${res.status})`)

      const data = await res.json() as { mlScore: number; sentenceScores: number[] }

      if (data.mlScore < 0) throw new Error("Model unavailable")

      const mlOverall = Math.round(data.mlScore)

      // Combine ML (65%) + Heuristic (35%)
      const combined = Math.round(mlOverall * 0.65 + heuristic.score * 0.35)

      // Per-sentence combined scores
      const finalSentences: SentenceResult[] = sentences.map((s, i) => {
        const ml = data.sentenceScores[i] ?? -1
        const h = sentenceHScores[i]
        const c = ml >= 0 ? Math.round(ml * 0.6 + h * 0.4) : h
        return { text: s, hScore: h, mlScore: ml, combined: c, isAI: c >= 45 }
      })

      const aiCount = finalSentences.filter((s) => s.isAI).length

      setResult({
        overallScore: combined,
        mlScore: mlOverall,
        mlStatus: "success",
        heuristicScore: heuristic.score,
        sentences: finalSentences,
        signals: heuristic.signals,
        aiSentenceCount: aiCount,
        totalSentences: sentences.length,
      })
    } catch (err) {
      // ML failed — keep heuristic result
      setResult((prev) =>
        prev ? { ...prev, mlStatus: "error", mlError: err instanceof Error ? err.message : "ML unavailable" } : null
      )
    } finally {
      setAnalyzing(false)
    }
  }, [text])

  const reset = () => {
    setText("")
    setResult(null)
    setShowSignals(false)
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
      {/* Header */}
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
            placeholder="Paste the text you want to analyze (minimum 30 words, 200+ recommended for best accuracy)..."
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
          {/* Score + Gauge */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Gauge */}
                <CircularGauge score={result.overallScore} />

                {/* Stats */}
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

                  {/* ML vs Heuristic breakdown */}
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
                        <span className="text-xs text-muted-foreground">Running...</span>
                      ) : (
                        <span className="text-xs text-red-400">
                          {result.mlError || "Failed"} &mdash; patterns only
                        </span>
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sentence Highlighting — Primary output like ZeroGPT */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">
                  Sentence Analysis
                </h3>
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

              {/* Highlighted text block — like ZeroGPT */}
              <div className="rounded-lg border border-border/50 bg-muted/20 p-4 text-sm leading-relaxed space-y-1">
                {result.sentences.map((s, i) => (
                  <span
                    key={i}
                    className={`inline ${
                      s.isAI
                        ? "bg-yellow-500/30 decoration-yellow-500/60"
                        : ""
                    }`}
                    title={`AI: ${s.combined}%`}
                  >
                    {s.text}{" "}
                  </span>
                ))}
              </div>

              {/* Sentence-by-sentence scores */}
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

          {/* Signal Breakdown (collapsible) */}
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

          {/* Disclaimer */}
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
            <p className="text-[10px] text-muted-foreground">
              ⚠️ No AI detector is 100% accurate. Results combine ML classification (RoBERTa) with
              linguistic pattern analysis. Accuracy improves with longer texts. Always use human judgment.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
