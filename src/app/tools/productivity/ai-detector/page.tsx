"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScanSearch, AlertTriangle, CheckCircle2, RotateCcw, Sparkles, Brain, BarChart3 } from "lucide-react"

// ── Common AI phrases / filler ──
const AI_PHRASES = [
  "it's important to note", "it is important to note",
  "it's worth noting", "it is worth noting",
  "in today's world", "in today's digital age",
  "in the realm of", "in the world of",
  "it's crucial to", "it is crucial to",
  "delve into", "delve deeper",
  "dive into", "dive deeper",
  "leverage the power", "harness the power",
  "plays a crucial role", "plays a vital role",
  "at the end of the day",
  "on the other hand",
  "in conclusion",
  "in summary",
  "furthermore", "moreover", "additionally",
  "consequently", "subsequently",
  "nevertheless", "nonetheless",
  "it's essential to", "it is essential to",
  "this comprehensive guide",
  "without further ado",
  "let's explore", "let us explore",
  "when it comes to",
  "in order to",
  "a wide range of",
  "whether you're a",
  "the landscape of",
  "navigating the",
  "tapestry of",
  "multifaceted",
  "revolutionize",
  "game-changer",
  "cutting-edge",
  "state-of-the-art",
  "seamlessly",
  "robust",
  "foster",
  "empower",
  "elevate",
  "streamline",
  "utilize",
  "facilitate",
  "encompass",
  "underscore",
  "meticulous",
  "meticulously",
  "intricate",
  "holistic",
  "pivotal",
  "paradigm",
  "synergy",
  "myriad",
]

const TRANSITION_WORDS = [
  "however", "therefore", "furthermore", "moreover", "additionally",
  "consequently", "nevertheless", "nonetheless", "meanwhile",
  "subsequently", "accordingly", "hence", "thus",
  "in addition", "as a result", "for instance", "for example",
  "on the contrary", "in contrast", "similarly", "likewise",
]

interface AnalysisResult {
  overallScore: number // 0-100 (100 = very likely AI)
  signals: Signal[]
  summary: string
  verdict: "likely-human" | "mixed" | "likely-ai"
}

interface Signal {
  name: string
  description: string
  score: number // 0-100
  weight: number
  detail: string
}

