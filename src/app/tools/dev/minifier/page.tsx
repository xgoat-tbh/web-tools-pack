"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/copy-button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function minifyCSS(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/\s*([{}:;,])\s*/g, "$1").trim()
}

function minifyJS(js: string): string {
  return js.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").trim()
}

function minifyHTML(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, "").replace(/\s+/g, " ").replace(/>\s+</g, "><").trim()
}

function beautifyCSS(css: string): string {
  let indent = 0
  return css.replace(/\s*([{}:;,])\s*/g, "$1").replace(/([{;])/g, (m) => {
    if (m === "{") { indent++; return " {\n" + "  ".repeat(indent) }
    return ";\n" + "  ".repeat(indent)
  }).replace(/}/g, () => { indent = Math.max(0, indent - 1); return "\n" + "  ".repeat(indent) + "}" })
}

export default function MinifierPage() {
  const [lang, setLang] = useState("html")
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")

  const doMinify = () => {
    if (lang === "css") setOutput(minifyCSS(input))
    else if (lang === "js") setOutput(minifyJS(input))
    else setOutput(minifyHTML(input))
  }

  const doBeautify = () => {
    if (lang === "css") setOutput(beautifyCSS(input))
    else if (lang === "html") {
      // simple HTML beautify
      let indent = 0
      const result = input.replace(/>\s*</g, ">\n<").split("\n").map((line) => {
        const trimmed = line.trim()
        if (trimmed.startsWith("</")) indent = Math.max(0, indent - 1)
        const indented = "  ".repeat(indent) + trimmed
        if (trimmed.startsWith("<") && !trimmed.startsWith("</") && !trimmed.endsWith("/>") && !trimmed.includes("</")) indent++
        return indented
      }).join("\n")
      setOutput(result)
    } else {
      // basic JS beautify - add newlines
      setOutput(input.replace(/;/g, ";\n").replace(/{/g, "{\n").replace(/}/g, "\n}\n"))
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Minifier / Beautifier</h1>
      <p className="text-muted-foreground text-sm">Minify or beautify HTML, CSS, and JavaScript.</p>

      <Tabs value={lang} onValueChange={setLang}>
        <TabsList><TabsTrigger value="html">HTML</TabsTrigger><TabsTrigger value="css">CSS</TabsTrigger><TabsTrigger value="js">JavaScript</TabsTrigger></TabsList>
      </Tabs>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Input</CardTitle></CardHeader>
          <CardContent>
            <Textarea className="min-h-[300px] font-mono text-sm" placeholder={`Paste your ${lang.toUpperCase()} here...`} value={input} onChange={(e) => setInput(e.target.value)} />
            <div className="mt-3 flex gap-2">
              <Button onClick={doMinify} size="sm">Minify</Button>
              <Button onClick={doBeautify} variant="secondary" size="sm">Beautify</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Output</CardTitle>
            {output && <CopyButton text={output} />}
          </CardHeader>
          <CardContent>
            <Textarea className="min-h-[300px] font-mono text-sm" value={output} readOnly />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
