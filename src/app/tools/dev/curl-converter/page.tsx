"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CopyButton } from "@/components/copy-button"
import { JsonLd } from "@/components/json-ld"
import { allTools } from "@/lib/tools-config"
import { Terminal, Sparkles, AlertCircle } from "lucide-react"

const currentTool = allTools.find((t) => t.slug === "curl-converter")!

const DEFAULT_CURL = `curl -X POST https://api.example.com/v1/users \\
  -H "Authorization: Bearer secret_token_123" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Alice", "role": "admin"}'`

interface ParsedCurl {
  method: string
  url: string
  headers: Record<string, string>
  body: string | null
}

function parseCurl(curlCmd: string): ParsedCurl {
  const clean = curlCmd.replace(/\\\n/g, " ").trim()
  let method = "GET"
  let url = ""
  const headers: Record<string, string> = {}
  let body: string | null = null

  // extract method
  const methodMatch = clean.match(/-X\s+([A-Z]+)/i) || clean.match(/--request\s+([A-Z]+)/i)
  if (methodMatch) method = methodMatch[1].toUpperCase()

  // extract headers
  const headerRegex = /(?:-H|--header)\s+["']?([^"']+)["']?/gi
  let match
  while ((match = headerRegex.exec(clean)) !== null) {
    const parts = match[1].split(":")
    if (parts.length >= 2) {
      const key = parts[0].trim()
      const val = parts.slice(1).join(":").trim()
      headers[key] = val
    }
  }

  // extract body (-d, --data, --data-raw)
  const bodyMatch = clean.match(/(?:-d|--data|--data-raw)\s+["'](.*?)["'](?:\s+|$)/s) ||
                    clean.match(/(?:-d|--data|--data-raw)\s+([^\s]+)/)
  if (bodyMatch) {
    body = bodyMatch[1]
    if (method === "GET") method = "POST"
  }

  // extract URL (first non-flag arg starting with http or just standalone string)
  const urlMatch = clean.match(/https?:\/\/[^\s"']+/i)
  if (urlMatch) {
    url = urlMatch[0]
  } else {
    // fallback search
    const tokens = clean.split(/\s+/).filter((t) => !t.startsWith("-") && t !== "curl")
    if (tokens.length > 0) url = tokens[0].replace(/['"]/g, "")
  }

  return { method, url, headers, body }
}

function generateFetch(parsed: ParsedCurl): string {
  const { method, url, headers, body } = parsed
  const opts: string[] = []
  if (method !== "GET") opts.push(`  method: "${method}",`)
  if (Object.keys(headers).length > 0) {
    opts.push(`  headers: ${JSON.stringify(headers, null, 4).replace(/\n/g, "\n  ")},`)
  }
  if (body) {
    opts.push(`  body: JSON.stringify(${body}),`)
  }

  return `const response = await fetch("${url || "https://api.example.com"}", {
${opts.join("\n")}
});
const data = await response.json();
console.log(data);`
}

function generateAxios(parsed: ParsedCurl): string {
  const { method, url, headers, body } = parsed
  const opts: string[] = []
  if (Object.keys(headers).length > 0) {
    opts.push(`    headers: ${JSON.stringify(headers, null, 6).replace(/\n/g, "\n    ")},`)
  }

  if (method.toLowerCase() === "get") {
    return `import axios from "axios";

const response = await axios.get("${url || "https://api.example.com"}"${opts.length ? `, {\n${opts.join("\n")}\n}` : ""});
console.log(response.data);`
  }

  return `import axios from "axios";

const response = await axios.${method.toLowerCase()}("${url || "https://api.example.com"}", ${body || "{}"}${opts.length ? `, {\n${opts.join("\n")}\n}` : ""});
console.log(response.data);`
}

function generatePython(parsed: ParsedCurl): string {
  const { method, url, headers, body } = parsed
  let code = `import requests\n\nurl = "${url || "https://api.example.com"}"\n`
  if (Object.keys(headers).length > 0) {
    code += `headers = ${JSON.stringify(headers, null, 4)}\n`
  }
  if (body) {
    code += `payload = ${body}\n`
  }
  code += `\nresponse = requests.${method.toLowerCase()}(url`
  if (Object.keys(headers).length > 0) code += `, headers=headers`
  if (body) code += `, json=payload`
  code += `)\nprint(response.json())`
  return code
}

function generateGo(parsed: ParsedCurl): string {
  const { method, url, headers, body } = parsed
  let bodyStr = "nil"
  let bodyInit = ""
  if (body) {
    bodyInit = `\tbodyData := []byte(\`${body}\`)\n`
    bodyStr = "bytes.NewBuffer(bodyData)"
  }

  let headerLines = ""
  for (const [k, v] of Object.entries(headers)) {
    headerLines += `\treq.Header.Set("${k}", "${v}")\n`
  }

  return `package main

import (
\t"fmt"
\t"io"
\t"net/http"
${body ? '\t"bytes"\n' : ""})

func main() {
${bodyInit}\treq, err := http.NewRequest("${method}", "${url || "https://api.example.com"}", ${bodyStr})
\tif err != nil {
\t\tpanic(err)
\t}
${headerLines}
\tclient := &http.Client{}
\tresp, err := client.Do(req)
\tif err != nil {
\t\tpanic(err)
\t}
\tdefer resp.Body.Close()

\tbody, _ := io.ReadAll(resp.Body)
\tfmt.Println(string(body))
}`
}

export default function CurlConverterPage() {
  const [curlInput, setCurlInput] = useState(DEFAULT_CURL)
  const [targetLang, setTargetLang] = useState<"fetch" | "axios" | "python" | "go">("fetch")

  const { output, error } = useMemo(() => {
    try {
      if (!curlInput.trim()) return { output: "", error: null }
      const parsed = parseCurl(curlInput)
      let res = ""
      if (targetLang === "fetch") res = generateFetch(parsed)
      else if (targetLang === "axios") res = generateAxios(parsed)
      else if (targetLang === "python") res = generatePython(parsed)
      else if (targetLang === "go") res = generateGo(parsed)
      return { output: res, error: null }
    } catch (err: any) {
      return { output: "", error: "Failed to parse cURL command" }
    }
  }, [curlInput, targetLang])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {currentTool && <JsonLd tool={currentTool} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Terminal className="h-6 w-6 text-primary" />
            cURL to Code Converter
          </h1>
          <p className="text-sm text-muted-foreground">
            Convert cURL command lines into executable JavaScript fetch(), Axios, Python requests, or Go http code.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Input */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">cURL Command Input</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurlInput(DEFAULT_CURL)}
              className="gap-1.5 text-xs"
            >
              <Sparkles className="h-3.5 w-3.5" /> Load Example
            </Button>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-3">
            <Textarea
              value={curlInput}
              onChange={(e) => setCurlInput(e.target.value)}
              placeholder="Paste curl command here..."
              className="flex-1 font-mono text-xs min-h-[360px] resize-y"
            />
            {error && (
              <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Output */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <Tabs value={targetLang} onValueChange={(v: any) => setTargetLang(v)}>
              <TabsList>
                <TabsTrigger value="fetch">Fetch API</TabsTrigger>
                <TabsTrigger value="axios">Axios</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="go">Go</TabsTrigger>
              </TabsList>
            </Tabs>
            {output && <CopyButton text={output} />}
          </CardHeader>
          <CardContent className="flex-1">
            <pre className="h-full min-h-[360px] overflow-auto rounded-lg bg-muted/60 p-4 font-mono text-xs text-foreground border">
              <code>{output || "// Converted code will appear here..."}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
