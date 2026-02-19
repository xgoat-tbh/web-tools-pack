"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScanSearch, AlertTriangle, CheckCircle2, RotateCcw, Sparkles, Brain, BarChart3, ShieldCheck } from "lucide-react"

// ═══════════════════════════════════════════════════════════════
// DATA — expanded phrase / word lists for higher accuracy
// ═══════════════════════════════════════════════════════════════

// High-confidence AI phrases (weighted 2x)
const AI_PHRASES_STRONG: string[] = [
  "it's important to note", "it is important to note",
  "it's worth noting", "it is worth noting",
  "it's crucial to", "it is crucial to",
  "it's essential to", "it is essential to",
  "in today's digital age", "in today's rapidly evolving",
  "in the realm of", "in the ever-evolving",
  "this comprehensive guide", "this comprehensive overview",
  "let's delve", "let us delve", "delve into", "delve deeper",
  "without further ado",
  "whether you're a beginner or",
  "whether you're a seasoned",
  "plays a crucial role", "plays a vital role", "plays a pivotal role",
  "leverage the power", "harness the power",
  "navigate the complexities",
  "tapestry of", "rich tapestry",
  "the landscape of",
  "a testament to",
  "in this article, we will",
  "in this guide, we will",
  "as we navigate",
  "it cannot be overstated",
  "stands as a testament",
  "the intricacies of",
  "in the grand scheme",
  "sheds light on",
  "paves the way",
  "a myriad of",
]

// Medium-confidence AI phrases (weighted 1x)
const AI_PHRASES_MEDIUM: string[] = [
  "in today's world",
  "in the world of",
  "dive into", "dive deeper",
  "at the end of the day",
  "on the other hand",
  "in conclusion", "in summary",
  "furthermore", "moreover", "additionally",
  "consequently", "subsequently",
  "nevertheless", "nonetheless",
  "when it comes to",
  "in order to",
  "a wide range of",
  "the landscape of",
  "navigating the",
  "first and foremost",
  "last but not least",
  "it goes without saying",
  "needless to say",
  "as a matter of fact",
  "by and large",
  "to that end",
  "with that being said",
  "having said that",
  "that being said",
  "it should be noted",
  "one might argue",
  "it can be argued",
  "from a broader perspective",
  "taking into account",
  "given the fact that",
]

// AI-favored vocabulary (single words that AI overuses)
const AI_VOCABULARY: string[] = [
  "multifaceted", "revolutionize", "game-changer", "cutting-edge",
  "state-of-the-art", "seamlessly", "robust", "foster", "empower",
  "elevate", "streamline", "utilize", "facilitate", "encompass",
  "underscore", "meticulous", "meticulously", "intricate", "holistic",
  "pivotal", "paradigm", "synergy", "myriad", "nuanced", "comprehensive",
  "delve", "navigate", "leverage", "optimize", "paramount", "indispensable",
  "groundbreaking", "innovative", "transformative", "unprecedented",
  "cornerstone", "blueprint", "framework", "ecosystem", "landscape",
  "trajectory", "catalyst", "benchmark", "scalable", "sustainable",
  "actionable", "implementable", "noteworthy", "commendable",
  "invaluable", "insightful", "illuminating", "compelling",
  "vibrant", "bustling", "erasure", "realm", "tapestry",
  "underpinning", "overarching", "wholesome", "foundational",
  "spearhead", "bolster", "augment", "cultivate", "galvanize",
  "proliferate", "juxtapose", "delineate", "epitomize", "exemplify",
  "underscore", "unravel", "demystify",
]

const TRANSITION_WORDS: string[] = [
  "however", "therefore", "furthermore", "moreover", "additionally",
  "consequently", "nevertheless", "nonetheless", "meanwhile",
  "subsequently", "accordingly", "hence", "thus",
  "in addition", "as a result", "for instance", "for example",
  "on the contrary", "in contrast", "similarly", "likewise",
  "notably", "significantly", "importantly", "conversely",
  "alternatively", "specifically", "essentially", "fundamentally",
  "ultimately", "undoubtedly", "arguably", "evidently",
]

