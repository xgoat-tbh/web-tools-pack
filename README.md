<div align="center">

# 🛠️ Web Tools Pack

**A modern, all-in-one developer toolkit — 31 tools across 6 categories.**

Built with Next.js 14 · TypeScript · Tailwind CSS · shadcn/ui

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/xgoat-tbh/web-tools-pack)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## ✨ Features

- **31 tools** in one unified dashboard — no context switching
- **Dark mode by default** with light mode toggle
- **Command palette** (`Ctrl+K`) for instant tool search
- **Fully responsive** — desktop-first, mobile-optimized
- **100% client-side** — no data leaves your browser
- **Drag & drop** file uploads with image preview
- **Copy to clipboard** on all outputs
- **Zero config deploy** to Vercel
- **Fast** — static generation, minimal JS bundles

---

## 📦 Tools (31)

### 🔧 Dev Tools (7)

| Tool | Description |
|------|-------------|
| **JSON Formatter** | Format, validate, and minify JSON |
| **XML Formatter** | Pretty-print or minify XML documents |
| **Minifier / Beautifier** | Minify or beautify HTML, CSS, and JavaScript |
| **Markdown Editor** | Write Markdown with real-time GFM preview |
| **Regex Tester** | Test patterns with match highlighting and group capture |
| **Text Diff** | Side-by-side comparison with line-level diff |
| **Code Snippet Sharer** | Generate shareable code snippets via URL |

### 🔐 Encoding & Security (5)

| Tool | Description |
|------|-------------|
| **Base64 Encode/Decode** | Convert text ↔ Base64 |
| **URL Encoder/Decoder** | Encode or decode URI components |
| **JWT Decoder** | Inspect JWT header and payload |
| **Hash Generator** | SHA-256, SHA-384, SHA-512, SHA-1, MD5 |
| **UUID Generator** | Bulk generate v4 UUIDs |

### 📊 Data & Converters (7)

| Tool | Description |
|------|-------------|
| **Number Base Converter** | Binary ↔ Decimal ↔ Hex ↔ Octal |
| **Percentage Calculator** | Three-mode percentage solver |
| **Random Number Generator** | Configurable range and batch generation |
| **Timestamp Converter** | Unix ↔ ISO 8601 ↔ human-readable |
| **Timezone Converter** | View a time across 17 global timezones |
| **Date Difference** | Exact difference in years, months, days, hours |
| **Age Calculator** | Precise age + days until next birthday |

### 🖼️ Media & Files (6)

| Tool | Description |
|------|-------------|
| **Image Compressor** | JPEG compression with quality slider and size stats |
| **Image Resizer** | Resize with aspect ratio lock |
| **Image Converter** | Convert between PNG, JPEG, and WebP |
| **Color Picker** | Extract colors from any image pixel |
| **Blur / Pixelate** | Apply blur or mosaic effects to images |
| **QR Code Generator** | Generate downloadable QR codes from text/URLs |

### ⏱️ Productivity (5)

| Tool | Description |
|------|-------------|
| **Pomodoro Timer** | Focus timer with work/break intervals and audio alert |
| **Sticky Notes** | Persistent notes with localStorage autosave |
| **Word Counter** | Words, characters, sentences, paragraphs, reading time |
| **Focus Editor** | Distraction-free fullscreen writing environment |
| **Checklist Generator** | Create and manage task checklists |

### 🎮 Valorant (1)

| Tool | Description |
|------|-------------|
| **Team Comp Suggester** | Balanced 5-agent compositions for every map with role analysis |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **npm** 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/xgoat-tbh/web-tools-pack.git
cd web-tools-pack

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## 🌐 Deploy to Vercel

The fastest way to deploy:

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the repository
4. Click **Deploy** — no configuration needed

Or use the Vercel CLI:

```bash
npx vercel
```

---

## 🏗️ Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with AppShell
│   ├── page.tsx                # Homepage dashboard
│   ├── globals.css             # Theme variables & global styles
│   └── tools/
│       ├── dev/                # Developer tools
│       ├── encoding/           # Encoding & security tools
│       ├── data/               # Data & converter tools
│       ├── media/              # Media & file tools
│       ├── productivity/       # Productivity tools
│       └── valorant/           # Valorant tools
├── components/
│   ├── ui/                     # shadcn/ui primitives (Button, Card, Input, etc.)
│   ├── app-shell.tsx           # Main layout shell (sidebar + header)
│   ├── sidebar.tsx             # Categorized navigation sidebar
│   ├── command-palette.tsx     # Ctrl+K command palette
│   ├── theme-provider.tsx      # Dark/light mode provider
│   ├── copy-button.tsx         # Reusable copy-to-clipboard button
│   └── file-dropzone.tsx       # Drag-and-drop file upload component
├── hooks/
│   └── use-copy.ts             # Clipboard hook
└── lib/
    ├── utils.ts                # cn() utility
    ├── tools-config.ts         # Tool registry & navigation config
    └── valorant-data.ts        # Agent & map composition data
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| [Next.js 14](https://nextjs.org) | App Router, SSG, file-based routing |
| [TypeScript](https://typescriptlang.org) | Type safety |
| [Tailwind CSS](https://tailwindcss.com) | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com) | Accessible component primitives |
| [Radix UI](https://radix-ui.com) | Headless UI primitives |
| [Lucide React](https://lucide.dev) | Icon library |
| [react-markdown](https://github.com/remarkjs/react-markdown) | Markdown rendering |
| [qrcode](https://github.com/soldair/node-qrcode) | QR code generation |

---

## 📐 Design Principles

- **Privacy first** — all processing happens in-browser, nothing is uploaded
- **Performance** — static pages, code-split per tool, minimal bundle sizes
- **Accessibility** — semantic HTML, keyboard navigation, focus management
- **Modularity** — each tool is a self-contained page component
- **Minimal dependencies** — only what's necessary, no bloat

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` | Open command palette |
| `Escape` | Close command palette / modals |

---

## 📄 License

This project is open source under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ for developers who hate switching between 20 different websites.**

</div>
