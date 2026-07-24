"use client"

import { useState, useEffect } from "react"

export default function FocusEditorPage() {
  const [text, setText] = useState("")
  const [wordCount, setWordCount] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem("focus-editor-text")
    if (saved) setText(saved)
  }, [])

  useEffect(() => {
    localStorage.setItem("focus-editor-text", text)
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0)
  }, [text])

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Focus Editor</h1>
          <p className="text-muted-foreground text-sm">Distraction-free writing. Autosaves locally.</p>
        </div>
        <span className="text-sm text-muted-foreground">{wordCount} words</span>
      </div>

      <textarea
        className="w-full min-h-[70vh] bg-transparent text-base leading-relaxed resize-none outline-none placeholder:text-muted-foreground/50"
        placeholder="Start writing..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus
      />
    </div>
  )
}
