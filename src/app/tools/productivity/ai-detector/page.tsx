"use client"

import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CopyButton } from "@/components/copy-button"
import {
  ScanSearch, RotateCcw, Brain, BarChart3, Loader2,
  ChevronDown, ChevronUp, BookOpen, Highlighter,
} from "lucide-react"

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface SentenceResult {
  text: string
  score: number
  isAI: boolean
  triggers: string[]
}

interface AnalysisResult {
  overallScore: number
  sentences: SentenceResult[]
  signals: Signal[]
  aiSentenceCount: number
  totalSentences: number
  readability: {
    score: number
    label: string
  }
}

interface Signal {
  name: string
  score: number
  weight: number
  detail: string
}

// ═══════════════════════════════════════════════════════════════
// WORD LISTS & DATA
// ═══════════════════════════════════════════════════════════════

// --- AI PHRASES (strongly indicate AI) ---
const AI_PHRASES_STRONG = [
  "it's important to note", "it is important to note",
  "it's worth noting", "it is worth noting",
  "it's crucial to", "it is crucial to",
  "it's essential to", "it is essential to",
  "in today's digital age", "in today's rapidly evolving",
  "in the realm of", "in the ever-evolving",
  "this comprehensive guide", "this comprehensive overview",
  "delve into", "delve deeper", "let's delve",
  "without further ado",
  "plays a crucial role", "plays a vital role", "plays a pivotal role",
  "leverage the power", "harness the power",
  "navigate the complexities", "navigate the landscape",
  "tapestry of", "rich tapestry", "intricate tapestry",
  "a testament to", "stands as a testament",
  "it cannot be overstated", "the intricacies of",
  "paves the way", "a myriad of",
  "in the grand scheme", "sheds light on",
  "whether you're a beginner or", "whether you're a seasoned",
  "as we navigate", "in this article, we will",
  "remember that", "keep in mind that",
  "serve as a foundation", "serves as a foundation",
  "not only ... but also", "not only does it",
  "integral part of", "cornerstone of",
  "underscores the importance", "highlighting the need",
  "transformative power", "paradigm shift",
  "in summary, ", "to summarize, ",
  "all in all, ", "by and large, ",
  "explore the various", "exploring the",
  "gain a deeper understanding", "broader context",
]

const AI_PHRASES_MEDIUM = [
  "on the other hand", "in conclusion", "in summary",
  "furthermore,", "moreover,", "additionally,",
  "consequently,", "nevertheless,", "nonetheless,",
  "when it comes to", "in order to",
  "a wide range of", "the landscape of",
  "first and foremost", "last but not least",
  "it goes without saying", "needless to say",
  "with that being said", "having said that", "that being said",
  "it should be noted", "from a broader perspective",
  "taking into account", "for instance,", "for example,",
  "this approach", "should be viewed as",
  "rather than a replacement", "remain essential",
  "the future of", "will likely involve",
  "one of the most", "both significant opportunities",
  "important challenges", "as education continues",
  "aiming to create", "balanced partnership",
  "can be viewed as", "capable of",
  "offers both", "offers significant",
  "key factors", "vital components",
  "essential elements", "critical aspects",
  "diverse array of", "wide variety of",
  "enhancing the", "ensuring that",
  "making it easier to", "allowing for",
  "due to the fact that", "in light of",
]

// --- AI VOCABULARY (single words AI overuses) ---
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
  "engaging", "innovative", "supportive", "revolutionize",
  "cutting-edge", "state-of-the-art", "furthermore",
  "moreover", "additionally", "consequently", "nonetheless",
  "increasingly", "substantial", "implementing", "proficiency",
  "infrastructure", "methodology", "proliferation",
  "nuance", "mitigate", "harness", "framework", "mechanism",
  "resilience", "sustainability", "evolution", "landscape",
  "realm", "tapestry", "symphony", "plethora", "beacon",
  "unlock", "unleash", "bridge", "align", "drive",
  "ensure", "enable", "enhance", "crucial", "vital",
]

