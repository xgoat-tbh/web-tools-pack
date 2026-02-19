"use client"

import { useEffect, useRef, useState } from "react"
import { Heart, Sparkles, Coffee, Star, Zap, Gift, Users, Crown, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { donations } from "@/lib/donations"

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
    generateQR()
  }, [])

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
          Buy Us a Coffee
        </h1>

        <p className="animate-fade-in-up animation-delay-200 mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
          Web Tools Pack is free & open source. Your support keeps the tools running and motivates new features!
        </p>

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

      {/* QR Code Card */}
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
                "Keep 31+ tools free forever",
                "Fund new tool development",
                "Support open-source software",
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

      {/* Donation History / Wall of Love */}
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
    </div>
  )
}
