import {
  Code, FileJson, FileText, Braces, Regex, GitCompare, Share2,
  Lock, Link, Key, Hash, Fingerprint,
  Calculator, Percent, Dice1, Clock, Globe, CalendarDays, Baby,
  Image, Maximize, FileImage, Palette, QrCode, EyeOff,
  Timer, StickyNote, Type, PenTool, CheckSquare,
  Swords,
  Laugh, Terminal, DollarSign, Ruler,
  Paintbrush, Square, Keyboard, Coins, ScanSearch, Languages,
} from "lucide-react"

export interface Tool {
  name: string
  slug: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  category: string
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
      { name: "JSON Formatter", slug: "json-formatter", description: "Format & validate JSON", icon: FileJson, category: "dev" },
      { name: "XML Formatter", slug: "xml-formatter", description: "Format XML documents", icon: Code, category: "dev" },
      { name: "Minifier / Beautifier", slug: "minifier", description: "Minify or beautify HTML/CSS/JS", icon: Braces, category: "dev" },
      { name: "Markdown Editor", slug: "markdown-editor", description: "Edit Markdown with live preview", icon: FileText, category: "dev" },
      { name: "Regex Tester", slug: "regex-tester", description: "Test regular expressions", icon: Regex, category: "dev" },
      { name: "Text Diff", slug: "text-diff", description: "Compare two texts", icon: GitCompare, category: "dev" },
      { name: "Code Snippet Sharer", slug: "code-snippet", description: "Share code snippets", icon: Share2, category: "dev" },
      { name: "Lorem Ipsum Generator", slug: "lorem-ipsum", description: "Generate placeholder text", icon: FileText, category: "dev" },
      { name: "Gradient Generator", slug: "gradient-generator", description: "Create CSS gradients visually", icon: Paintbrush, category: "dev" },
      { name: "CSS Shadow Generator", slug: "shadow-generator", description: "Build box-shadows visually", icon: Square, category: "dev" },
      { name: "Color Palette Generator", slug: "color-palette", description: "Generate harmonious palettes", icon: Palette, category: "dev" },
    ],
  },
  {
    name: "Encoding & Security",
    slug: "encoding",
    tools: [
      { name: "Base64 Encode/Decode", slug: "base64", description: "Encode or decode Base64", icon: Lock, category: "encoding" },
      { name: "URL Encoder/Decoder", slug: "url-encoder", description: "Encode or decode URLs", icon: Link, category: "encoding" },
      { name: "JWT Decoder", slug: "jwt-decoder", description: "Decode JSON Web Tokens", icon: Key, category: "encoding" },
      { name: "Hash Generator", slug: "hash-generator", description: "Generate SHA256, MD5 hashes", icon: Hash, category: "encoding" },
      { name: "UUID Generator", slug: "uuid-generator", description: "Generate UUIDs", icon: Fingerprint, category: "encoding" },
      { name: "Password Generator", slug: "password-generator", description: "Generate secure passwords", icon: Lock, category: "encoding" },
    ],
  },
  {
    name: "Data & Converters",
    slug: "data",
    tools: [
      { name: "Number Base Converter", slug: "base-converter", description: "Convert between binary, decimal, hex", icon: Calculator, category: "data" },
      { name: "Percentage Calculator", slug: "percentage-calc", description: "Calculate percentages", icon: Percent, category: "data" },
      { name: "Random Number Generator", slug: "random-number", description: "Generate random numbers", icon: Dice1, category: "data" },
      { name: "Timestamp Converter", slug: "timestamp", description: "Convert Unix timestamps", icon: Clock, category: "data" },
      { name: "Timezone Converter", slug: "timezone", description: "Convert between timezones", icon: Globe, category: "data" },
      { name: "Date Difference", slug: "date-diff", description: "Calculate difference between dates", icon: CalendarDays, category: "data" },
      { name: "Age Calculator", slug: "age-calculator", description: "Calculate age from birthdate", icon: Baby, category: "data" },
      { name: "Currency Converter", slug: "currency-converter", description: "Convert between currencies", icon: DollarSign, category: "data" },
      { name: "Unit Converter", slug: "unit-converter", description: "Convert length, weight, temp & more", icon: Ruler, category: "data" },
    ],
  },
  {
    name: "Media & Files",
    slug: "media",
    tools: [
      { name: "Image Compressor", slug: "image-compressor", description: "Compress images in-browser", icon: Image, category: "media" },
      { name: "Image Resizer", slug: "image-resizer", description: "Resize images", icon: Maximize, category: "media" },
      { name: "Image Converter", slug: "image-converter", description: "Convert PNG/JPG/WebP", icon: FileImage, category: "media" },
      { name: "Color Picker", slug: "color-picker", description: "Pick colors from image", icon: Palette, category: "media" },
      { name: "Blur / Pixelate", slug: "blur-pixelate", description: "Blur or pixelate images", icon: EyeOff, category: "media" },
      { name: "QR Code Generator", slug: "qr-generator", description: "Generate QR codes", icon: QrCode, category: "media" },
      { name: "Meme Generator", slug: "meme-generator", description: "Create memes with custom text", icon: Laugh, category: "media" },
      { name: "ASCII Art Generator", slug: "ascii-art", description: "Convert images to ASCII art", icon: Terminal, category: "media" },
    ],
  },
  {
    name: "Productivity",
    slug: "productivity",
    tools: [
      { name: "Pomodoro Timer", slug: "pomodoro", description: "Focus timer with intervals", icon: Timer, category: "productivity" },
      { name: "Sticky Notes", slug: "sticky-notes", description: "Quick notes with autosave", icon: StickyNote, category: "productivity" },
      { name: "Word Counter", slug: "word-counter", description: "Count words, chars, sentences", icon: Type, category: "productivity" },
      { name: "Focus Editor", slug: "focus-editor", description: "Distraction-free text editor", icon: PenTool, category: "productivity" },
      { name: "Checklist Generator", slug: "checklist", description: "Create and manage checklists", icon: CheckSquare, category: "productivity" },
      { name: "Typing Speed Test", slug: "typing-test", description: "Test your typing speed", icon: Keyboard, category: "productivity" },
      { name: "Stopwatch", slug: "stopwatch", description: "Precision stopwatch with laps", icon: Timer, category: "productivity" },
      { name: "Coin Flip & Dice", slug: "coin-dice", description: "Random decisions with style", icon: Coins, category: "productivity" },
      { name: "AI Content Detector", slug: "ai-detector", description: "Detect AI-generated text patterns", icon: ScanSearch, category: "productivity" },
      { name: "Translator", slug: "translator", description: "Translate text between 100+ languages", icon: Languages, category: "productivity" },
    ],
  },
  {
    name: "Valorant",
    slug: "valorant",
    tools: [
      { name: "Team Comp Suggester", slug: "team-comp", description: "Get balanced agent compositions", icon: Swords, category: "valorant" },
    ],
  },
]

export const allTools: Tool[] = categories.flatMap((c) => c.tools)