const CONTRACTIONS = [
  "i'm", "i've", "i'll", "i'd", "you're", "you've", "you'll",
  "he's", "she's", "it's", "we're", "they're", "we've", "they've",
  "isn't", "aren't", "wasn't", "weren't", "don't", "doesn't",
  "didn't", "won't", "wouldn't", "couldn't", "shouldn't", "can't",
  "hasn't", "haven't", "that's", "there's", "what's", "let's",
  "ain't", "gonna", "wanna", "gotta",
]

const TRANSITIONS = [
  "however", "therefore", "furthermore", "moreover", "additionally",
  "consequently", "nevertheless", "nonetheless", "meanwhile",
  "subsequently", "accordingly", "hence", "thus", "notably",
  "significantly", "importantly", "conversely", "alternatively",
  "specifically", "essentially", "fundamentally", "ultimately",
  "undoubtedly", "arguably", "evidently",
]

// Common English words (frequency proxy for perplexity estimation)
const COMMON_WORDS = new Set([
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
  "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
  "or", "an", "will", "my", "one", "all", "would", "there", "their",
  "what", "so", "up", "out", "if", "about", "who", "get", "which", "go",
  "me", "when", "make", "can", "like", "time", "no", "just", "him",
  "know", "take", "people", "into", "year", "your", "good", "some",
  "could", "them", "see", "other", "than", "then", "now", "look",
  "only", "come", "its", "over", "think", "also", "back", "after",
  "use", "two", "how", "our", "work", "first", "well", "way", "even",
  "new", "want", "because", "any", "these", "give", "day", "most", "us",
  "is", "are", "was", "were", "been", "being", "has", "had", "did",
  "does", "am", "may", "might", "shall", "should", "must",
])

// ═══════════════════════════════════════════════════════════════
// ANALYSIS ENGINE — 10 advanced signals
// ═══════════════════════════════════════════════════════════════

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

// Signal 1: AI Phrase Detection
function analyzeAIPhrases(lower: string, wordCount: number): Signal {
  let strongHits = 0, medHits = 0
  const found: string[] = []
  for (const p of AI_PHRASES_STRONG) {
    if (lower.includes(p)) { strongHits++; if (found.length < 3) found.push(p) }
  }
  for (const p of AI_PHRASES_MEDIUM) {
    if (lower.includes(p)) { medHits++; if (found.length < 4) found.push(p) }
  }
  // Increased weights: Strong 3->5, Med 1.5->2
  const totalWeighted = strongHits * 5 + medHits * 2
  const per100 = totalWeighted / Math.max(1, wordCount / 100)
  const score = clamp(per100 * 18) // Multiplier 15->18
  return {
    name: "AI Phrases", score, weight: 0.22, // Weight 0.18->0.22
    detail: found.length > 0
      ? `${strongHits} strong + ${medHits} medium: "${found.slice(0, 3).join('", "')}"${found.length > 3 ? "..." : ""}`
      : "None detected",
  }
}

// Signal 2: AI Vocabulary Density
function analyzeVocabulary(lower: string, wordCount: number): Signal {
  let hits = 0
  const found: string[] = []
  for (const w of AI_VOCABULARY) {
    const m = lower.match(new RegExp(`\\b${w}\\b`, "gi"))
    if (m) { hits += m.length; if (found.length < 5) found.push(w) }
  }
  const per100 = hits / Math.max(1, wordCount / 100)
  const score = clamp(per100 * 15) // Multiplier 12->15
  return {
    name: "AI Vocabulary", score, weight: 0.18, // Weight 0.14->0.18
    detail: hits > 0 ? `${hits} hits: ${found.join(", ")}` : "None detected",
  }
}

// Signal 3: Sentence Length Uniformity
function analyzeSentenceUniformity(sentLengths: number[]): Signal {
  const cv = computeCV(sentLengths)
  // AI: CV typically 0.15-0.30; Human: 0.35-0.70+
  const score = clamp(
    cv < 0.15 ? 98 : cv < 0.22 ? 90 : cv < 0.30 ? 75 :
    cv < 0.38 ? 55 : cv < 0.48 ? 30 : cv < 0.60 ? 15 : 5
  )
  return {
    name: "Sentence Uniformity", score, weight: 0.12,
    detail: `CV: ${(cv * 100).toFixed(0)}% — ${cv < 0.25 ? "very uniform (AI)" : cv < 0.40 ? "moderate" : "varied (human)"}`,
  }
}

