"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/copy-button"

function formatXml(xml: string): string {
  let formatted = ""
  let indent = ""
  const tab = "  "
  xml.split(/>\s*</).forEach((node) => {
    if (node.match(/^\/\w/)) indent = indent.substring(tab.length)
    formatted += indent + "<" + node + ">\n"
    if (node.match(/^<?\w[^>]*[^/]$/) && !node.startsWith("?")) indent += tab
  })
  return formatted.substring(1, formatted.length - 2)
}

export default function XmlFormatterPage() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")

  const format = () => {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(input, "text/xml")
      const errorNode = doc.querySelector("parsererror")
      if (errorNode) {
        setOutput("Error: Invalid XML\n" + errorNode.textContent)
        return
      }
      setOutput(formatXml(input))
    } catch {
      setOutput("Error formatting XML")
    }
  }

  const minify = () => {
    setOutput(input.replace(/>\s+</g, "><").trim())
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">XML Formatter</h1>
      <p className="text-muted-foreground text-sm">Format or minify XML documents.</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Input</CardTitle></CardHeader>
          <CardContent>
            <Textarea className="min-h-[300px] font-mono text-sm" placeholder="<root><item/></root>" value={input} onChange={(e) => setInput(e.target.value)} />
            <div className="mt-3 flex gap-2">
              <Button onClick={format} size="sm">Format</Button>
              <Button onClick={minify} variant="secondary" size="sm">Minify</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Output</CardTitle>
            {output && <CopyButton text={output} />}
          </CardHeader>
          <CardContent>
            <Textarea className="min-h-[300px] font-mono text-sm" value={output} readOnly placeholder="Formatted XML will appear here" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
