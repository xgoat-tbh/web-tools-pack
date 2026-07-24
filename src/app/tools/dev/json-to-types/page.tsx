"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CopyButton } from "@/components/copy-button"
import { JsonLd } from "@/components/json-ld"
import { allTools } from "@/lib/tools-config"
import { FileCode, Sparkles, AlertCircle } from "lucide-react"

const currentTool = allTools.find((t) => t.slug === "json-to-types")!

const DEFAULT_JSON = `{
  "id": 101,
  "title": "ToolHex Dashboard",
  "is_published": true,
  "rating": 4.9,
  "tags": ["developer", "privacy", "fast"],
  "author": {
    "name": "Dev",
    "email": "dev@toolhex.app"
  }
}`

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function toCamelCase(s: string) {
  return s.replace(/([-_][a-z])/gi, ($1) => $1.toUpperCase().replace("-", "").replace("_", ""))
}

function toPascalCase(s: string) {
  const camel = toCamelCase(s)
  return camel.charAt(0).toUpperCase() + camel.slice(1)
}

function getTypeScriptType(val: any, name = "Root"): { code: string; extraTypes: string[] } {
  const extraTypes: string[] = []

  function getType(v: any, propName: string): string {
    if (v === null) return "any"
    if (Array.isArray(v)) {
      if (v.length === 0) return "any[]"
      const firstType = getType(v[0], propName)
      return `${firstType}[]`
    }
    if (typeof v === "object") {
      const typeName = toPascalCase(propName)
      const lines: string[] = [`export interface ${typeName} {`]
      for (const [k, val] of Object.entries(v)) {
        lines.push(`  ${k}: ${getType(val, k)};`)
      }
      lines.push("}")
      extraTypes.push(lines.join("\n"))
      return typeName
    }
    return typeof v
  }

  const rootType = getType(val, name)
  return {
    code: extraTypes.join("\n\n"),
    extraTypes,
  }
}

function getGoStruct(val: any, name = "Root"): string {
  const structs: string[] = []

  function buildStruct(v: any, structName: string): string {
    if (typeof v !== "object" || v === null || Array.isArray(v)) return ""
    const lines: string[] = [`type ${structName} struct {`]
    for (const [k, val] of Object.entries(v)) {
      const fieldName = toPascalCase(k)
      let fieldType = "interface{}"
      if (typeof val === "string") fieldType = "string"
      else if (typeof val === "boolean") fieldType = "bool"
      else if (typeof val === "number") fieldType = Number.isInteger(val) ? "int" : "float64"
      else if (Array.isArray(val)) {
        if (val.length > 0 && typeof val[0] === "string") fieldType = "[]string"
        else if (val.length > 0 && typeof val[0] === "number") fieldType = Number.isInteger(val[0]) ? "[]int" : "[]float64"
        else fieldType = "[]interface{}"
      } else if (typeof val === "object" && val !== null) {
        const subName = toPascalCase(k)
        buildStruct(val, subName)
        fieldType = subName
      }
      lines.push(`\t${fieldName} ${fieldType} \`json:"${k}"\``)
    }
    lines.push("}")
    structs.push(lines.join("\n"))
    return structName
  }

  buildStruct(val, name)
  return structs.reverse().join("\n\n")
}

function getPythonTypedDict(val: any, name = "Root"): string {
  const dicts: string[] = []

  function buildDict(v: any, dictName: string): string {
    if (typeof v !== "object" || v === null || Array.isArray(v)) return ""
    const lines: string[] = [`class ${dictName}(TypedDict):`]
    let hasKeys = false
    for (const [k, val] of Object.entries(v)) {
      hasKeys = true
      let pyType = "Any"
      if (typeof val === "string") pyType = "str"
      else if (typeof val === "boolean") pyType = "bool"
      else if (typeof val === "number") pyType = Number.isInteger(val) ? "int" : "float"
      else if (Array.isArray(val)) {
        if (val.length > 0 && typeof val[0] === "string") pyType = "List[str]"
        else if (val.length > 0 && typeof val[0] === "number") pyType = "List[int]"
        else pyType = "List[Any]"
      } else if (typeof val === "object" && val !== null) {
        const subName = toPascalCase(k)
        buildDict(val, subName)
        pyType = subName
      }
      lines.push(`    ${k}: ${pyType}`)
    }
    if (!hasKeys) lines.push("    pass")
    dicts.push(lines.join("\n"))
    return dictName
  }

  buildDict(val, name)
  return "from typing import TypedDict, List, Any\n\n" + dicts.reverse().join("\n\n")
}