// Signal 4: Burstiness (variance in local complexity)
function analyzeBurstiness(sentLengths: number[]): Signal {
  if (sentLengths.length < 5) {
    return { name: "Burstiness", score: 50, weight: 0.10, detail: "Too few sentences" }
  }
  // Sliding window of 3 sentences
  const windowAvgs: number[] = []
  for (let i = 0; i <= sentLengths.length - 3; i++) {
    const win = sentLengths.slice(i, i + 3)
    windowAvgs.push(win.reduce((a, b) => a + b, 0) / 3)
  }
  const bCV = computeCV(windowAvgs)
  // Low burstiness = AI (very consistent); high = human
  const score = clamp(
    bCV < 0.10 ? 95 : bCV < 0.18 ? 82 : bCV < 0.25 ? 65 :
    bCV < 0.35 ? 40 : bCV < 0.50 ? 18 : 5
  )
  return {
    name: "Burstiness", score, weight: 0.10,
    detail: `Window CV: ${(bCV * 100).toFixed(0)}% across ${windowAvgs.length} windows`,
  }
}

// Signal 5: Contraction Absence
function analyzeContractions(lower: string, sentenceCount: number): Signal {
  let cc = 0
  for (const c of CONTRACTIONS) {
    cc += countRegex(lower, new RegExp(`\\b${c.replace("'", "[''']")}\\b`, "gi"))
  }
  const cps = cc / Math.max(1, sentenceCount)
  // No contractions = very AI-like; humans use ~0.3-1+ per sentence
  const score = clamp(
    cps < 0.02 ? 95 : cps < 0.08 ? 82 : cps < 0.18 ? 60 :
    cps < 0.35 ? 35 : cps < 0.55 ? 15 : 5
  )
  return {
    name: "Contractions", score, weight: 0.10,
    detail: `${cc} contractions in ${sentenceCount} sentences (${cps.toFixed(2)}/sent)`,
  }
}

// Signal 6: Transition Word Density
function analyzeTransitions(lower: string, sentenceCount: number): Signal {
  let tc = 0
  for (const tw of TRANSITIONS) {
    tc += countRegex(lower, new RegExp(`\\b${tw}\\b`, "gi"))
  }
  const density = tc / Math.max(1, sentenceCount)
  const score = clamp(
    density > 0.50 ? 95 : density > 0.35 ? 80 : density > 0.22 ? 60 :
    density > 0.12 ? 35 : density > 0.05 ? 18 : 5
  )
  return {
    name: "Transition Density", score, weight: 0.08,
    detail: `${tc} transitions in ${sentenceCount} sentences (${(density * 100).toFixed(0)}%)`,
  }
}

// Signal 7: Personal Voice & Informality
function analyzePersonalVoice(lower: string, wordCount: number): Signal {
  const firstPerson = countRegex(lower, /\b(i|me|my|mine|myself)\b/g)
  const informal = countRegex(lower, /\b(yeah|yep|nope|okay|ok|lol|haha|wow|cool|awesome|gonna|wanna|gotta|kinda|sorta|tbh|imo|btw|ngl|idk|honestly|literally|basically|actually|pretty much|stuff|things|like,)\b/g)
  const markers = firstPerson + informal
  const per100 = markers / Math.max(1, wordCount / 100)
  const score = clamp(
    per100 < 0.15 ? 92 : per100 < 0.5 ? 72 : per100 < 1.2 ? 48 :
    per100 < 2.5 ? 22 : per100 < 5 ? 10 : 3
  )
  return {
    name: "Personal Voice", score, weight: 0.10,
    detail: `${firstPerson} first-person + ${informal} informal (${per100.toFixed(1)}/100w)`,
  }
}