// Common contractions humans use
const CONTRACTIONS = [
  "i'm", "i've", "i'll", "i'd",
  "you're", "you've", "you'll", "you'd",
  "he's", "she's", "it's", "we're", "they're",
  "we've", "they've", "we'll", "they'll",
  "we'd", "they'd", "he'd", "she'd",
  "isn't", "aren't", "wasn't", "weren't",
  "don't", "doesn't", "didn't", "won't",
  "wouldn't", "couldn't", "shouldn't", "can't",
  "hasn't", "haven't", "hadn't",
  "that's", "there's", "here's", "what's",
  "who's", "let's", "ain't", "gonna", "wanna", "gotta",
]

// ═══════════════════════════════════════════════════════════════
// ANALYSIS ENGINE (13 signals)
// ═══════════════════════════════════════════════════════════════

interface AnalysisResult {
  overallScore: number
  confidence: "low" | "medium" | "high"
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

function clamp(v: number, min = 0, max = 100) { return Math.max(min, Math.min(max, v)) }

function computeCV(values: number[]): number {
  if (values.length < 2) return 0
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length
  return avg > 0 ? Math.sqrt(variance) / avg : 0
}

function countRegex(text: string, pattern: RegExp): number {
  return (text.match(pattern) || []).length
}

function analyze(text: string): AnalysisResult {
  const lower = text.toLowerCase()
  const words = text.split(/\s+/).filter(Boolean)
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 3)
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
  const wordCount = words.length

  if (wordCount < 30) {
    return {
      overallScore: 0, confidence: "low", signals: [], sentenceScores: [],
      summary: "Need at least 30 words for meaningful analysis.", verdict: "mixed",
    }
  }

  // Confidence based on text length
  const confidence: AnalysisResult["confidence"] =
    wordCount >= 200 ? "high" : wordCount >= 80 ? "medium" : "low"

  const signals: Signal[] = []

  // ── 1. AI Phrase Detection (strong + medium, weighted differently) ──
  const foundStrong: string[] = []
  const foundMedium: string[] = []
  for (const p of AI_PHRASES_STRONG) { if (lower.includes(p)) foundStrong.push(p) }
  for (const p of AI_PHRASES_MEDIUM) { if (lower.includes(p)) foundMedium.push(p) }
  const phraseHits = foundStrong.length * 2 + foundMedium.length
  const phrasePer100 = phraseHits / Math.max(1, wordCount / 100)
  const phraseScore = clamp(phrasePer100 * 20)
  const allFound = [...foundStrong, ...foundMedium]
  signals.push({
    name: "AI Phrases",
    description: "Phrases and expressions AI models overuse",
    score: phraseScore,
    weight: 0.18,
    detail: allFound.length > 0
      ? `Found ${allFound.length} (${foundStrong.length} strong): "${allFound.slice(0, 4).join('", "')}${allFound.length > 4 ? '"...' : '"'}`
      : "No common AI phrases detected",
  })

  // ── 2. AI Vocabulary Density ──
  let vocabHits = 0
  const foundVocab: string[] = []
  for (const w of AI_VOCABULARY) {
    const re = new RegExp(`\\b${w}\\b`, "gi")
    const m = lower.match(re)
    if (m) { vocabHits += m.length; if (foundVocab.length < 6) foundVocab.push(w) }
  }
  const vocabPer100 = vocabHits / Math.max(1, wordCount / 100)
  const vocabScore = clamp(vocabPer100 * 18)
  signals.push({
    name: "AI Vocabulary",
    description: "Words disproportionately favored by AI",
    score: vocabScore,
    weight: 0.12,
    detail: vocabHits > 0
      ? `${vocabHits} AI-favored words: ${foundVocab.join(", ")}${vocabHits > 6 ? "..." : ""}`
      : "No AI-favored vocabulary detected",
  })

