"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { FileText, Copy, Check, RefreshCw } from "lucide-react"

const LOREM_WORDS = [
  "lorem","ipsum","dolor","sit","amet","consectetur","adipiscing","elit","sed","do",
  "eiusmod","tempor","incididunt","ut","labore","et","dolore","magna","aliqua","enim",
  "ad","minim","veniam","quis","nostrud","exercitation","ullamco","laboris","nisi",
  "aliquip","ex","ea","commodo","consequat","duis","aute","irure","in","reprehenderit",
  "voluptate","velit","esse","cillum","fugiat","nulla","pariatur","excepteur","sint",
  "occaecat","cupidatat","non","proident","sunt","culpa","qui","officia","deserunt",
  "mollit","anim","id","est","laborum","porta","nibh","venenatis","cras","pulvinar",
  "mattis","nunc","blandit","volutpat","maecenas","pharetra","convallis","posuere",
  "morbi","leo","urna","molestie","viverra","justo","nec","ultrices","dui","sapien",
  "eget","mi","proin","gravida","hendrerit","lectus","faucibus","orci","luctus",
  "accumsan","lacus","vel","facilisis","dictum","fusce","placerat","at","semper",
  "auctor","neque","vitae","tellus","integer","feugiat","scelerisque","varius",
  "tortor","condimentum","lacinia","quis","massa","elementum","sagittis",
]

function randomWord(): string {
  return LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function generateSentence(minWords = 6, maxWords = 14): string {
  const count = minWords + Math.floor(Math.random() * (maxWords - minWords + 1))
  const words = Array.from({ length: count }, randomWord)
  words[0] = capitalize(words[0])
  // sometimes add a comma
  if (count > 6) {
    const commaPos = 2 + Math.floor(Math.random() * (count - 4))
    words[commaPos] += ","
  }
  return words.join(" ") + "."
}

function generateParagraph(sentences = 4): string {
  return Array.from({ length: sentences }, () => generateSentence()).join(" ")
}

type Mode = "paragraphs" | "sentences" | "words"

export default function LoremIpsumPage() {
  const [mode, setMode] = useState<Mode>("paragraphs")
  const [count, setCount] = useState(3)
  const [output, setOutput] = useState("")
  const [copied, setCopied] = useState(false)
  const [startWithLorem, setStartWithLorem] = useState(true)

  const generate = () => {
    let result = ""
    if (mode === "paragraphs") {
      const paragraphs = Array.from({ length: count }, () => generateParagraph(3 + Math.floor(Math.random() * 3)))
      result = paragraphs.join("\n\n")
    } else if (mode === "sentences") {
      result = Array.from({ length: count }, () => generateSentence()).join(" ")
    } else {
      result = Array.from({ length: count }, randomWord).join(" ")
      result = capitalize(result) + "."
    }

    if (startWithLorem && result.length > 20) {
      result = "Lorem ipsum dolor sit amet, " + result.slice(result.indexOf(" ", 5) + 1)
    }
    setOutput(result)
  }

  const copy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Lorem Ipsum Generator</h1>
      </div>
      <p className="text-muted-foreground">Generate placeholder text for your designs and mockups.</p>

      <Card>
        <CardContent className="space-y-4 p-5">
          {/* Mode */}
          <div className="flex gap-1.5">
            {(["paragraphs", "sentences", "words"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                  mode === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>Count</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value))))}
                className="w-20"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={startWithLorem}
                onChange={(e) => setStartWithLorem(e.target.checked)}
                className="accent-primary"
              />
              Start with &quot;Lorem ipsum...&quot;
            </label>
          </div>

          <Button onClick={generate} className="w-full gap-2">
            <RefreshCw className="h-4 w-4" /> Generate
          </Button>
        </CardContent>
      </Card>

      {output && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {output.split(/\s+/).length} words · {output.length} chars
              </span>
              <Button variant="outline" size="sm" onClick={copy} className="h-7 gap-1.5">
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <div className="selectable whitespace-pre-wrap rounded bg-muted/50 p-4 text-sm leading-relaxed text-foreground">
              {output}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
