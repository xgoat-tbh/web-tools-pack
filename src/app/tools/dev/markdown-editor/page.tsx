"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export default function MarkdownEditorPage() {
  const [md, setMd] = useState(`# Hello World

This is a **Markdown** editor with _live preview_.

- Item 1
- Item 2
- Item 3

\`\`\`js
console.log("Hello!");
\`\`\`

> Blockquote example

| Col 1 | Col 2 |
|-------|-------|
| A     | B     |
`)

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Markdown Editor</h1>
      <p className="text-muted-foreground text-sm">Write Markdown and see the preview instantly.</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Markdown</CardTitle></CardHeader>
          <CardContent>
            <Textarea className="min-h-[500px] font-mono text-sm" value={md} onChange={(e) => setMd(e.target.value)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Preview</CardTitle></CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none min-h-[500px]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
