"use client"

import { useEffect, useRef, useState } from "react"
import { Heart, Sparkles, Coffee, Star, Zap, Gift, Users, Crown, TrendingUp, Globe, ArrowRight, Github, MapPin } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { donations } from "@/lib/donations"

type Region = "india" | "international" | "loading"

const UPI_ID = "namanbruh@fam"

// Floating particle component
function FloatingParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="animate-float absolute rounded-full opacity-20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${4 + Math.random() * 8}px`,
            height: `${4 + Math.random() * 8}px`,
            background: `hsl(${200 + Math.random() * 160}, 80%, 60%)`,
            animationDelay: `${Math.random() * 6}s`,
            animationDuration: `${4 + Math.random() * 8}s`,
          }}
        />
      ))}
    </div>
  )
}

// Animated heart burst
function HeartBurst({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {Array.from({ length: 12 }).map((_, i) => (
        <Heart
          key={i}
          className="animate-heart-burst absolute h-6 w-6 text-pink-500"
          style={{
            "--angle": `${(i * 360) / 12}deg`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

export default function DonatePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrReady, setQrReady] = useState(false)
  const [showHearts, setShowHearts] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [region, setRegion] = useState<Region>("loading")
  const [detectedCountry, setDetectedCountry] = useState<string>("")

  // Detect visitor region via free IP geolocation
  useEffect(() => {
    const detect = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) })
        const data = await res.json()
        const country = (data.country_code || "").toUpperCase()
        setDetectedCountry(data.country_name || country)
        setRegion(country === "IN" ? "india" : "international")
      } catch {
        // On failure (blocked, timeout, etc.), default to showing both via india
        setRegion("india")
      }
    }
    detect()
  }, [])

  const isIndia = region === "india"
  const isInternational = region === "international"

  // Generate QR code
  const generateQR = async (amount?: number) => {
    const QRCode = (await import("qrcode")).default
    const canvas = canvasRef.current
    if (!canvas) return

    let upiURL = `upi://pay?pa=${UPI_ID}&pn=WebToolsPack&cu=INR`
    if (amount) upiURL += `&am=${amount}`

    await QRCode.toCanvas(canvas, upiURL, {
      width: 280,
      margin: 2,
      color: {
        dark: "#ffffff",
        light: "#00000000",
      },
      errorCorrectionLevel: "H",
    })
    setQrReady(true)
  }

  useEffect(() => {
    if (isIndia) generateQR()
  }, [region])

  const amounts = [49, 99, 199, 499, 999]

  return (
    <div className="relative mx-auto max-w-4xl">
      <FloatingParticles />

      {/* Hero Section */}
      <div className="relative mb-12 text-center">
        <div className="animate-fade-in-up">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/10 px-4 py-1.5 text-sm text-pink-400">
            <Heart className="h-3.5 w-3.5 animate-pulse fill-pink-500" />
            Support the Project
          </div>
        </div>

        <h1 className="animate-fade-in-up animation-delay-100 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl md:text-6xl">
          {isInternational ? "Support Us" : "Buy Us a Coffee"}
        </h1>

        <p className="animate-fade-in-up animation-delay-200 mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
          {isInternational
            ? "Web Tools Pack is free for everyone, everywhere. Here's how you can help from abroad!"
            : "Web Tools Pack is free & open source. Your support keeps the tools running and motivates new features!"}
        </p>

        {/* Region indicator + manual toggle */}
        {region !== "loading" && (
          <div className="animate-fade-in-up animation-delay-250 mt-4 inline-flex items-center gap-2 rounded-full border border-border/40 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <MapPin className="h-3 w-3" />
            {detectedCountry ? `Detected: ${detectedCountry}` : isIndia ? "Showing: India" : "Showing: International"}
            <span className="text-border">|</span>
            <button
              onClick={() => setRegion(isIndia ? "international" : "india")}
              className="font-medium text-primary hover:underline"
            >
              {isIndia ? "Not in India?" : "In India? Switch to UPI"}
            </button>
          </div>
        )}

        {/* Animated icons row */}
        <div className="animate-fade-in-up animation-delay-300 mt-6 flex items-center justify-center gap-4">
          {[Coffee, Star, Zap, Gift, Sparkles].map((Icon, i) => (
            <div
              key={i}
              className="animate-bounce-slow rounded-xl border border-border/50 bg-card/50 p-3 backdrop-blur-sm"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>

      {/* ═══ INDIA: UPI Donation Area ═══ */}
      {isIndia && (
      <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-center">
        <Card
          className="animate-fade-in-up animation-delay-300 group relative overflow-hidden border-2 border-transparent bg-gradient-to-br from-card via-card to-card p-1 transition-all duration-500 hover:border-pink-500/30 hover:shadow-2xl hover:shadow-pink-500/10"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Gradient border glow */}
          <div className="absolute -inset-[1px] -z-10 rounded-lg bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-cyan-500/20 opacity-0 blur-sm transition-opacity duration-500 group-hover:opacity-100" />

          <div className="relative rounded-lg bg-card p-6 sm:p-8">
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />

            <div className="relative text-center">
              <p className="mb-1 text-sm font-medium text-muted-foreground">Scan to Pay via UPI</p>
              {selectedAmount && (
                <p className="mb-1 text-xs font-semibold text-pink-400 animate-fade-in-up">Amount: ₹{selectedAmount}</p>
              )}
              <div className="relative mx-auto mb-4 inline-block">
                {/* QR glow ring */}
                <div className={`absolute -inset-4 rounded-2xl bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-cyan-500/20 blur-xl transition-opacity duration-700 ${hovered ? "opacity-100" : "opacity-0"}`} />
                
                {/* QR Container */}
                <div className="relative rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 p-[3px]">
                  <div className="rounded-[9px] bg-gray-900 p-3">
                    <canvas
                      ref={canvasRef}
                      className={`transition-all duration-700 ${qrReady ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
                    />
                  </div>
                </div>

                {/* Loading skeleton */}
                {!qrReady && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-pink-500" />
                  </div>
                )}
              </div>

              {/* UPI action */}
              <div className="relative mb-4">
                <HeartBurst active={showHearts} />
                <p className="text-sm text-muted-foreground">
                  Scan the QR code with any UPI app to pay
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                Works with Google Pay, PhonePe, Paytm & all UPI apps
              </p>
            </div>
          </div>
        </Card>

        {/* Right side - amounts & message */}
        <div className="w-full max-w-sm space-y-6">
          {/* Quick amounts */}
          <div className="animate-fade-in-up animation-delay-400">
            <p className="mb-3 text-sm font-medium text-muted-foreground">Suggested amounts</p>
            <div className="grid grid-cols-3 gap-2">
              {amounts.map((amt, i) => (
                <button
                  key={amt}
                  onClick={() => {
                    setSelectedAmount(amt)
                    generateQR(amt)
                  }}
                  className={`animate-scale-in group relative overflow-hidden rounded-lg border px-3 py-3 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-pink-500/40 hover:shadow-lg hover:shadow-pink-500/10 ${
                    selectedAmount === amt
                      ? "border-pink-500/60 bg-pink-500/10 shadow-lg shadow-pink-500/10"
                      : "border-border/60 bg-card"
                  }`}
                  style={{ animationDelay: `${0.5 + i * 0.08}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-purple-500/0 transition-all duration-300 group-hover:from-pink-500/10 group-hover:to-purple-500/10" />
                  <span className="relative text-lg font-bold">₹{amt}</span>
                </button>
              ))}

              <button
                onClick={() => {
                  setSelectedAmount(null)
                  generateQR()
                }}
                className="animate-scale-in group relative overflow-hidden rounded-lg border border-dashed border-border/60 bg-card px-3 py-3 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-pink-500/40"
                style={{ animationDelay: "0.9s" }}
              >
                <span className="relative text-sm text-muted-foreground group-hover:text-pink-400">Any Amount</span>
              </button>
            </div>
          </div>

          {/* Perks */}
          <Card className="animate-fade-in-up animation-delay-500 border-border/50 bg-card/50 backdrop-blur">
            <div className="p-5 space-y-3">
              <h3 className="flex items-center gap-2 font-semibold">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                Why donate?
              </h3>
              {[
                "Keep 44+ tools free forever",
                "Fund new tool development",
                "Support indie open-source software",
                "Get a warm fuzzy feeling ❤️",
              ].map((perk, i) => (
                <div
                  key={i}
                  className="animate-fade-in-right flex items-start gap-2 text-sm text-muted-foreground"
                  style={{ animationDelay: `${0.7 + i * 0.1}s` }}
                >
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-pink-500 to-purple-500" />
                  {perk}
                </div>
              ))}
            </div>
          </Card>

          {/* Thank you */}
          <div className="animate-fade-in-up animation-delay-700 rounded-lg border border-border/50 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-cyan-500/5 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Every contribution, big or small, means the world to us.
            </p>
            <p className="mt-1 text-lg">🙏</p>
          </div>
        </div>
      </div>

      )}

      {/* ═══ INTERNATIONAL: Supporter Area ═══ */}
      {isInternational && (
      <>
      {/* International Supporters Section */}
      <div className="mt-2">
        <div className="animate-fade-in-up mb-6 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 text-sm text-cyan-400">
            <Globe className="h-3.5 w-3.5" />
            How You Can Help
          </div>
          <h2 className="text-2xl font-bold">Support Without Payment</h2>
          <p className="mt-2 max-w-md mx-auto text-sm text-muted-foreground">
            We don&apos;t accept international payments yet — but these actions mean just as much to us.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="animate-fade-in-up animation-delay-100 group border-border/50 bg-card/50 p-5 text-center transition-all duration-300 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5">
            <Star className="mx-auto mb-2 h-6 w-6 text-yellow-500 transition-transform duration-300 group-hover:scale-110" />
            <h3 className="font-semibold text-sm">Star on GitHub</h3>
            <p className="mt-1 text-xs text-muted-foreground">Stars help us get discovered and motivate development.</p>
            <a
              href="https://github.com/xgoat-tbh/web-tools-pack"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:border-yellow-500/40 hover:text-yellow-400"
            >
              <Github className="h-3.5 w-3.5" /> Star the Repo <ArrowRight className="h-3 w-3" />
            </a>
          </Card>

          <Card className="animate-fade-in-up animation-delay-200 group border-border/50 bg-card/50 p-5 text-center transition-all duration-300 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5">
            <Users className="mx-auto mb-2 h-6 w-6 text-blue-400 transition-transform duration-300 group-hover:scale-110" />
            <h3 className="font-semibold text-sm">Share with Friends</h3>
            <p className="mt-1 text-xs text-muted-foreground">Tell a friend, tweet about it, or post in a community.</p>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: "Web Tools Pack", text: "44+ free browser tools — no sign-up, no tracking!", url: "https://web-tools-pack.vercel.app" })
                } else {
                  navigator.clipboard.writeText("https://web-tools-pack.vercel.app")
                }
              }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:border-blue-500/40 hover:text-blue-400"
            >
              Share <ArrowRight className="h-3 w-3" />
            </button>
          </Card>

          <Card className="animate-fade-in-up animation-delay-300 group border-border/50 bg-card/50 p-5 text-center transition-all duration-300 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5">
            <Zap className="mx-auto mb-2 h-6 w-6 text-orange-400 transition-transform duration-300 group-hover:scale-110" />
            <h3 className="font-semibold text-sm">Contribute Code</h3>
            <p className="mt-1 text-xs text-muted-foreground">Found a bug? Have a tool idea? PRs and issues are always welcome.</p>
            <a
              href="https://github.com/xgoat-tbh/web-tools-pack/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:border-orange-500/40 hover:text-orange-400"
            >
              Open an Issue <ArrowRight className="h-3 w-3" />
            </a>
          </Card>
        </div>

        <div className="mt-4 rounded-lg border border-cyan-500/10 bg-cyan-500/5 p-3 text-center">
          <p className="text-xs text-muted-foreground">
            🌍 International donations (card, PayPal) will be enabled within the next few years. Stay tuned!
          </p>
        </div>
      </div>
      </>
      )}

      {/* Loading state */}
      {region === "loading" && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-pink-500" />
        </div>
      )}

      {/* Donation History / Wall of Love — shown for everyone */}
      <div className="mt-16">
        <div className="animate-fade-in-up mb-6 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-400">
            <Users className="h-3.5 w-3.5" />
            Wall of Love
          </div>
          <h2 className="text-2xl font-bold">Our Supporters</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {donations.length > 0
              ? `${donations.length} amazing ${donations.length === 1 ? "person has" : "people have"} supported this project`
              : "Be the first to support this project!"}
          </p>
        </div>

        {donations.length > 0 ? (
          <>
            {/* Stats bar */}
            <div className="animate-fade-in-up animation-delay-100 mb-6 grid grid-cols-3 gap-3">
              <Card className="border-border/50 bg-card/50 p-4 text-center backdrop-blur">
                <TrendingUp className="mx-auto mb-1 h-4 w-4 text-green-400" />
                <p className="text-xl font-bold">₹{donations.reduce((s, d) => s + d.amount, 0).toLocaleString("en-IN")}</p>
                <p className="text-[10px] text-muted-foreground">Total Raised</p>
              </Card>
              <Card className="border-border/50 bg-card/50 p-4 text-center backdrop-blur">
                <Heart className="mx-auto mb-1 h-4 w-4 text-pink-400" />
                <p className="text-xl font-bold">{donations.length}</p>
                <p className="text-[10px] text-muted-foreground">Donations</p>
              </Card>
              <Card className="border-border/50 bg-card/50 p-4 text-center backdrop-blur">
                <Crown className="mx-auto mb-1 h-4 w-4 text-yellow-400" />
                <p className="text-xl font-bold">₹{Math.max(...donations.map(d => d.amount)).toLocaleString("en-IN")}</p>
                <p className="text-[10px] text-muted-foreground">Top Donation</p>
              </Card>
            </div>

            {/* Donation list */}
            <div className="space-y-2">
              {donations.map((d, i) => (
                <Card
                  key={i}
                  className="animate-fade-in-up group border-border/50 bg-card/50 transition-all duration-300 hover:border-pink-500/30 hover:shadow-lg hover:shadow-pink-500/5"
                  style={{ animationDelay: `${0.15 + i * 0.06}s` }}
                >
                  <div className="flex items-center gap-4 p-4">
                    {/* Avatar */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-500 text-sm font-bold text-white">
                      {d.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{d.name}</span>
                        {d.amount >= 499 && <Crown className="h-3.5 w-3.5 text-yellow-500" />}
                      </div>
                      {d.message && (
                        <p className="truncate text-sm text-muted-foreground">"{d.message}"</p>
                      )}
                    </div>

                    {/* Amount & date */}
                    <div className="shrink-0 text-right">
                      <p className="font-bold text-green-400">₹{d.amount}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        ) : (
          /* Empty state */
          <Card className="animate-fade-in-up animation-delay-200 border-dashed border-border/60 bg-card/30">
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="mb-4 rounded-full bg-pink-500/10 p-4">
                <Heart className="h-8 w-8 text-pink-500/60" />
              </div>
              <h3 className="text-lg font-semibold">No donations yet</h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Be the first to support Web Tools Pack! Scan the QR code above or copy the UPI ID.
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Upcoming Tools — what your support funds */}
      <div className="mt-16 mb-8">
        <div className="animate-fade-in-up mb-6 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-1.5 text-sm text-green-400">
            <Zap className="h-3.5 w-3.5" />
            On the Roadmap
          </div>
          <h2 className="text-2xl font-bold">Tools We&apos;re Building Next</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your support helps us build these — tools for everyone, everywhere.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { emoji: "📝", name: "Resume Builder", desc: "Create professional resumes with templates — export to PDF" },
            { emoji: "🧮", name: "Invoice Generator", desc: "Generate invoices with logo, tax, and download as PDF" },
            { emoji: "🔤", name: "Font Previewer", desc: "Preview Google Fonts side-by-side with custom text" },
            { emoji: "📊", name: "JSON to CSV/Excel", desc: "Instantly convert JSON data to spreadsheet formats" },
            { emoji: "🎨", name: "SVG Editor", desc: "Create & edit SVGs visually in the browser" },
            { emoji: "🔗", name: "Link Shortener", desc: "Shorten URLs with QR codes and click tracking" },
            { emoji: "🌐", name: "DNS Lookup", desc: "Look up DNS records for any domain" },
            { emoji: "📸", name: "Screenshot to Code", desc: "Paste a screenshot, get HTML/CSS skeleton" },
            { emoji: "🗣️", name: "Text to Speech", desc: "Convert text to audio with multiple voices" },
            { emoji: "📅", name: "Cron Expression Builder", desc: "Build cron schedules with a visual editor" },
            { emoji: "🔒", name: "SSL Certificate Checker", desc: "Check SSL cert expiry and details for any site" },
            { emoji: "🖼️", name: "Favicon Generator", desc: "Generate favicons in all sizes from a single image" },
          ].map((tool, i) => (
            <div
              key={i}
              className="animate-fade-in-up flex items-start gap-3 rounded-lg border border-border/40 bg-card/30 p-3 transition-colors hover:border-green-500/20 hover:bg-green-500/5"
              style={{ animationDelay: `${0.1 + i * 0.05}s` }}
            >
              <span className="text-xl shrink-0">{tool.emoji}</span>
              <div>
                <h4 className="text-sm font-semibold">{tool.name}</h4>
                <p className="text-xs text-muted-foreground">{tool.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Have a tool idea? <a href="https://github.com/xgoat-tbh/web-tools-pack/issues" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-pink-400">Open an issue on GitHub</a> and we&apos;ll consider it!
          </p>
        </div>
      </div>
    </div>
  )
}