  // ── 3. Sentence Length Uniformity ──
  const sentLengths = sentences.map((s) => s.trim().split(/\s+/).length)
  const sentCV = computeCV(sentLengths)
  const uniformityScore = clamp(sentCV < 0.2 ? 90 : sentCV < 0.3 ? 75 : sentCV < 0.4 ? 50 : sentCV < 0.55 ? 30 : 12)
  signals.push({
    name: "Sentence Uniformity",
    description: "AI produces sentences of very similar length",
    score: uniformityScore,
    weight: 0.10,
    detail: `CV: ${(sentCV * 100).toFixed(0)}% — ${sentCV < 0.25 ? "very uniform (AI-like)" : sentCV < 0.4 ? "moderately uniform" : "varied (human-like)"}`,
  })

  // ── 4. Burstiness ──
  // Measure how much sentence complexity varies across sliding windows
  // AI maintains consistent quality; humans have "bursts" and "lulls"
  let burstyScore = 50
  if (sentences.length >= 6) {
    const windowSize = 3
    const windowAvgs: number[] = []
    for (let i = 0; i <= sentLengths.length - windowSize; i++) {
      const win = sentLengths.slice(i, i + windowSize)
      windowAvgs.push(win.reduce((a, b) => a + b, 0) / windowSize)
    }
    const burstyCV = computeCV(windowAvgs)
    burstyScore = clamp(burstyCV < 0.15 ? 88 : burstyCV < 0.25 ? 65 : burstyCV < 0.35 ? 40 : burstyCV < 0.5 ? 20 : 8)
  }
  signals.push({
    name: "Burstiness",
    description: "Human writing has bursts of complexity; AI is monotone",
    score: burstyScore,
    weight: 0.10,
    detail: sentences.length >= 6
      ? `Sliding-window analysis across ${sentences.length} sentences`
      : "Too few sentences for burstiness analysis",
  })

  // ── 5. Contraction Usage ──
  let contractionCount = 0
  for (const c of CONTRACTIONS) {
    const re = new RegExp(`\\b${c.replace("'", "[''']")}\\b`, "gi")
    contractionCount += countRegex(lower, re)
  }
  const contractionsPerSent = contractionCount / Math.max(1, sentences.length)
  // Humans use ~0.5-2 contractions per sentence; AI often uses 0-0.2
  const contractionScore = clamp(
    contractionsPerSent < 0.05 ? 80 :
    contractionsPerSent < 0.15 ? 60 :
    contractionsPerSent < 0.3 ? 40 :
    contractionsPerSent < 0.5 ? 20 : 8
  )
  signals.push({
    name: "Contraction Usage",
    description: "Humans use contractions naturally; AI avoids them",
    score: contractionScore,
    weight: 0.08,
    detail: `${contractionCount} contractions in ${sentences.length} sentences (${contractionsPerSent.toFixed(2)}/sent)`,
  })

  // ── 6. Punctuation Diversity ──
  const punctTypes = {
    periods: countRegex(text, /\./g),
    commas: countRegex(text, /,/g),
    exclamations: countRegex(text, /!/g),
    questions: countRegex(text, /\?/g),
    semicolons: countRegex(text, /;/g),
    colons: countRegex(text, /:/g),
    dashes: countRegex(text, /[—–-]{2,}|—|–/g),
    ellipses: countRegex(text, /\.{3}|…/g),
    parens: countRegex(text, /[()]/g),
  }
  const punctCounts = Object.values(punctTypes)
  const totalPunct = punctCounts.reduce((a, b) => a + b, 0)
  const usedTypes = punctCounts.filter((c) => c > 0).length
  const punctDiversity = usedTypes / punctCounts.length
  // AI typically uses only periods and commas (2-3 types); humans use 5+
  const punctScore = clamp(
    punctDiversity < 0.25 ? 75 :
    punctDiversity < 0.35 ? 55 :
    punctDiversity < 0.5 ? 35 :
    punctDiversity < 0.65 ? 18 : 8
  )
  signals.push({
    name: "Punctuation Diversity",
    description: "Humans use diverse punctuation; AI sticks to periods & commas",
    score: punctScore,
    weight: 0.06,
    detail: `${usedTypes}/${punctCounts.length} punct types used (${totalPunct} total marks)`,
  })