// Signal 8: Predictability (pseudo-perplexity via word commonality)
function analyzePredictability(words: string[]): Signal {
  if (words.length < 20) {
    return { name: "Predictability", score: 50, weight: 0.08, detail: "Too few words" }
  }
  const sample = words.slice(0, 500).map((w) => w.toLowerCase().replace(/[^a-z'-]/g, "")).filter(Boolean)
  // Ratio of common words — AI uses more common, "safe" words
  const commonCount = sample.filter((w) => COMMON_WORDS.has(w)).length
  const commonRatio = commonCount / sample.length

  // Bigram repetition: AI reuses same word pairs more
  const bigrams: Record<string, number> = {}
  for (let i = 0; i < sample.length - 1; i++) {
    const bg = sample[i] + " " + sample[i + 1]
    bigrams[bg] = (bigrams[bg] || 0) + 1
  }
  const bigramCount = Object.keys(bigrams).length
  const bigramRatio = bigramCount / Math.max(1, sample.length - 1)

  // Word frequency: compute type-token ratio for lexical diversity
  const wordFreqs: Record<string, number> = {}
  sample.forEach((w) => { wordFreqs[w] = (wordFreqs[w] || 0) + 1 })
  const uniqueCount = Object.keys(wordFreqs).length
  const ttr = uniqueCount / sample.length

  // AI: high common ratio (0.55+), low bigram diversity, moderate TTR
  let s = 0
  if (commonRatio > 0.58) s += 35
  else if (commonRatio > 0.52) s += 25
  else if (commonRatio > 0.45) s += 15
  else s += 5

  if (bigramRatio < 0.75) s += 30
  else if (bigramRatio < 0.82) s += 20
  else if (bigramRatio < 0.88) s += 10
  else s += 3

  if (ttr > 0.40 && ttr < 0.58) s += 25 // AI "sweet spot"
  else if (ttr >= 0.58) s += 8 // very diverse = human
  else s += 15

  return {
    name: "Predictability", score: clamp(s), weight: 0.08,
    detail: `Common: ${(commonRatio * 100).toFixed(0)}%, Bigram diversity: ${(bigramRatio * 100).toFixed(0)}%, TTR: ${(ttr * 100).toFixed(0)}%`,
  }
}

// Signal 9: Paragraph Structure
function analyzeParagraphs(text: string): Signal {
  const paras = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
  if (paras.length <= 1) {
    return { name: "Paragraph Structure", score: 45, weight: 0.05, detail: "Single paragraph" }
  }
  const paraLens = paras.map((p) => p.trim().split(/\s+/).length)
  const cv = computeCV(paraLens)
  const score = clamp(
    cv < 0.12 ? 92 : cv < 0.20 ? 75 : cv < 0.30 ? 55 :
    cv < 0.45 ? 30 : cv < 0.60 ? 12 : 5
  )
  return {
    name: "Paragraph Structure", score, weight: 0.05,
    detail: `${paras.length} paragraphs, CV: ${(cv * 100).toFixed(0)}%`,
  }
}

// Signal 10: Sentence Starter Repetition
function analyzeStarters(sentences: string[]): Signal {
  if (sentences.length < 4) {
    return { name: "Sentence Starters", score: 40, weight: 0.05, detail: "Too few sentences" }
  }
  const starters = sentences.map((s) => {
    const w = s.trim().split(/\s+/)
    return w.slice(0, 2).join(" ").toLowerCase().replace(/[^a-z ]/g, "")
  })
  const counts: Record<string, number> = {}
  starters.forEach((s) => { counts[s] = (counts[s] || 0) + 1 })
  const repeated = Object.values(counts).filter((c) => c > 1).reduce((a, b) => a + b, 0)
  const ratio = repeated / sentences.length
  const score = clamp(
    ratio > 0.55 ? 90 : ratio > 0.40 ? 72 : ratio > 0.25 ? 50 :
    ratio > 0.15 ? 28 : ratio > 0.05 ? 12 : 5
  )
  return {
    name: "Sentence Starters", score, weight: 0.05,
    detail: `${(ratio * 100).toFixed(0)}% repeated opening patterns`,
  }
}

// Readability Analysis (Flesch-Kincaid)
function analyzeReadability(text: string): { score: number; label: string } {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length
  const words = text.split(/\s+/).filter((w) => w.trim().length > 0).length
  const syllables = text.split(/\s+/).reduce((acc, word) => {
    word = word.toLowerCase().replace(/[^a-z]/g, "")
    if (word.length <= 3) return acc + 1
    const s = word
      .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
      .replace(/^y/, "")
      .match(/[aeiouy]{1,2}/g)
    return acc + (s ? s.length : 1)
  }, 0)

  if (sentences === 0 || words === 0) return { score: 0, label: "N/A" }

  // Flesch Reading Ease
  const ease = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
  
  // Flesch-Kincaid Grade Level
  const grade = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59

  let label = "Standard"
  if (grade < 6) label = "Easy (5th-6th grade)"
  else if (grade < 8) label = "Plain English (7th-8th grade)"
  else if (grade < 10) label = "Conversational (9th-10th grade)"
  else if (grade < 12) label = "Complex (11th-12th grade)"
  else if (grade < 14) label = "College Level"
  else label = "Academic / Professional"

  return { score: Math.max(0, Math.min(100, ease)), label }
}

// ═══════════════════════════════════════════════════════════════
// PER-SENTENCE SCORING
// ═══════════════════════════════════════════════════════════════

function scoreSentence(sent: string, avgSentLen: number, sentLenStd: number): { score: number; triggers: string[] } {
  const lower = sent.toLowerCase()
  const words = sent.split(/\s+/).filter(Boolean)
  const wc = words.length
  let score = 0
  const triggers: string[] = []

  // 1. AI phrases (heavy weight)
  for (const p of AI_PHRASES_STRONG) {
    if (lower.includes(p)) { 
      score += 45
      triggers.push(p)
    }
  }
  for (const p of AI_PHRASES_MEDIUM) {
    if (lower.includes(p)) { 
      score += 25
      triggers.push(p)
    }
  }

  // 2. AI vocabulary words
  let vocabHits = 0
  for (const v of AI_VOCABULARY) {
    if (new RegExp(`\\b${v}\\b`, "i").test(lower)) {
      vocabHits++
      triggers.push(v)
    }
  }
  score += Math.min(45, vocabHits * 12)

  // 3. No contractions
  const hasContraction = CONTRACTIONS.some((c) =>
    new RegExp(`\\b${c.replace("'", "[''']")}\\b`, "i").test(lower)
  )
  if (!hasContraction && wc > 6) score += 15

  // 4. No personal voice
  if (!/\b(i|me|my|we|our|you|your)\b/i.test(lower) && wc > 8) score += 12

  // 5. Starts with transition
  const firstWord = words[0]?.toLowerCase().replace(/[^a-z]/g, "") || ""
  if (TRANSITIONS.includes(firstWord)) {
    score += 18
    triggers.push(firstWord)
  }

  // 6. Sentence in "AI length sweet spot" (close to average = uniform)
  if (sentLenStd > 0) {
    const deviation = Math.abs(wc - avgSentLen) / sentLenStd
    if (deviation < 0.5) score += 15 // very close to mean
    else if (deviation < 1.0) score += 8
  }

  // 7. Comma-heavy complex sentence
  const commas = (sent.match(/,/g) || []).length
  if (commas >= 3 && wc > 12) score += 10
  if (commas >= 4 && wc > 15) score += 5

  // 8. Formal structural patterns
  const formalPattern = /\b(one of the most|both .+ and|plays? a .+ role|capable of|should be|rather than|aims? to|continues? to|offers? .+ opportunities|can be .+ as)\b/i
  const formalMatch = sent.match(formalPattern)
  if (formalMatch) {
    score += 20
    triggers.push(formalMatch[0])
  }

  // 9. Common AI sentence starters
  const starterMatch = sent.trim().match(/^(additionally|furthermore|moreover|however|consequently|this|these|such|overall|ultimately|in\s)/i)
  if (starterMatch) {
    score += 12
    triggers.push(starterMatch[0])
  }

  // 10. No question marks or exclamation — AI rarely uses these in essays
  if (!/[?!]/.test(sent) && wc > 12) score += 5

  // 11. Hedging / Safety Language
  const hedgingPattern = /\b(it is important to|while it is true|typically|generally|in most cases|depending on|vary depending|it depends|crucial to consider|worth considering)\b/i
  const hedgeMatch = sent.match(hedgingPattern)
  if (hedgeMatch) {
    score += 15
    triggers.push(hedgeMatch[0])
  }

  return { score: clamp(score), triggers: Array.from(new Set(triggers)) }
}

// ═══════════════════════════════════════════════════════════════
// FULL ANALYSIS
// ═══════════════════════════════════════════════════════════════

function analyze(text: string): AnalysisResult {
  const lower = text.toLowerCase()
  const words = text.split(/\s+/).filter(Boolean)
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 5)
  const wordCount = words.length
  const sentLengths = sentences.map((s) => s.trim().split(/\s+/).length)
  const avgSentLen = sentLengths.length > 0
    ? sentLengths.reduce((a, b) => a + b, 0) / sentLengths.length : 0
  const sentLenStd = sentLengths.length > 1
    ? Math.sqrt(sentLengths.reduce((s, l) => s + (l - avgSentLen) ** 2, 0) / sentLengths.length) : 0

  // Compute all 10 signals
  const signals: Signal[] = [
    analyzeAIPhrases(lower, wordCount),
    analyzeVocabulary(lower, wordCount),
    analyzeSentenceUniformity(sentLengths),
    analyzeBurstiness(sentLengths),
    analyzeContractions(lower, sentences.length),
    analyzeTransitions(lower, sentences.length),
    analyzePersonalVoice(lower, wordCount),
    analyzePredictability(words),
    analyzeParagraphs(text),
    analyzeStarters(sentences),
  ]

  // Weighted overall score
  const totalW = signals.reduce((a, s) => a + s.weight, 0)
  let rawScore = signals.reduce((sum, s) => sum + s.score * s.weight, 0) / totalW

  // Confidence scaling: shorter texts nudge toward 50
  const confScale = wordCount >= 250 ? 1.0 : wordCount >= 120 ? 0.90 : wordCount >= 60 ? 0.75 : 0.55
  const overallScore = Math.round(50 + (rawScore - 50) * confScale)

  // Per-sentence scoring
  const sentenceResults: SentenceResult[] = sentences.slice(0, 40).map((sent) => {
    const { score, triggers } = scoreSentence(sent, avgSentLen, sentLenStd)
    return { text: sent.trim(), score, isAI: score >= 40, triggers }
  })

  const aiCount = sentenceResults.filter((s) => s.isAI).length

  return {
    overallScore: clamp(overallScore),
    sentences: sentenceResults,
    signals,
    aiSentenceCount: aiCount,
    totalSentences: sentenceResults.length,
    readability: analyzeReadability(text),
  }
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
    if (s >= 88) return "AI Generated"
    if (s >= 70) return "Mostly AI"
    if (s >= 45) return "Mixed"
    if (s >= 25) return "Mostly Human"
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
  const [highlightTriggers, setHighlightTriggers] = useState(false)

  const handleAnalyze = useCallback(() => {
    const trimmed = text.trim()
    if (trimmed.split(/\s+/).length < 30) return

    setAnalyzing(true)
    setShowSignals(false)

    // Run synchronously but with visual delay for UX
    setTimeout(() => {
      setResult(analyze(trimmed))
      setAnalyzing(false)
    }, 600)
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
      <div className="flex items-center gap-2">
        <ScanSearch className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">AI Content Detector</h1>
      </div>
      <p className="text-muted-foreground text-sm">
        Advanced AI detection using <strong>10 linguistic signals</strong> including
        predictability analysis, burstiness, and vocabulary profiling.
        AI sentences are <span className="bg-yellow-500/30 px-1 rounded">highlighted</span>.
      </p>

      {/* Input */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <Textarea
            placeholder="Paste the text you want to analyze (minimum 30 words, 250+ recommended for best accuracy)..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[180px] resize-y text-sm"
          />
          <div className="flex items-center justify-between">
            <span className={`text-xs ${wordCount < 30 ? "text-muted-foreground" : wordCount < 250 ? "text-yellow-500" : "text-green-500"}`}>
              {wordCount} words
              {wordCount > 0 && wordCount < 30 && ` (need ${30 - wordCount} more)`}
              {wordCount >= 30 && wordCount < 250 && " (250+ for best accuracy)"}
              {wordCount >= 250 && " \u2713"}
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
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <h2 className={`text-xl font-bold ${getScoreColor(result.overallScore)}`}>
                    {result.overallScore >= 88
                      ? "Your Text is AI/GPT Generated"
                      : result.overallScore >= 70
                        ? "Your Text is Mostly AI Generated"
                        : result.overallScore >= 45
                          ? "Your Text is Mixed (AI + Human)"
                          : result.overallScore >= 25
                            ? "Your Text is Mostly Human Written"
                            : "Your Text is Human Written"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    <strong className={getScoreColor(result.overallScore)}>
                      {result.aiSentenceCount}
                    </strong> of {result.totalSentences} sentences appear AI-generated
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Analyzed using 10 linguistic signals &bull; {wordCount} words processed
                  </p>
                  
                  {/* Readability Badge */}
                  <div className="mt-3 inline-flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Readability: <span className="text-foreground">{result.readability.label}</span> ({result.readability.score.toFixed(0)})</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sentence Highlighting — THE primary output */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Sentence Analysis</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost" size="sm"
                    className={`h-8 gap-1.5 text-xs ${highlightTriggers ? "bg-accent text-accent-foreground" : ""}`}
                    onClick={() => setHighlightTriggers(!highlightTriggers)}
                  >
                    <Highlighter className="h-3.5 w-3.5" />
                    {highlightTriggers ? "Hide Triggers" : "Show Triggers"}
                  </Button>
                  <CopyButton text={result.sentences.map(s => s.text).join(" ")} />
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-[10px] mb-3">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded bg-yellow-500/40 border border-yellow-500/60" />
                  AI-generated
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded bg-transparent border border-border" />
                  Human
                </span>
                {highlightTriggers && (
                  <span className="flex items-center gap-1 ml-2">
                    <span className="font-bold text-red-500 underline decoration-red-400 decoration-2">Text</span>
                    Trigger Phrase
                  </span>
                )}
              </div>

              {/* Highlighted text */}
              <div className="rounded-lg border border-border/50 bg-muted/20 p-4 text-sm leading-[1.8]">
                {result.sentences.map((s, i) => {
                  let content: React.ReactNode = s.text
                  
                  if (highlightTriggers && s.triggers.length > 0) {
                    const pattern = new RegExp(`(${s.triggers.sort((a, b) => b.length - a.length).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
                    const parts = s.text.split(pattern)
                    content = parts.map((part, idx) => {
                      const isTrigger = s.triggers.some(t => t.toLowerCase() === part.toLowerCase())
                      return isTrigger 
                        ? <span key={idx} className="font-bold text-red-600 underline decoration-red-400 decoration-2" title="AI Trigger">{part}</span>
                        : part
                    })
                  }

                  return (
                    <span
                      key={i}
                      className={`${s.isAI ? "bg-yellow-500/30 decoration-yellow-500/60" : ""} hover:bg-yellow-500/20 transition-colors`}
                      title={`AI Score: ${s.score}%${s.triggers.length ? `\nTriggers: ${s.triggers.join(", ")}` : ""}`}
                    >
                      {content}{" "}
                    </span>
                  )
                })}
              </div>

              {/* Per-sentence breakdown */}
              <div className="mt-4 space-y-1 max-h-[400px] overflow-y-auto">
                {result.sentences.map((s, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 text-xs p-2 rounded ${
                      s.isAI
                        ? "bg-yellow-500/10 border-l-2 border-l-yellow-500"
                        : "bg-muted/20 border-l-2 border-l-green-500"
                    }`}
                  >
                    <span className={`font-mono font-bold shrink-0 w-8 text-right ${
                      s.score >= 65 ? "text-red-400" : s.score >= 40 ? "text-yellow-400" : "text-green-400"
                    }`}>
                      {s.score}%
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
                  Signal Breakdown ({result.signals.length} signals)
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
              &#9888;&#65039; No AI detector is 100% accurate. This tool uses advanced linguistic analysis
              including predictability scoring, burstiness detection, and vocabulary profiling.
              Accuracy improves with longer texts (250+ words). Academic or formal writing may score
              higher than expected.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