function getRustStruct(val: any, name = "Root"): string {
  const structs: string[] = []

  function buildRust(v: any, structName: string): string {
    if (typeof v !== "object" || v === null || Array.isArray(v)) return ""
    const lines: string[] = [
      "#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]",
      `pub struct ${structName} {`,
    ]
    for (const [k, val] of Object.entries(v)) {
      const fieldName = k.replace(/([A-Z])/g, "_$1").toLowerCase()
      let fieldType = "serde_json::Value"
      if (typeof val === "string") fieldType = "String"
      else if (typeof val === "boolean") fieldType = "bool"
      else if (typeof val === "number") fieldType = Number.isInteger(val) ? "i64" : "f64"
      else if (Array.isArray(val)) {
        if (val.length > 0 && typeof val[0] === "string") fieldType = "Vec<String>"
        else if (val.length > 0 && typeof val[0] === "number") fieldType = Number.isInteger(val[0]) ? "Vec<i64>" : "Vec<f64>"
        else fieldType = "Vec<serde_json::Value>"
      } else if (typeof val === "object" && val !== null) {
        const subName = toPascalCase(k)
        buildRust(val, subName)
        fieldType = subName
      }
      if (fieldName !== k) {
        lines.push(`    #[serde(rename = "${k}")]`)
      }
      lines.push(`    pub ${fieldName}: ${fieldType},`)
    }
    lines.push("}")
    structs.push(lines.join("\n"))
    return structName
  }

  buildRust(val, name)
  return "use serde::{Deserialize, Serialize};\n\n" + structs.reverse().join("\n\n")
}

export default function JsonToTypesPage() {
  const [jsonInput, setJsonInput] = useState(DEFAULT_JSON)
  const [targetLang, setTargetLang] = useState<"ts" | "go" | "python" | "rust">("ts")

  const { output, error } = useMemo(() => {
    try {
      if (!jsonInput.trim()) return { output: "", error: null }
      const parsed = JSON.parse(jsonInput)
      let res = ""
      if (targetLang === "ts") res = getTypeScriptType(parsed).code
      else if (targetLang === "go") res = getGoStruct(parsed)
      else if (targetLang === "python") res = getPythonTypedDict(parsed)
      else if (targetLang === "rust") res = getRustStruct(parsed)
      return { output: res, error: null }
    } catch (err: any) {
      return { output: "", error: err.message || "Invalid JSON input" }
    }
  }, [jsonInput, targetLang])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {currentTool && <JsonLd tool={currentTool} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <FileCode className="h-6 w-6 text-primary" />
            JSON to Code / Types Converter
          </h1>
          <p className="text-sm text-muted-foreground">
            Instantly convert raw JSON objects into TypeScript Interfaces, Go Structs, Python TypedDicts, or Rust Structs.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Input */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">JSON Input</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setJsonInput(DEFAULT_JSON)}
              className="gap-1.5 text-xs"
            >
              <Sparkles className="h-3.5 w-3.5" /> Load Example
            </Button>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-3">
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste your JSON here..."
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
                <TabsTrigger value="ts">TypeScript</TabsTrigger>
                <TabsTrigger value="go">Go</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="rust">Rust</TabsTrigger>
              </TabsList>
            </Tabs>
            {output && <CopyButton text={output} />}
          </CardHeader>
          <CardContent className="flex-1">
            <pre className="h-full min-h-[360px] overflow-auto rounded-lg bg-muted/60 p-4 font-mono text-xs text-foreground border">
              <code>{output || "// Output code will appear here..."}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
