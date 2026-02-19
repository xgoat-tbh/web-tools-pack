"use client"

import { useEffect } from "react"

/**
 * Client-side protection layer.
 * - Blocks right-click context menu
 * - Blocks DevTools keyboard shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U)
 * - Detects DevTools via size heuristics & debugger traps
 * - Prints a scary console warning
 * - Prevents drag of images / links
 */
export function SecurityShield() {
  useEffect(() => {
    // ── 1. Console warning ──
    const warningStyle =
      "color:#ff4444;font-size:24px;font-weight:bold;text-shadow:1px 1px 2px #000"
    const msgStyle = "color:#ccc;font-size:14px;"
    console.log("%c⛔ STOP!", warningStyle)
    console.log(
      "%cThis browser feature is intended for developers. If someone told you to copy-paste something here, it's likely a scam. Do not enter or paste any code here.",
      msgStyle
    )
    console.log(
      "%cFor more info: https://en.wikipedia.org/wiki/Self-XSS",
      msgStyle
    )

    // ── 2. Block context menu ──
    const blockCtx = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }
    document.addEventListener("contextmenu", blockCtx)

    // ── 3. Block DevTools shortcuts ──
    const blockKeys = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
      // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C
      if (
        e.ctrlKey &&
        e.shiftKey &&
        ["I", "i", "J", "j", "C", "c"].includes(e.key)
      ) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
      // Ctrl+U (view source)
      if (e.ctrlKey && (e.key === "u" || e.key === "U")) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }
    document.addEventListener("keydown", blockKeys, true)

    // ── 4. Detect DevTools open via resize heuristic ──
    let devToolsOpen = false
    const threshold = 160

    const checkDevTools = () => {
      const widthDiff = window.outerWidth - window.innerWidth > threshold
      const heightDiff = window.outerHeight - window.innerHeight > threshold

      if (widthDiff || heightDiff) {
        if (!devToolsOpen) {
          devToolsOpen = true
          document.documentElement.classList.add("devtools-open")
        }
      } else {
        if (devToolsOpen) {
          devToolsOpen = false
          document.documentElement.classList.remove("devtools-open")
        }
      }
    }

    const resizeInterval = setInterval(checkDevTools, 1000)

    // ── 5. Debugger heartbeat (catches attached debuggers) ──
    const debuggerCheck = setInterval(() => {
      const start = performance.now()
      // eslint-disable-next-line no-debugger
      debugger
      const end = performance.now()
      if (end - start > 100) {
        document.documentElement.classList.add("devtools-open")
      }
    }, 4000)

    // ── 6. Disable drag on images and links ──
    const blockDrag = (e: DragEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === "IMG" || target.tagName === "A") {
        e.preventDefault()
      }
    }
    document.addEventListener("dragstart", blockDrag)

    // ── 7. Disable text selection on non-input elements via CSS class ──
    document.body.classList.add("protected")

    return () => {
      document.removeEventListener("contextmenu", blockCtx)
      document.removeEventListener("keydown", blockKeys, true)
      document.removeEventListener("dragstart", blockDrag)
      document.body.classList.remove("protected")
      document.documentElement.classList.remove("devtools-open")
      clearInterval(resizeInterval)
      clearInterval(debuggerCheck)
    }
  }, [])

  return null
}