  // ── 7. Personal Voice & Formality ──
  const firstPerson = countRegex(lower, /\b(i|me|my|mine|myself|i'm|i've|i'll|i'd)\b/g)
  const informal = countRegex(lower, /\b(yeah|yep|nope|okay|ok|lol|haha|wow|cool|awesome|gonna|wanna|gotta|kinda|sorta|tbh|imo|btw|ngl|idk|honestly|literally|basically|actually|pretty much|stuff|things)\b/g)
  const formalityMarkers = firstPerson + informal
  const formalityPer100 = formalityMarkers / Math.max(1, wordCount / 100)
  const personalScore = clamp(
    formalityPer100 < 0.3 ? 78 :
    formalityPer100 < 1 ? 55 :
    formalityPer100 < 2.5 ? 35 :
    formalityPer100 < 5 ? 15 : 5
  )
  signals.push({
    name: "Personal Voice",
    description: "Humans use first-person, slang, and informal language",
    score: personalScore,
    weight: 0.08,
    detail: `${firstPerson} first-person + ${informal} informal words (${formalityPer100.toFixed(1)} per 100 words)`,
  })

  // ── 8. Transition Density ──
  let transCount = 0
  for (const tw of TRANSITION_WORDS) {
    const re = new RegExp(`\\b${tw}\\b`, "gi")
    transCount += countRegex(lower, re)
  }
  const transDensity = transCount / Math.max(1, sentences.length)
  const transScore = clamp(transDensity > 0.5 ? 85 : transDensity > 0.35 ? 65 : transDensity > 0.2 ? 42 : transDensity > 0.08 ? 22 : 10)
  signals.push({
    name: "Transition Density",
    description: "AI overuses transition words between sentences",
    score: transScore,
    weight: 0.08,
    detail: `${transCount} transitions in ${sentences.length} sentences (${(transDensity * 100).toFixed(0)}% density)`,
  })

