import {
  Code, FileJson, FileText, Braces, Regex, GitCompare, Share2,
  Lock, Link, Key, Hash, Fingerprint,
  Calculator, Percent, Dice1, Clock, Globe, CalendarDays, Baby,
  Image, Maximize, FileImage, Palette, QrCode, EyeOff,
  Timer, StickyNote, Type, PenTool, CheckSquare,
  Laugh, Terminal, DollarSign, Ruler,
  Paintbrush, Square, Keyboard, Coins, Languages,
  Mouse, Monitor, Zap, Wifi, Network, FileCode, Video,
} from "lucide-react"

export interface Tool {
  name: string
  slug: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  category: string
  keywords?: string[]
}

export interface Category {
  name: string
  slug: string
  tools: Tool[]
}

export const categories: Category[] = [
  {
    name: "Dev Tools",
    slug: "dev",
    tools: [
      { name: "JSON Formatter", slug: "json-formatter", description: "Format & validate JSON", icon: FileJson, category: "dev", keywords: ["json", "formatter", "beautifier", "validator"] },
      { name: "JSON to Code / Types", slug: "json-to-types", description: "Convert JSON to TS, Go, Rust & Python", icon: FileCode, category: "dev", keywords: ["typescript", "struct", "convert", "json to ts"] },
      { name: "cURL Converter", slug: "curl-converter", description: "Convert cURL to Fetch, Axios & Python", icon: Terminal, category: "dev", keywords: ["curl", "fetch", "axios", "python", "http"] },
      { name: "Cron Parser & Builder", slug: "cron-parser", description: "Parse and visually build crontab expressions", icon: Clock, category: "dev", keywords: ["cron", "crontab", "parser", "schedule"] },
      { name: "Social Meta & OG Preview", slug: "og-previewer", description: "Preview OpenGraph cards & generate meta tags", icon: Share2, category: "dev", keywords: ["opengraph", "meta tags", "twitter card", "preview"] },
      { name: "XML Formatter", slug: "xml-formatter", description: "Format XML documents", icon: Code, category: "dev", keywords: ["xml", "pretty print", "formatter"] },
      { name: "Minifier / Beautifier", slug: "minifier", description: "Minify or beautify HTML/CSS/JS", icon: Braces, category: "dev", keywords: ["minify", "beautify", "html", "css", "javascript"] },
      { name: "Markdown Editor", slug: "markdown-editor", description: "Edit Markdown with live preview", icon: FileText, category: "dev", keywords: ["markdown", "gfm", "editor", "preview"] },
      { name: "Regex Tester", slug: "regex-tester", description: "Test regular expressions", icon: Regex, category: "dev", keywords: ["regex", "regexp", "pattern", "matcher"] },
      { name: "Text Diff", slug: "text-diff", description: "Compare two texts", icon: GitCompare, category: "dev", keywords: ["diff", "compare", "text difference"] },
      { name: "Code Snippet Sharer", slug: "code-snippet", description: "Share code snippets", icon: Share2, category: "dev", keywords: ["snippet", "share code", "gist"] },
      { name: "Lorem Ipsum Generator", slug: "lorem-ipsum", description: "Generate placeholder text", icon: FileText, category: "dev", keywords: ["lorem", "ipsum", "placeholder", "text"] },
      { name: "Gradient Generator", slug: "gradient-generator", description: "Create CSS gradients visually", icon: Paintbrush, category: "dev", keywords: ["css", "gradient", "background"] },
      { name: "CSS Shadow Generator", slug: "shadow-generator", description: "Build box-shadows visually", icon: Square, category: "dev", keywords: ["css", "box-shadow", "generator"] },
      { name: "Color Palette Generator", slug: "color-palette", description: "Generate harmonious palettes", icon: Palette, category: "dev", keywords: ["colors", "palette", "hex", "rgb"] },
    ],
  },
  {
    name: "Encoding & Security",
    slug: "encoding",
    tools: [
      { name: "Base64 Encode/Decode", slug: "base64", description: "Encode or decode Base64", icon: Lock, category: "encoding", keywords: ["base64", "encoder", "decoder"] },
      { name: "URL Encoder/Decoder", slug: "url-encoder", description: "Encode or decode URLs", icon: Link, category: "encoding", keywords: ["url", "uri", "encode", "decode"] },
      { name: "JWT Decoder", slug: "jwt-decoder", description: "Decode JSON Web Tokens", icon: Key, category: "encoding", keywords: ["jwt", "token", "decoder", "auth"] },
      { name: "Hash Generator", slug: "hash-generator", description: "Generate SHA256, MD5 hashes", icon: Hash, category: "encoding", keywords: ["sha256", "md5", "hash", "crypto"] },
      { name: "UUID Generator", slug: "uuid-generator", description: "Generate UUIDs", icon: Fingerprint, category: "encoding", keywords: ["uuid", "guid", "v4", "random"] },
      { name: "Password Generator", slug: "password-generator", description: "Generate secure passwords", icon: Lock, category: "encoding", keywords: ["password", "secure", "random"] },
    ],
  },
  {
    name: "Data & Converters",
    slug: "data",
    tools: [
      { name: "Subnet / CIDR Calculator", slug: "cidr-calculator", description: "Calculate IP subnet ranges, masks & broadcast", icon: Network, category: "data", keywords: ["cidr", "subnet", "ip address", "netmask"] },
      { name: "Number Base Converter", slug: "base-converter", description: "Convert between binary, decimal, hex", icon: Calculator, category: "data", keywords: ["binary", "decimal", "hex", "base"] },
      { name: "Percentage Calculator", slug: "percentage-calc", description: "Calculate percentages", icon: Percent, category: "data", keywords: ["percentage", "calculator", "ratio"] },
      { name: "Random Number Generator", slug: "random-number", description: "Generate random numbers", icon: Dice1, category: "data", keywords: ["random", "number", "range"] },
      { name: "Timestamp Converter", slug: "timestamp", description: "Convert Unix timestamps", icon: Clock, category: "data", keywords: ["unix", "epoch", "timestamp", "iso8601"] },
      { name: "Timezone Converter", slug: "timezone", description: "Convert between timezones", icon: Globe, category: "data", keywords: ["timezone", "utc", "gmt", "clock"] },
      { name: "Date Difference", slug: "date-diff", description: "Calculate difference between dates", icon: CalendarDays, category: "data", keywords: ["date", "difference", "days", "months"] },
      { name: "Age Calculator", slug: "age-calculator", description: "Calculate age from birthdate", icon: Baby, category: "data", keywords: ["age", "birthday", "days old"] },
      { name: "Currency Converter", slug: "currency-converter", description: "Convert between currencies", icon: DollarSign, category: "data", keywords: ["currency", "forex", "exchange rate"] },
      { name: "Unit Converter", slug: "unit-converter", description: "Convert length, weight, temp & more", icon: Ruler, category: "data", keywords: ["units", "convert", "length", "temperature"] },
    ],
  },
  {
    name: "Media & Files",
    slug: "media",
    tools: [
      { name: "Universal Video Downloader", slug: "video-downloader", description: "Download videos & audio from YouTube, Instagram, TikTok & Twitter", icon: Video, category: "media", keywords: ["video downloader", "youtube download", "instagram reel", "tiktok", "mp4", "mp3"] },
      { name: "Image Compressor", slug: "image-compressor", description: "Compress images in-browser", icon: Image, category: "media", keywords: ["compress", "image", "png", "jpg", "webp"] },
      { name: "Image Resizer", slug: "image-resizer", description: "Resize images", icon: Maximize, category: "media", keywords: ["resize", "dimensions", "width", "height"] },
      { name: "Image Converter", slug: "image-converter", description: "Convert PNG/JPG/WebP", icon: FileImage, category: "media", keywords: ["convert", "png", "jpg", "webp"] },
      { name: "Color Picker", slug: "color-picker", description: "Pick colors from image", icon: Palette, category: "media", keywords: ["color", "eyedropper", "hex"] },
      { name: "Blur / Pixelate", slug: "blur-pixelate", description: "Blur or pixelate images", icon: EyeOff, category: "media", keywords: ["blur", "pixelate", "mosaic", "redact"] },
      { name: "QR Code Generator", slug: "qr-generator", description: "Generate QR codes", icon: QrCode, category: "media", keywords: ["qr code", "barcode", "generator"] },
      { name: "Meme Generator", slug: "meme-generator", description: "Create memes with custom text", icon: Laugh, category: "media", keywords: ["meme", "generator", "caption"] },
      { name: "ASCII Art Generator", slug: "ascii-art", description: "Convert images to ASCII art", icon: Terminal, category: "media", keywords: ["ascii", "art", "text image"] },
    ],
  },
  {
    name: "Productivity",
    slug: "productivity",
    tools: [
      { name: "Pomodoro Timer", slug: "pomodoro", description: "Focus timer with intervals", icon: Timer, category: "productivity", keywords: ["pomodoro", "timer", "focus", "work"] },
      { name: "Sticky Notes", slug: "sticky-notes", description: "Quick notes with autosave", icon: StickyNote, category: "productivity", keywords: ["notes", "sticky", "todo"] },
      { name: "Word Counter", slug: "word-counter", description: "Count words, chars, sentences", icon: Type, category: "productivity", keywords: ["word count", "character count", "stats"] },
      { name: "Focus Editor", slug: "focus-editor", description: "Distraction-free text editor", icon: PenTool, category: "productivity", keywords: ["editor", "writing", "focus"] },
      { name: "Checklist Generator", slug: "checklist", description: "Create and manage checklists", icon: CheckSquare, category: "productivity", keywords: ["checklist", "tasks", "todo"] },
      { name: "Typing Speed Test", slug: "typing-test", description: "Test your typing speed", icon: Keyboard, category: "productivity", keywords: ["typing", "wpm", "speed test"] },
      { name: "Stopwatch", slug: "stopwatch", description: "Precision stopwatch with laps", icon: Timer, category: "productivity", keywords: ["stopwatch", "timer", "laps"] },
      { name: "Coin Flip & Dice", slug: "coin-dice", description: "Random decisions with style", icon: Coins, category: "productivity", keywords: ["coin flip", "dice roll", "random"] },
      { name: "Translator", slug: "translator", description: "Translate text between 100+ languages", icon: Languages, category: "productivity", keywords: ["translate", "language", "dictionary"] },
    ],
  },
  {
    name: "Benchmarks",
    slug: "benchmarks",
    tools: [
      { name: "CPS Benchmark", slug: "cps-test", description: "Test your clicks per second", icon: Mouse, category: "benchmarks", keywords: ["cps", "click speed", "benchmark"] },
      { name: "Reaction Time Test", slug: "reaction-test", description: "Test your reaction speed", icon: Zap, category: "benchmarks", keywords: ["reaction", "speed", "test"] },
      { name: "Keyboard Key Checker", slug: "keyboard-test", description: "Check if all your keys work", icon: Keyboard, category: "benchmarks", keywords: ["keyboard", "key test", "hardware"] },
      { name: "Browser Performance", slug: "browser-perf", description: "Stress-test your browser rendering", icon: Monitor, category: "benchmarks", keywords: ["fps", "browser", "performance", "stress test"] },
      { name: "Network Speed Check", slug: "network-speed", description: "Test your internet speed", icon: Wifi, category: "benchmarks", keywords: ["speedtest", "ping", "download", "bandwidth"] },
    ],
  },
]

export const allTools: Tool[] = categories.flatMap((c) => c.tools)
