"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Languages, ArrowRightLeft, Volume2, Copy, Check,
  RotateCcw, ChevronDown, Loader2,
} from "lucide-react"

// ═══════════════════════════════════════════════════════════════
// LANGUAGE DATA
// ═══════════════════════════════════════════════════════════════

interface Language {
  code: string
  name: string
  native: string
}

const LANGUAGES: Language[] = [
  { code: "auto", name: "Detect Language", native: "Auto" },
  { code: "af", name: "Afrikaans", native: "Afrikaans" },
  { code: "sq", name: "Albanian", native: "Shqip" },
  { code: "am", name: "Amharic", native: "አማርኛ" },
  { code: "ar", name: "Arabic", native: "العربية" },
  { code: "hy", name: "Armenian", native: "Հայերեն" },
  { code: "az", name: "Azerbaijani", native: "Azərbaycan" },
  { code: "eu", name: "Basque", native: "Euskara" },
  { code: "be", name: "Belarusian", native: "Беларуская" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "bs", name: "Bosnian", native: "Bosanski" },
  { code: "bg", name: "Bulgarian", native: "Български" },
  { code: "ca", name: "Catalan", native: "Català" },
  { code: "ceb", name: "Cebuano", native: "Cebuano" },
  { code: "zh", name: "Chinese (Simplified)", native: "中文" },
  { code: "zh-TW", name: "Chinese (Traditional)", native: "繁體中文" },
  { code: "co", name: "Corsican", native: "Corsu" },
  { code: "hr", name: "Croatian", native: "Hrvatski" },
  { code: "cs", name: "Czech", native: "Čeština" },
  { code: "da", name: "Danish", native: "Dansk" },
  { code: "nl", name: "Dutch", native: "Nederlands" },
  { code: "en", name: "English", native: "English" },
  { code: "eo", name: "Esperanto", native: "Esperanto" },
  { code: "et", name: "Estonian", native: "Eesti" },
  { code: "fi", name: "Finnish", native: "Suomi" },
  { code: "fr", name: "French", native: "Français" },
  { code: "fy", name: "Frisian", native: "Frysk" },
  { code: "gl", name: "Galician", native: "Galego" },
  { code: "ka", name: "Georgian", native: "ქართული" },
  { code: "de", name: "German", native: "Deutsch" },
  { code: "el", name: "Greek", native: "Ελληνικά" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "ht", name: "Haitian Creole", native: "Kreyòl" },
  { code: "ha", name: "Hausa", native: "Hausa" },
  { code: "haw", name: "Hawaiian", native: "ʻŌlelo Hawaiʻi" },
  { code: "he", name: "Hebrew", native: "עברית" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "hmn", name: "Hmong", native: "Hmong" },
  { code: "hu", name: "Hungarian", native: "Magyar" },
  { code: "is", name: "Icelandic", native: "Íslenska" },
  { code: "ig", name: "Igbo", native: "Igbo" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia" },
  { code: "ga", name: "Irish", native: "Gaeilge" },
  { code: "it", name: "Italian", native: "Italiano" },
  { code: "ja", name: "Japanese", native: "日本語" },
  { code: "jv", name: "Javanese", native: "Jawa" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "kk", name: "Kazakh", native: "Қазақ" },
  { code: "km", name: "Khmer", native: "ខ្មែរ" },
  { code: "rw", name: "Kinyarwanda", native: "Kinyarwanda" },
  { code: "ko", name: "Korean", native: "한국어" },
  { code: "ku", name: "Kurdish", native: "Kurdî" },
  { code: "ky", name: "Kyrgyz", native: "Кыргызча" },
  { code: "lo", name: "Lao", native: "ລາວ" },
  { code: "la", name: "Latin", native: "Latina" },
  { code: "lv", name: "Latvian", native: "Latviešu" },
  { code: "lt", name: "Lithuanian", native: "Lietuvių" },
  { code: "lb", name: "Luxembourgish", native: "Lëtzebuergesch" },
  { code: "mk", name: "Macedonian", native: "Македонски" },
  { code: "mg", name: "Malagasy", native: "Malagasy" },
  { code: "ms", name: "Malay", native: "Bahasa Melayu" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "mt", name: "Maltese", native: "Malti" },
  { code: "mi", name: "Maori", native: "Te Reo Māori" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "mn", name: "Mongolian", native: "Монгол" },
  { code: "my", name: "Myanmar (Burmese)", native: "မြန်မာ" },
  { code: "ne", name: "Nepali", native: "नेपाली" },
  { code: "no", name: "Norwegian", native: "Norsk" },
  { code: "ny", name: "Nyanja (Chichewa)", native: "Chichewa" },
  { code: "or", name: "Odia (Oriya)", native: "ଓଡ଼ିଆ" },
  { code: "ps", name: "Pashto", native: "پښتو" },
  { code: "fa", name: "Persian", native: "فارسی" },
  { code: "pl", name: "Polish", native: "Polski" },
  { code: "pt", name: "Portuguese", native: "Português" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "ro", name: "Romanian", native: "Română" },
  { code: "ru", name: "Russian", native: "Русский" },
  { code: "sm", name: "Samoan", native: "Gagana Sāmoa" },
  { code: "gd", name: "Scots Gaelic", native: "Gàidhlig" },
  { code: "sr", name: "Serbian", native: "Српски" },
  { code: "st", name: "Sesotho", native: "Sesotho" },
  { code: "sn", name: "Shona", native: "Shona" },
  { code: "sd", name: "Sindhi", native: "سنڌي" },
  { code: "si", name: "Sinhala", native: "සිංහල" },
  { code: "sk", name: "Slovak", native: "Slovenčina" },
  { code: "sl", name: "Slovenian", native: "Slovenščina" },
  { code: "so", name: "Somali", native: "Soomaali" },
  { code: "es", name: "Spanish", native: "Español" },
  { code: "su", name: "Sundanese", native: "Basa Sunda" },
  { code: "sw", name: "Swahili", native: "Kiswahili" },
  { code: "sv", name: "Swedish", native: "Svenska" },
  { code: "tl", name: "Tagalog (Filipino)", native: "Filipino" },
  { code: "tg", name: "Tajik", native: "Тоҷикӣ" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "tt", name: "Tatar", native: "Татар" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "th", name: "Thai", native: "ไทย" },
  { code: "tr", name: "Turkish", native: "Türkçe" },
  { code: "tk", name: "Turkmen", native: "Türkmen" },
  { code: "uk", name: "Ukrainian", native: "Українська" },
  { code: "ur", name: "Urdu", native: "اردو" },
  { code: "ug", name: "Uyghur", native: "ئۇيغۇرچە" },
  { code: "uz", name: "Uzbek", native: "Oʻzbek" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt" },
  { code: "cy", name: "Welsh", native: "Cymraeg" },
  { code: "xh", name: "Xhosa", native: "isiXhosa" },
  { code: "yi", name: "Yiddish", native: "ייִדיש" },
  { code: "yo", name: "Yoruba", native: "Yorùbá" },
  { code: "zu", name: "Zulu", native: "isiZulu" },
]

const TARGET_LANGUAGES = LANGUAGES.filter((l) => l.code !== "auto")

// Popular languages for quick access
const POPULAR_CODES = ["en", "es", "fr", "de", "zh", "ja", "ko", "hi", "ar", "pt", "ru", "it"]

// ═══════════════════════════════════════════════════════════════
// LANGUAGE SELECTOR (dropdown)
// ═══════════════════════════════════════════════════════════════

function LanguageSelector({
  languages,
  selected,
  onSelect,
  label,
}: {
  languages: Language[]
  selected: string
  onSelect: (code: string) => void
  label: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const current = languages.find((l) => l.code === selected)
  const filtered = search
    ? languages.filter(
        (l) =>
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          l.native.toLowerCase().includes(search.toLowerCase()) ||
          l.code.toLowerCase().includes(search.toLowerCase())
      )
    : languages

  const popular = languages.filter((l) => POPULAR_CODES.includes(l.code))

  return (
    <div className="relative" ref={ref}>
      <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <button
        onClick={() => { setOpen(!open); setSearch("") }}
        className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 text-sm hover:border-primary/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="font-medium">{current?.name || "Select"}</span>
          {current && current.code !== "auto" && (
            <span className="text-[10px] text-muted-foreground">({current.native})</span>
          )}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-zinc-950 shadow-xl max-h-[320px] overflow-hidden animate-in fade-in-0 zoom-in-95">
          <div className="p-2 border-b border-border bg-zinc-950">
            <input
              type="text"
              placeholder="Search languages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-border bg-zinc-900 px-3 py-1.5 text-sm outline-none focus:border-primary/50"
              autoFocus
            />
          </div>

          <div className="overflow-y-auto max-h-[260px] p-1 bg-zinc-950">
            {/* Popular section (only when not searching) */}
            {!search && popular.length > 0 && (
              <>
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Popular
                </div>
                {popular.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { onSelect(lang.code); setOpen(false) }}
                    className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors ${
                      selected === lang.code ? "bg-accent text-accent-foreground" : ""
                    }`}
                  >
                    <span>{lang.name}</span>
                    <span className="text-[10px] text-muted-foreground">{lang.native}</span>
                  </button>
                ))}
                <div className="my-1 border-t border-border" />
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  All Languages
                </div>
              </>
            )}

            {filtered.map((lang) => (
              <button
                key={lang.code}
                onClick={() => { onSelect(lang.code); setOpen(false) }}
                className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors ${
                  selected === lang.code ? "bg-accent text-accent-foreground" : ""
                }`}
              >
                <span>{lang.name}</span>
                <span className="text-[10px] text-muted-foreground">{lang.native}</span>
              </button>
            ))}

            {filtered.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">No languages found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function TranslatorPage() {
  const [sourceText, setSourceText] = useState("")
  const [translatedText, setTranslatedText] = useState("")
  const [sourceLang, setSourceLang] = useState("auto")
  const [targetLang, setTargetLang] = useState("es")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [detectedLang, setDetectedLang] = useState("")
  const [charCount, setCharCount] = useState(0)

  const translate = useCallback(async () => {
    const text = sourceText.trim()
    if (!text) return

    setLoading(true)
    setError("")
    setTranslatedText("")
    setDetectedLang("")

    try {
      // Google Translate API (free endpoint)
      const sl = sourceLang === "auto" ? "auto" : sourceLang
      const tl = targetLang

      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&dt=ld&q=${encodeURIComponent(text.slice(0, 5000))}`

      const res = await fetch(url)
      if (!res.ok) throw new Error("Translation service unavailable")

      const data = await res.json()

      // data[0] contains translation segments: [["translated", "source", ...], ...]
      if (data && data[0]) {
        const translated = data[0]
          .filter((seg: unknown[]) => seg && seg[0])
          .map((seg: unknown[]) => seg[0])
          .join("")
        setTranslatedText(translated)

        // Detected language from Google
        if (sourceLang === "auto" && data[2]) {
          const dl = data[2] as string
          const langName = LANGUAGES.find((l) => l.code === dl)?.name || dl
          setDetectedLang(langName)
        }
      } else {
        throw new Error("No translation returned")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [sourceText, sourceLang, targetLang])

  const swapLanguages = () => {
    if (sourceLang === "auto") return
    const oldSource = sourceLang
    const oldTarget = targetLang
    setSourceLang(oldTarget)
    setTargetLang(oldSource)
    setSourceText(translatedText)
    setTranslatedText(sourceText)
  }

  const copyResult = async () => {
    if (!translatedText) return
    await navigator.clipboard.writeText(translatedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const speak = (text: string, lang: string) => {
    if (!text || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === "auto" ? "en" : lang
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }

  const reset = () => {
    setSourceText("")
    setTranslatedText("")
    setError("")
    setDetectedLang("")
    setCharCount(0)
  }

  const handleSourceChange = (val: string) => {
    setSourceText(val)
    setCharCount(val.length)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Languages className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Translator</h1>
      </div>
      <p className="text-muted-foreground text-sm">
        Translate text between <strong>100+ languages</strong> instantly. Supports auto-detection, text-to-speech, and more.
      </p>

      {/* Language Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <LanguageSelector
                languages={LANGUAGES}
                selected={sourceLang}
                onSelect={setSourceLang}
                label="From"
              />
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={swapLanguages}
              disabled={sourceLang === "auto"}
              className="mb-0.5 shrink-0 h-10 w-10"
              title="Swap languages"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </Button>

            <div className="flex-1">
              <LanguageSelector
                languages={TARGET_LANGUAGES}
                selected={targetLang}
                onSelect={setTargetLang}
                label="To"
              />
            </div>
          </div>

          {detectedLang && (
            <p className="mt-2 text-xs text-muted-foreground">
              Detected language: <span className="font-medium text-primary">{detectedLang}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Translation Panels */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Source */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Source</span>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] ${charCount > 4500 ? "text-red-400" : "text-muted-foreground"}`}>
                  {charCount}/5000
                </span>
                {sourceText && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => speak(sourceText, sourceLang)} title="Listen">
                    <Volume2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
            <Textarea
              placeholder="Enter text to translate..."
              value={sourceText}
              onChange={(e) => handleSourceChange(e.target.value.slice(0, 5000))}
              className="min-h-[160px] resize-y text-sm border-0 p-0 focus-visible:ring-0 shadow-none"
            />
          </CardContent>
        </Card>

        {/* Target */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Translation</span>
              <div className="flex items-center gap-1">
                {translatedText && (
                  <>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => speak(translatedText, targetLang)} title="Listen">
                      <Volume2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyResult} title="Copy">
                      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="min-h-[160px] text-sm whitespace-pre-wrap">
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Translating...
                </div>
              ) : error && !translatedText ? (
                <div className="text-destructive text-sm py-4">{error}</div>
              ) : translatedText ? (
                <span>{translatedText}</span>
              ) : (
                <span className="text-muted-foreground">Translation will appear here...</span>
              )}
            </div>
            {error && translatedText && (
              <p className="text-[10px] text-yellow-500">{error}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {sourceText && (
            <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>
        <Button
          onClick={translate}
          disabled={!sourceText.trim() || loading}
          size="sm"
          className="gap-1.5"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
          {loading ? "Translating..." : "Translate"}
        </Button>
      </div>

      {/* Info */}
      <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
        <p className="text-[10px] text-muted-foreground">
          Powered by Google Translate &bull; Up to 5,000 characters per translation &bull;
          Text-to-speech uses your browser&apos;s built-in speech synthesis
        </p>
      </div>
    </div>
  )
}