  // ── 9. Vocabulary Diversity (Hapax + TTR) ──
  const sampleWords = words.slice(0, 500).map((w) => w.toLowerCase().replace(/[^a-z']/g, "")).filter((w) => w.length > 1)
  const wordFreqs: Record<string, number> = {}
  sampleWords.forEach((w) => { wordFreqs[w] = (wordFreqs[w] || 0) + 1 })
  const uniqueCount = Object.keys(wordFreqs).length
  const hapaxCount = Object.values(wordFreqs).filter((f) => f === 1).length // words used exactly once
  const ttr = uniqueCount / Math.max(1, sampleWords.length)
  const hapaxRatio = hapaxCount / Math.max(1, uniqueCount)
  // AI has moderate TTR and low hapax ratio (reuses "safe" words); humans have higher hapax ratio
  const ttrScore = clamp(
    (ttr >= 0.42 && ttr <= 0.58 && hapaxRatio < 0.55) ? 72 :
    (ttr >= 0.35 && ttr <= 0.65 && hapaxRatio < 0.6) ? 50 :
    hapaxRatio > 0.7 ? 15 :
    hapaxRatio > 0.6 ? 28 : 45
  )
  signals.push({
    name: "Vocabulary Profile",
    description: "Word diversity and uniqueness patterns",
    score: ttrScore,
    weight: 0.06,
    detail: `TTR: ${(ttr * 100).toFixed(1)}%, Hapax: ${hapaxRatio.toFixed(2)} (${hapaxCount} once-used / ${uniqueCount} unique)`,
  })

  // ── 10. Paragraph Structure ──
  const paraLengths = paragraphs.map((p) => p.trim().split(/\s+/).length)
  const paraCV = computeCV(paraLengths)
  const paraScore = paragraphs.length > 1
    ? clamp(paraCV < 0.15 ? 82 : paraCV < 0.25 ? 60 : paraCV < 0.4 ? 35 : paraCV < 0.55 ? 18 : 8)
    : 40
  signals.push({
    name: "Paragraph Structure",
    description: "AI produces evenly-sized paragraphs",
    score: paraScore,
    weight: 0.05,
    detail: paragraphs.length > 1
      ? `${paragraphs.length} paragraphs, CV: ${(paraCV * 100).toFixed(0)}%`
      : "Single paragraph — limited structure analysis",
  })

  // ── 11. Sentence Starters ──
  const starters = sentences.map((s) => {
    const w = s.trim().split(/\s+/)
    return w.slice(0, 2).join(" ").toLowerCase().replace(/[^a-z ]/g, "")
  })
  const starterCounts: Record<string, number> = {}
  starters.forEach((s) => { starterCounts[s] = (starterCounts[s] || 0) + 1 })
  const repeatedStarters = Object.values(starterCounts).filter((c) => c > 1).reduce((a, b) => a + b, 0)
  const starterRatio = repeatedStarters / Math.max(1, sentences.length)
  const starterScore = clamp(starterRatio > 0.55 ? 82 : starterRatio > 0.35 ? 60 : starterRatio > 0.2 ? 35 : starterRatio > 0.1 ? 18 : 8)
  signals.push({
    name: "Sentence Starters",
    description: "AI starts sentences with repetitive patterns",
    score: starterScore,
    weight: 0.04,
    detail: `${(starterRatio * 100).toFixed(0)}% of sentences share opening bigrams`,
  })

  // ── 12. Passive Voice ──
  const passiveMatches = text.match(/\b(is|are|was|were|been|being|be)\s+([\w]+ed|[\w]+en)\b/gi) || []
  const passiveRatio = passiveMatches.length / Math.max(1, sentences.length)
  const passiveScore = clamp(passiveRatio > 0.35 ? 72 : passiveRatio > 0.2 ? 50 : passiveRatio > 0.08 ? 30 : 15)
  signals.push({
    name: "Passive Voice",
    description: "AI uses more passive constructions",
    score: passiveScore,
    weight: 0.03,
    detail: `${passiveMatches.length} passive phrases in ${sentences.length} sentences`,
  })

  // ── 13. List / Bullet Pattern ──
  const allLines = text.split("\n").filter(Boolean)
  const listLines = allLines.filter((l) => /^\s*[-•*]\s|^\s*\d+[.)]\s/.test(l))
  const listRatio = listLines.length / Math.max(1, allLines.length)
  const listScore = clamp(listRatio > 0.5 ? 75 : listRatio > 0.3 ? 55 : listRatio > 0.15 ? 35 : 10)
  signals.push({
    name: "List Patterns",
    description: "AI frequently organizes content in lists",
    score: listScore,
    weight: 0.02,
    detail: `${listLines.length} list items (${(listRatio * 100).toFixed(0)}% of lines)`,
  })

  // ── Weighted overall score ──
  const totalWeight = signals.reduce((a, s) => a + s.weight, 0)
  const rawScore = signals.reduce((sum, s) => sum + s.score * s.weight, 0) / totalWeight
  // Apply mild confidence scaling — lower confidence nudges toward 50
  const confScale = confidence === "high" ? 1.0 : confidence === "medium" ? 0.85 : 0.65
  const overallScore = Math.round(50 + (rawScore - 50) * confScale)

  // ── Per-sentence scoring ──
  const sentenceScores = sentences.slice(0, 30).map((sent) => {
    const sLower = sent.toLowerCase()
    let sc = 0; let checks = 0
    // Check AI phrases in sentence
    for (const p of [...AI_PHRASES_STRONG, ...AI_PHRASES_MEDIUM]) {
      if (sLower.includes(p)) { sc += 30; break }
    }
    checks++
    // Check AI vocab
    let sVocab = 0
    for (const v of AI_VOCABULARY) {
      if (new RegExp(`\\b${v}\\b`, "i").test(sLower)) sVocab++
    }
    sc += Math.min(40, sVocab * 15); checks++
    // No contractions?
    let hasContraction = false
    for (const c of CONTRACTIONS) {
      if (new RegExp(`\\b${c.replace("'", "['']")}\\b`, "i").test(sLower)) { hasContraction = true; break }
    }
    if (!hasContraction) sc += 10; checks++
    // Personal pronouns?
    if (!/\b(i|me|my|we|our)\b/i.test(sLower)) sc += 8; checks++
    return { text: sent.trim(), score: clamp(sc) }
  })

  // Verdict
  let verdict: AnalysisResult["verdict"]
  let summary: string
  if (overallScore >= 65) {
    verdict = "likely-ai"
    summary = "This text shows strong patterns consistent with AI-generated content."
  } else if (overallScore >= 40) {
    verdict = "mixed"
    summary = "This text has mixed signals. It may be AI-assisted, AI-generated then edited, or stylistically formal human writing."
  } else {
    verdict = "likely-human"
    summary = "This text appears primarily human-written based on its linguistic patterns."
  }

  return { overallScore: clamp(overallScore), confidence, signals, summary, verdict, sentenceScores }
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
  const [showSentences, setShowSentences] = useState(false)

  const handleAnalyze = () => {
    if (text.trim().length < 30) return
    setAnalyzing(true)
    setShowSentences(false)
    setTimeout(() => {
      setResult(analyze(text))
      setAnalyzing(false)
    }, 800)
  }

  const reset = () => {
    setText("")
    setResult(null)
    setShowSentences(false)
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
        <ScanSearch className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">AI Content Detector</h1>
      </div>
      <p className="text-muted-foreground">
        Advanced heuristic analysis with 13 signals to detect AI-generated text patterns.
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
            <span className={`text-xs ${wordCount < 30 ? "text-muted-foreground" : wordCount < 200 ? "text-yellow-500" : "text-green-500"}`}>
              {wordCount} words
              {wordCount > 0 && wordCount < 30 && ` (need ${30 - wordCount} more)`}
              {wordCount >= 30 && wordCount < 200 && " (200+ recommended for accuracy)"}
              {wordCount >= 200 && " ✓"}
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
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">{getVerdictLabel(result.verdict)}</h2>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                      result.confidence === "high" ? "border-green-500/50 text-green-400" :
                      result.confidence === "medium" ? "border-yellow-500/50 text-yellow-400" :
                      "border-muted-foreground/50 text-muted-foreground"
                    }`}>
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      {result.confidence} confidence
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{result.summary}</p>
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
                <span className="text-xs text-muted-foreground ml-auto">{result.signals.length} signals analyzed</span>
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
                      style={{ width: `${signal.score}%`, transitionDelay: `${i * 80}ms` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{signal.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Sentence-level analysis */}
          {result.sentenceScores.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Sentence Highlights</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSentences(!showSentences)}
                    className="text-xs"
                  >
                    {showSentences ? "Hide" : "Show"} ({result.sentenceScores.length} sentences)
                  </Button>
                </div>
                {showSentences && (
                  <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                    {result.sentenceScores.map((s, i) => (
                      <div
                        key={i}
                        className={`text-xs p-2 rounded border-l-2 ${
                          s.score >= 50 ? "border-l-red-500 bg-red-500/5" :
                          s.score >= 25 ? "border-l-yellow-500 bg-yellow-500/5" :
                          "border-l-green-500 bg-green-500/5"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`font-mono font-bold shrink-0 ${getScoreColor(s.score)}`}>
                            {s.score}%
                          </span>
                          <span className="text-muted-foreground">{s.text}</span>
                        </div>
                      </div>
                    ))}
                    <p className="text-[10px] text-muted-foreground text-center pt-1">
                      🔴 High AI probability &nbsp; 🟡 Mixed &nbsp; 🟢 Likely human
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Disclaimer */}
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
            <p className="text-xs text-muted-foreground">
              ⚠️ This tool uses heuristic pattern analysis across 13 signals — not machine learning. Results are approximate and should not be used as definitive proof.
              Accuracy improves significantly with longer texts (200+ words). Very short or formal academic text may score higher than expected.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
