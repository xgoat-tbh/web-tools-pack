<div align="center">

# 🛠️ Web Tools Pack

### 44 free tools. One dashboard. Zero data collection.

Stop bouncing between 20 different websites — format, convert, encode, generate, and more, all from a single tab.

<br/>

**[🌐 Use it now → web-tools-pack.vercel.app](https://web-tools-pack.vercel.app)**

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-Source_Available-orange.svg)](LICENSE)

</div>

> **⚠️ Not for redeployment.** This project is source-available for learning, contribution, and personal use — **not** for hosting your own copy. See [License](#-license) for details.

---

## 🖥️ Try It

Head over to **[web-tools-pack.vercel.app](https://web-tools-pack.vercel.app)** — no sign-up, no tracking, works on any device.

Everything runs **100% in your browser**. Your files and data never leave your machine.

---

## ✨ Highlights

| | |
|---|---|
| 🧰 **44 tools** across 6 categories | 🛡️ **Privacy first** — nothing is uploaded, ever |
| 🌗 **Dark & light mode** with smooth transitions | ⌨️ **Command palette** — press `Ctrl+K` to jump anywhere |
| 📱 **Responsive** — works on desktop, tablet, mobile | ⚡ **Fast** — static pages, code-split, tiny bundles |
| 🖱️ **Drag & drop** everywhere — images, files, you name it | 📋 **Copy to clipboard** on every output |

---

## 📦 All 44 Tools

### 🔧 Dev Tools

| Tool | What it does |
|------|-------------|
| **JSON Formatter** | Format, validate, and minify JSON |
| **XML Formatter** | Pretty-print or minify XML |
| **Minifier / Beautifier** | Minify or beautify HTML, CSS, JS |
| **Markdown Editor** | Write Markdown with real-time preview (GFM) |
| **Regex Tester** | Test patterns, see matches & captured groups |
| **Text Diff** | Side-by-side text comparison |
| **Code Snippet Sharer** | Shareable code snippets via URL |
| **Lorem Ipsum Generator** | Generate placeholder text for designs |
| **Gradient Generator** | Create CSS gradients visually |
| **CSS Shadow Generator** | Build box-shadows with a visual editor |
| **Color Palette Generator** | Generate harmonious color palettes |

### 🔐 Encoding & Security

| Tool | What it does |
|------|-------------|
| **Base64 Encode/Decode** | Text ↔ Base64 |
| **URL Encoder/Decoder** | Encode / decode URI components |
| **JWT Decoder** | Inspect JWT header & payload |
| **Hash Generator** | SHA-256 · SHA-384 · SHA-512 · SHA-1 · MD5 |
| **UUID Generator** | Bulk-generate v4 UUIDs |
| **Password Generator** | Generate secure, customizable passwords |

### 📊 Data & Converters

| Tool | What it does |
|------|-------------|
| **Number Base Converter** | Bin ↔ Dec ↔ Hex ↔ Oct |
| **Percentage Calculator** | Three-mode percentage solver |
| **Random Number Generator** | Custom range & batch generation |
| **Timestamp Converter** | Unix ↔ ISO 8601 ↔ human-readable |
| **Timezone Converter** | See any time across 17 timezones |
| **Date Difference** | Years, months, days, hours between dates |
| **Age Calculator** | Exact age + days until birthday |
| **Currency Converter** | 20 currencies with live exchange rates |
| **Unit Converter** | Length, weight, temp, speed, area, volume, data, time |

### 🖼️ Media & Files

| Tool | What it does |
|------|-------------|
| **Image Compressor** | Compress with quality slider & size stats |
| **Image Resizer** | Resize with aspect ratio lock |
| **Image Converter** | PNG ↔ JPEG ↔ WebP |
| **Color Picker** | Extract colors from any image pixel |
| **Blur / Pixelate** | Apply blur or mosaic effects |
| **QR Code Generator** | Downloadable QR codes from text/URLs |
| **Meme Generator** | Drop an image, add top/bottom text, done |
| **ASCII Art Generator** | Image → ASCII or Text → ASCII art |

### ⏱️ Productivity

| Tool | What it does |
|------|-------------|
| **Pomodoro Timer** | Focus/break intervals with audio alert |
| **Sticky Notes** | Persistent notes (auto-saves locally) |
| **Word Counter** | Words, chars, sentences, paragraphs, read time |
| **Focus Editor** | Distraction-free fullscreen writing |
| **Checklist Generator** | Create and manage task lists |
| **Typing Speed Test** | Test your WPM with real-time stats |
| **Stopwatch** | Precision stopwatch with lap times |
| **Coin Flip & Dice** | Random decisions with animated coin & dice |
| **AI Content Detector** | Detect AI-generated text patterns |

### 🎮 Valorant

| Tool | What it does |
|------|-------------|
| **Team Comp Suggester** | Balanced 5-agent comps for every map |

---

## 🧑‍💻 For Developers

Want to understand the code, fix a bug, or contribute a feature? Here's how to run it locally.

### Prerequisites

- **Node.js** 18+
- **npm** 9+

### Run Locally

```bash
git clone https://github.com/xgoat-tbh/web-tools-pack.git
cd web-tools-pack
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000) and you're in.

### Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (AppShell wrapper)
│   ├── page.tsx                # Homepage — tool grid
│   ├── globals.css             # CSS variables, animations, global styles
│   ├── donate/                 # Donation page
│   └── tools/
│       ├── dev/                # 11 developer tools
│       ├── encoding/           # 6 encoding & security tools
│       ├── data/               # 9 data & converter tools
│       ├── media/              # 8 media & file tools
│       ├── productivity/       # 9 productivity tools
│       └── valorant/           # 1 valorant tool
├── components/
│   ├── ui/                     # shadcn/ui primitives
│   ├── app-shell.tsx           # Sidebar + header layout
│   ├── sidebar.tsx             # Navigation sidebar
│   ├── command-palette.tsx     # Ctrl+K search
│   ├── theme-provider.tsx      # Dark/light theme with fade transition
│   ├── copy-button.tsx         # Copy-to-clipboard button
│   └── file-dropzone.tsx       # Drag-and-drop upload component
├── hooks/
│   └── use-copy.ts             # Clipboard hook
└── lib/
    ├── utils.ts                # cn() class merge utility
    ├── tools-config.ts         # Central tool registry (add new tools here)
    └── valorant-data.ts        # Agent & map data
```

### Adding a New Tool

1. Pick a category from `src/lib/tools-config.ts` (or create one)
2. Add an entry with `name`, `slug`, `description`, `icon`, and `category`
3. Create the page at `src/app/tools/<category>/<slug>/page.tsx`
4. Use `"use client"` — all tools are client-side components
5. That's it. The sidebar, homepage, and command palette update automatically.

### Tech Stack

| | |
|---|---|
| **Next.js 14** | App Router, static generation |
| **TypeScript 5** | Type safety throughout |
| **Tailwind CSS 3.4** | Styling + custom animations |
| **shadcn/ui + Radix UI** | Accessible component primitives |
| **Lucide React** | Icon library |

---

## 🤝 Contributing

Contributions are welcome! Whether it's a new tool, bug fix, or UI improvement:

1. Fork the repo
2. Create a branch (`git checkout -b feat/my-tool`)
3. Make your changes
4. Open a pull request

Please keep PRs focused and follow the existing code style.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` | Open command palette |
| `Escape` | Close palette / modals |

---

## 💖 Support

If you find this useful, consider supporting the project:

**[Donate → web-tools-pack.vercel.app/donate](https://web-tools-pack.vercel.app/donate)**

---

## 📄 License

This project is **source-available** — not open source.

You **can**:
- ✅ Use the live site freely at [web-tools-pack.vercel.app](https://web-tools-pack.vercel.app)
- ✅ Clone and run locally for personal use or learning
- ✅ Contribute to this repository via pull requests
- ✅ Reference the code for educational purposes

You **cannot**:
- ❌ Deploy, host, or publish your own copy of this project
- ❌ Redistribute this project (modified or unmodified) as your own
- ❌ Use this project for commercial purposes without permission

See [LICENSE](LICENSE) for the full terms.

---

<div align="center">

**Built with ❤️ by [xgoat-tbh](https://github.com/xgoat-tbh)**

One dashboard. 44 tools. No BS.

</div>
