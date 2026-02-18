"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/copy-button"

export default function CodeSnippetPage() {
  const [title, setTitle] = useState("")
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [shareUrl, setShareUrl] = useState("")

  const share = () => {
    const data = btoa(encodeURIComponent(JSON.stringify({ title, code, language })))
    const url = `${window.location.origin}${window.location.pathname}?s=${data}`
    setShareUrl(url)
  }

  // Load shared snippet from URL
  useState(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const s = params.get("s")
    if (s) {
      try {
        const data = JSON.parse(decodeURIComponent(atob(s)))
        setTitle(data.title || "")
        setCode(data.code || "")
        setLanguage(data.language || "javascript")
      } catch {}
    }
  })

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Code Snippet Sharer</h1>
      <p className="text-muted-foreground text-sm">Create a shareable code snippet via URL.</p>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-3">
            <Input className="flex-1" placeholder="Snippet title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input className="w-32" placeholder="Language" value={language} onChange={(e) => setLanguage(e.target.value)} />
          </div>
          <Textarea className="min-h-[300px] font-mono text-sm" placeholder="Paste your code here..." value={code} onChange={(e) => setCode(e.target.value)} />
          <Button onClick={share} size="sm">Generate Share Link</Button>

          {shareUrl && (
            <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
              <code className="text-xs flex-1 truncate">{shareUrl}</code>
              <CopyButton text={shareUrl} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