function analyze(text: string): AnalysisResult {
  const lower = text.toLowerCase()
  const words = text.split(/\s+/).filter(Boolean)
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0)

  if (words.length < 30) {
    return {
      overallScore: 0,
      signals: [],
      summary: "Need at least 30 words for meaningful analysis.",
      verdict: "mixed",
    }
  }

  const signals: Signal[] = []

  // ── 1. AI Phrase Detection ──
  const foundPhrases: string[] = []
  for (const phrase of AI_PHRASES) {
    if (lower.includes(phrase)) foundPhrases.push(phrase)
  }
  const phraseScore = Math.min(100, (foundPhrases.length / Math.max(1, words.length / 100)) * 25)
  signals.push({
    name: "AI Phrases",
    description: "Common phrases frequently used by AI models",
    score: phraseScore,
    weight: 0.25,
    detail: foundPhrases.length > 0
      ? `Found ${foundPhrases.length}: "${foundPhrases.slice(0, 5).join('", "')}${foundPhrases.length > 5 ? "..." : ""}"`
      : "No common AI phrases detected",
  })

  // ── 2. Sentence Length Uniformity ──
  const sentLengths = sentences.map((s) => s.trim().split(/\s+/).length)
  const avgLen = sentLengths.reduce((a, b) => a + b, 0) / sentLengths.length
  const variance = sentLengths.reduce((sum, l) => sum + (l - avgLen) ** 2, 0) / sentLengths.length
  const stdDev = Math.sqrt(variance)
  const coeffOfVar = avgLen > 0 ? stdDev / avgLen : 0
  // AI tends to have more uniform sentence lengths (lower variance)
  const uniformityScore = coeffOfVar < 0.25 ? 85 : coeffOfVar < 0.35 ? 60 : coeffOfVar < 0.5 ? 35 : 15
  signals.push({
    name: "Sentence Uniformity",
    description: "AI tends to produce sentences of similar length",
    score: uniformityScore,
    weight: 0.15,
    detail: `Avg ${avgLen.toFixed(1)} words/sentence, CV: ${(coeffOfVar * 100).toFixed(0)}% (${coeffOfVar < 0.3 ? "very uniform" : coeffOfVar < 0.45 ? "moderate" : "varied"})`,
  })

  // ── 3. Vocabulary Diversity (Type-Token Ratio) ──
  const sampleWords = words.slice(0, 500).map((w) => w.toLowerCase().replace(/[^a-z']/g, "")).filter(Boolean)
  const uniqueWords = new Set(sampleWords)
  const ttr = uniqueWords.size / Math.max(1, sampleWords.length)
  // AI often has moderate TTR (0.4-0.6), humans can be more extreme
  const ttrScore = ttr >= 0.4 && ttr <= 0.6 ? 65 : ttr < 0.4 ? 50 : 25
  signals.push({
    name: "Vocabulary Diversity",
    description: "Type-token ratio measures word variety",
    score: ttrScore,
    weight: 0.1,
    detail: `TTR: ${(ttr * 100).toFixed(1)}% (${uniqueWords.size} unique / ${sampleWords.length} total words)`,
  })

  // ── 4. Transition Word Density ──
  let transCount = 0
  for (const tw of TRANSITION_WORDS) {
    const regex = new RegExp(`\\b${tw}\\b`, "gi")
    const matches = lower.match(regex)
    if (matches) transCount += matches.length
  }
  const transDensity = transCount / Math.max(1, sentences.length)
  const transScore = transDensity > 0.4 ? 80 : transDensity > 0.25 ? 55 : transDensity > 0.1 ? 30 : 15
  signals.push({
    name: "Transition Density",
    description: "AI overuses transition words between sentences",
    score: transScore,
    weight: 0.15,
    detail: `${transCount} transition words across ${sentences.length} sentences (${(transDensity * 100).toFixed(0)}% density)`,
  })

  // ── 5. Paragraph Structure ──
  const paraLengths = paragraphs.map((p) => p.trim().split(/\s+/).length)
  const avgParaLen = paraLengths.reduce((a, b) => a + b, 0) / Math.max(1, paraLengths.length)
  const paraVariance = paraLengths.reduce((sum, l) => sum + (l - avgParaLen) ** 2, 0) / Math.max(1, paraLengths.length)
  const paraCV = avgParaLen > 0 ? Math.sqrt(paraVariance) / avgParaLen : 0
  const paraScore = paraCV < 0.2 ? 80 : paraCV < 0.35 ? 55 : paraCV < 0.5 ? 30 : 15
  signals.push({
    name: "Paragraph Structure",
    description: "AI produces evenly-sized paragraphs",
    score: paragraphs.length > 1 ? paraScore : 40,
    weight: 0.1,
    detail: paragraphs.length > 1
      ? `${paragraphs.length} paragraphs, avg ${avgParaLen.toFixed(0)} words each (CV: ${(paraCV * 100).toFixed(0)}%)`
      : "Single paragraph — not enough structure to analyze",
  })

  // ── 6. Repetitive Sentence Starters ──
  const starters = sentences.map((s) => {
    const w = s.trim().split(/\s+/)
    return w.slice(0, 2).join(" ").toLowerCase().replace(/[^a-z ]/g, "")
  })
  const starterCounts: Record<string, number> = {}
  starters.forEach((s) => { starterCounts[s] = (starterCounts[s] || 0) + 1 })
  const repeatedStarters = Object.values(starterCounts).filter((c) => c > 1).reduce((a, b) => a + b, 0)
  const starterRatio = repeatedStarters / Math.max(1, sentences.length)
  const starterScore = starterRatio > 0.5 ? 80 : starterRatio > 0.3 ? 55 : starterRatio > 0.15 ? 30 : 10
  signals.push({
    name: "Sentence Starters",
    description: "AI often starts sentences with similar patterns",
    score: starterScore,
    weight: 0.1,
    detail: `${(starterRatio * 100).toFixed(0)}% of sentences start with repeated phrases`,
  })

  // ── 7. Passive Voice ──
  const passivePatterns = /\b(is|are|was|were|been|being|be)\s+([\w]+ed|[\w]+en)\b/gi
  const passiveMatches = text.match(passivePatterns) || []
  const passiveRatio = passiveMatches.length / Math.max(1, sentences.length)
  const passiveScore = passiveRatio > 0.3 ? 70 : passiveRatio > 0.15 ? 45 : 20
  signals.push({
    name: "Passive Voice",
    description: "AI tends to use more passive constructions",
    score: passiveScore,
    weight: 0.05,
    detail: `${passiveMatches.length} passive constructions in ${sentences.length} sentences`,
  })

  // ── 8. List / Bullet Pattern ──
  const listLines = text.split("\n").filter((l) => /^\s*[-•*]\s|^\s*\d+[.)]\s/.test(l))
  const listRatio = listLines.length / Math.max(1, text.split("\n").filter(Boolean).length)
  const listScore = listRatio > 0.4 ? 70 : listRatio > 0.2 ? 45 : 15
  signals.push({
    name: "List Patterns",
    description: "AI frequently organizes content in lists",
    score: listScore,
    weight: 0.1,
    detail: `${listLines.length} list items detected (${(listRatio * 100).toFixed(0)}% of lines)`,
  })

  // ── Calculate weighted score ──
  const totalWeight = signals.reduce((a, s) => a + s.weight, 0)
  const overallScore = Math.round(
    signals.reduce((sum, s) => sum + s.score * s.weight, 0) / totalWeight
  )

  let verdict: AnalysisResult["verdict"]
  let summary: string
  if (overallScore >= 65) {
    verdict = "likely-ai"
    summary = "This text shows strong patterns consistent with AI-generated content."
  } else if (overallScore >= 40) {
    verdict = "mixed"
    summary = "This text has some AI-like patterns but also human characteristics. It may be AI-assisted or edited."
  } else {
    verdict = "likely-human"
    summary = "This text appears to be primarily human-written based on its patterns."
  }

  return { overallScore, signals, summary, verdict }
}

function getScoreColor(score: number): string {
  if (score >= 65) return "text-red-400"
  if (score >= 40) return "text-yellow-400"
  return "text-green-400"
}

function getScoreBarColor(score: number): string {
  if (score >= 65) return "bg-red-500"
  if (score >= 40) return "bg-yellow-500"
  return "bg-green-500"
}

function getVerdictIcon(verdict: AnalysisResult["verdict"]) {
  switch (verdict) {
    case "likely-ai": return <Sparkles className="h-6 w-6 text-red-400" />
    case "mixed": return <AlertTriangle className="h-6 w-6 text-yellow-400" />
    case "likely-human": return <CheckCircle2 className="h-6 w-6 text-green-400" />
  }
}

function getVerdictLabel(verdict: AnalysisResult["verdict"]) {
  switch (verdict) {
    case "likely-ai": return "Likely AI-Generated"
    case "mixed": return "Mixed / AI-Assisted"
    case "likely-human": return "Likely Human-Written"
  }
}

export default function AIDetectorPage() {
  const [text, setText] = useState("")
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  const handleAnalyze = () => {
    if (text.trim().length < 30) return
    setAnalyzing(true)
    // Tiny delay for UX feel
    setTimeout(() => {
      setResult(analyze(text))
      setAnalyzing(false)
    }, 600)
  }

  const reset = () => {
    setText("")
    setResult(null)
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
        <ScanSearch className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">AI Content Detector</h1>
      </div>
      <p className="text-muted-foreground">Analyze text to detect patterns commonly associated with AI-generated content.</p>

      {/* Input */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <Textarea
            placeholder="Paste the text you want to analyze (minimum 30 words)..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[200px] resize-y font-mono text-sm"
          />
          <div className="flex items-center justify-between">
            <span className={`text-xs ${wordCount < 30 ? "text-muted-foreground" : "text-foreground"}`}>
              {wordCount} words {wordCount < 30 && wordCount > 0 ? `(need ${30 - wordCount} more)` : ""}
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
                <Brain className="h-3.5 w-3.5" />
                {analyzing ? "Analyzing..." : "Analyze"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && result.signals.length > 0 && (
        <>
          {/* Verdict card */}
          <Card className={`border-2 ${
            result.verdict === "likely-ai" ? "border-red-500/30 bg-red-500/5" :
            result.verdict === "mixed" ? "border-yellow-500/30 bg-yellow-500/5" :
            "border-green-500/30 bg-green-500/5"
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                {getVerdictIcon(result.verdict)}
                <div className="flex-1">
                  <h2 className="text-lg font-bold">{getVerdictLabel(result.verdict)}</h2>
                  <p className="text-sm text-muted-foreground">{result.summary}</p>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold font-mono ${getScoreColor(result.overallScore)}`}>
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
            </CardContent>
          </Card>

          {/* Signal breakdown */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Signal Breakdown</h3>
              </div>

              {result.signals.map((signal, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{signal.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{signal.description}</span>
                    </div>
                    <span className={`text-sm font-mono font-bold ${getScoreColor(signal.score)}`}>
                      {signal.score}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${getScoreBarColor(signal.score)}`}
                      style={{ width: `${signal.score}%`, transitionDelay: `${i * 100}ms` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{signal.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
            <p className="text-xs text-muted-foreground">
              ⚠️ This tool uses heuristic pattern analysis, not machine learning. Results are approximate and should not be used as definitive proof.
              Accuracy improves with longer texts (200+ words).
            </p>
          </div>
        </>
      )}
    </div>
  )
}
