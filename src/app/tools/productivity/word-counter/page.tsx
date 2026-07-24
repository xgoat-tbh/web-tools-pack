"use client"

import { useState, useMemo } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"

export default function WordCounterPage() {
  const [text, setText] = useState("")

  const stats = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    const chars = text.length
    const charsNoSpaces = text.replace(/\s/g, "").length
    const sentences = text.trim() ? (text.match(/[.!?]+/g) || []).length || (text.trim() ? 1 : 0) : 0
    const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter((p) => p.trim()).length : 0
    const readingTime = Math.ceil(words / 200)
    return { words, chars, charsNoSpaces, sentences, paragraphs, readingTime }
  }, [text])

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Word Counter</h1>
      <p className="text-muted-foreground text-sm">Count words, characters, sentences, and more.</p>

      <div className="grid gap-3 grid-cols-3 lg:grid-cols-6">
        {([["Words", stats.words], ["Characters", stats.chars], ["No Spaces", stats.charsNoSpaces], ["Sentences", stats.sentences], ["Paragraphs", stats.paragraphs], ["Read Time", `${stats.readingTime}m`]] as const).map(([label, val]) => (
          <Card key={label}>
            <CardContent className="pt-4 text-center">
              <div className="text-xl font-bold text-primary">{val}</div>
              <div className="text-[10px] text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Textarea
        className="min-h-[400px] text-sm"
        placeholder="Start typing or paste text..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </div>
  )
}
