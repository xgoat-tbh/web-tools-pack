"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CopyButton } from "@/components/copy-button"
import { JsonLd } from "@/components/json-ld"
import { allTools } from "@/lib/tools-config"
import { Share2, Globe, Twitter, Linkedin, Facebook, Search } from "lucide-react"

const currentTool = allTools.find((t) => t.slug === "og-previewer")!

export default function OgPreviewerPage() {
  const [url, setUrl] = useState("https://toolhex.vercel.app")
  const [title, setTitle] = useState("ToolHex - 50+ Privacy-First Developer Tools")
  const [description, setDescription] = useState("Format, convert, encode, generate, and test regular expressions client-side. Zero server uploads, 100% free.")
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=630&fit=crop")
  const [siteName, setSiteName] = useState("ToolHex")
  const [twitterUser, setTwitterUser] = useState("@toolhex")

  const [activeTab, setActiveTab] = useState<"twitter" | "linkedin" | "facebook" | "google">("twitter")

  const metaHtml = useMemo(() => {
    return `<!-- Primary Meta Tags -->
<title>${title}</title>
<meta name="title" content="${title}">
<meta name="description" content="${description}">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${imageUrl}">
<meta property="og:site_name" content="${siteName}">

<!-- Twitter / X -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="${url}">
<meta property="twitter:title" content="${title}">
<meta property="twitter:description" content="${description}">
<meta property="twitter:image" content="${imageUrl}">
<meta property="twitter:site" content="${twitterUser}">`
  }, [url, title, description, imageUrl, siteName, twitterUser])

  const domain = useMemo(() => {
    try {
      return new URL(url).hostname
    } catch {
      return "example.com"
    }
  }, [url])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {currentTool && <JsonLd tool={currentTool} />}

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Share2 className="h-6 w-6 text-primary" />
          Social Meta & Open Graph Previewer
        </h1>
        <p className="text-sm text-muted-foreground">
          Preview how your web page looks when shared on Twitter/X, LinkedIn, Facebook, and Google Search. Generate full meta tags.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Meta Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Meta Tag Properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Website URL</label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" className="mt-1 text-xs" />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">Title ({title.length}/60 chars)</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Page Title" className="mt-1 text-xs" />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">Description ({description.length}/160 chars)</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Page Description" className="mt-1 text-xs min-h-[80px]" />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">OG Image URL (1200 x 630 recommended)</label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/og-image.png" className="mt-1 text-xs" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Site Name</label>
                <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="ToolHex" className="mt-1 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Twitter Handle</label>
                <Input value={twitterUser} onChange={(e) => setTwitterUser(e.target.value)} placeholder="@handle" className="mt-1 text-xs" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Live Preview */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
              <TabsList>
                <TabsTrigger value="twitter" className="gap-1 text-xs"><Twitter className="h-3.5 w-3.5" /> Twitter</TabsTrigger>
                <TabsTrigger value="linkedin" className="gap-1 text-xs"><Linkedin className="h-3.5 w-3.5" /> LinkedIn</TabsTrigger>
                <TabsTrigger value="facebook" className="gap-1 text-xs"><Facebook className="h-3.5 w-3.5" /> Facebook</TabsTrigger>
                <TabsTrigger value="google" className="gap-1 text-xs"><Search className="h-3.5 w-3.5" /> Google</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center bg-muted/20 p-6">
            {/* Twitter Preview Card */}
            {activeTab === "twitter" && (
              <div className="mx-auto w-full max-w-sm rounded-2xl border bg-black text-white overflow-hidden shadow-xl font-sans">
                <div className="relative aspect-[1.91/1] w-full bg-neutral-900 overflow-hidden">
                  <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
                </div>
                <div className="p-3 bg-neutral-900/90">
                  <p className="text-xs text-neutral-400 font-normal">{domain}</p>
                  <p className="font-bold text-sm line-clamp-1 mt-0.5 text-white">{title}</p>
                  <p className="text-xs text-neutral-400 line-clamp-2 mt-1">{description}</p>
                </div>
              </div>
            )}

            {/* LinkedIn Preview Card */}
            {activeTab === "linkedin" && (
              <div className="mx-auto w-full max-w-sm rounded-lg border bg-white dark:bg-neutral-900 overflow-hidden shadow-md font-sans">
                <div className="relative aspect-[1.91/1] w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
                </div>
                <div className="p-3 border-t">
                  <p className="font-semibold text-sm line-clamp-1 text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{domain}</p>
                </div>
              </div>
            )}

            {/* Facebook Preview Card */}
            {activeTab === "facebook" && (
              <div className="mx-auto w-full max-w-sm border bg-[#f0f2f5] dark:bg-neutral-900 overflow-hidden shadow-sm font-sans">
                <div className="relative aspect-[1.91/1] w-full bg-neutral-200 overflow-hidden">
                  <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
                </div>
                <div className="p-2.5 bg-[#f2f3f5] dark:bg-neutral-800 border-t">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{domain}</p>
                  <p className="font-bold text-sm line-clamp-1 mt-0.5 text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{description}</p>
                </div>
              </div>
            )}

            {/* Google SERP Snippet Preview */}
            {activeTab === "google" && (
              <div className="mx-auto w-full max-w-md rounded-lg border bg-white dark:bg-neutral-900 p-4 shadow-sm font-sans space-y-1">
                <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                  <Globe className="h-3.5 w-3.5" />
                  <span className="truncate">{url}</span>
                </div>
                <h3 className="text-base text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer line-clamp-1">
                  {title}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                  {description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Generated Meta Tags Code Block */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Generated HTML Meta Tags</CardTitle>
          <CopyButton text={metaHtml} />
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded-lg bg-muted/60 p-4 font-mono text-xs text-foreground border max-h-64">
            <code>{metaHtml}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
