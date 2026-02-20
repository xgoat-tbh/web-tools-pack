"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Keyboard as KbIcon, RotateCcw, Check, AlertTriangle } from "lucide-react"

// Standard keyboard layout rows
const KEYBOARD_ROWS = [
  ["Escape", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"],
  ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Backspace"],
  ["Tab", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
  ["CapsLock", "a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "Enter"],
  ["ShiftLeft", "z", "x", "c", "v", "b", "n", "m", ",", ".", "/", "ShiftRight"],
  ["ControlLeft", "MetaLeft", "AltLeft", " ", "AltRight", "MetaRight", "ControlRight"],
]

// Map display labels
function getKeyLabel(key: string): string {
  const labels: Record<string, string> = {
    " ": "Space",
    Escape: "Esc",
    Backspace: "⌫",
    Tab: "Tab",
    CapsLock: "Caps",
    Enter: "Enter",
    ShiftLeft: "Shift",
    ShiftRight: "Shift",
    ControlLeft: "Ctrl",
    ControlRight: "Ctrl",
    AltLeft: "Alt",
    AltRight: "Alt",
    MetaLeft: "Win",
    MetaRight: "Win",
    "\\": "\\",
    "`": "`",
    "-": "-",
    "=": "=",
    "[": "[",
    "]": "]",
    ";": ";",
    "'": "'",
    ",": ",",
    ".": ".",
    "/": "/",
  }
  if (labels[key] !== undefined) return labels[key]
  if (key.startsWith("F") && key.length <= 3) return key
  return key.toUpperCase()
}

// Map KeyboardEvent to our key id
function eventToKeyId(e: KeyboardEvent): string {
  // Use code for modifier keys to distinguish left/right
  if (e.code === "ShiftLeft" || e.code === "ShiftRight") return e.code
  if (e.code === "ControlLeft" || e.code === "ControlRight") return e.code
  if (e.code === "AltLeft" || e.code === "AltRight") return e.code
  if (e.code === "MetaLeft" || e.code === "MetaRight") return e.code
  // Use e.key for everything else
  if (e.key === " ") return " "
  if (e.key === "Escape") return "Escape"
  if (e.key === "Backspace") return "Backspace"
  if (e.key === "Tab") return "Tab"
  if (e.key === "CapsLock") return "CapsLock"
  if (e.key === "Enter") return "Enter"
  // F-keys
  if (/^F\d{1,2}$/.test(e.key)) return e.key
  // Use the physical key for symbols/letters
  const code = e.code
  if (code.startsWith("Digit")) return code.replace("Digit", "")
  if (code.startsWith("Key")) return code.replace("Key", "").toLowerCase()
  // Fallback for symbols
  const symbolMap: Record<string, string> = {
    Backquote: "`", Minus: "-", Equal: "=",
    BracketLeft: "[", BracketRight: "]", Backslash: "\\",
    Semicolon: ";", Quote: "'",
    Comma: ",", Period: ".", Slash: "/",
  }
  if (symbolMap[code]) return symbolMap[code]
  return e.key
}

// Wider keys
function getKeyWidth(key: string): string {
  if (key === " ") return "flex-[4]"
  if (key === "Backspace" || key === "Tab" || key === "CapsLock" || key === "Enter") return "flex-[1.5]"
  if (key === "ShiftLeft" || key === "ShiftRight") return "flex-[2]"
  if (key === "ControlLeft" || key === "ControlRight" || key === "MetaLeft" || key === "MetaRight" || key === "AltLeft" || key === "AltRight") return "flex-[1.3]"
  return "flex-1"
}

export default function KeyboardCheckerPage() {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set())
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [hasKeyboard, setHasKeyboard] = useState<boolean | null>(null)
  const [lastKey, setLastKey] = useState<{ key: string; code: string } | null>(null)
  const activeTimeout = useRef<ReturnType<typeof setTimeout>>()

  // Detect keyboard presence
  useEffect(() => {
    // Check 1: Is this a device with fine pointer (mouse implies keyboard likely)?
    const hasFinePointer = window.matchMedia("(pointer: fine)").matches
    // Check 2: No coarse-only (touch-only) device
    const hasCoarseOnly = window.matchMedia("(pointer: coarse)").matches && !window.matchMedia("(any-pointer: fine)").matches
    // Check 3: Screen width heuristic — very small screens are likely phone-only
    const isLargeScreen = window.innerWidth >= 768

    if (hasCoarseOnly && !isLargeScreen) {
      setHasKeyboard(false)
    } else if (hasFinePointer || isLargeScreen) {
      // Assume keyboard present, will confirm on first keypress
      setHasKeyboard(true)
    } else {
      setHasKeyboard(false)
    }

    // Definitive confirmation: any keydown = keyboard exists
    const confirmKeyboard = () => setHasKeyboard(true)
    window.addEventListener("keydown", confirmKeyboard, { once: true })

    return () => window.removeEventListener("keydown", confirmKeyboard)
  }, [])

  // Listen for key events
  useEffect(() => {
    if (!hasKeyboard) return

    const onDown = (e: KeyboardEvent) => {
      e.preventDefault()
      const id = eventToKeyId(e)
      setPressedKeys((prev) => new Set(prev).add(id))
      setActiveKey(id)
      setLastKey({ key: e.key, code: e.code })
      if (activeTimeout.current) clearTimeout(activeTimeout.current)
      activeTimeout.current = setTimeout(() => setActiveKey(null), 200)
    }

    window.addEventListener("keydown", onDown)
    return () => {
      window.removeEventListener("keydown", onDown)
      if (activeTimeout.current) clearTimeout(activeTimeout.current)
    }
  }, [hasKeyboard])

  const totalKeys = KEYBOARD_ROWS.flat().length
  const testedCount = pressedKeys.size
  const allTested = testedCount >= totalKeys

  const reset = useCallback(() => {
    setPressedKeys(new Set())
    setActiveKey(null)
    setLastKey(null)
  }, [])

  // ── No keyboard detected ──
  if (hasKeyboard === false) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <KbIcon className="h-6 w-6 text-primary" /> Keyboard Key Checker
          </h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500" />
            <h2 className="text-xl font-semibold">No Keyboard Detected</h2>
            <p className="text-muted-foreground">
              This tool requires a physical keyboard. Connect a keyboard and this page will activate automatically.
            </p>
            <p className="text-sm text-muted-foreground">
              Or press any key to start testing...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Loading state ──
  if (hasKeyboard === null) {
    return (
      <div className="mx-auto max-w-4xl flex items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground">Detecting keyboard...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <KbIcon className="h-6 w-6 text-primary" /> Keyboard Key Checker
        </h1>
        <p className="text-muted-foreground mt-1">
          Press each key to test if it&apos;s working. Tested keys turn green.
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {testedCount} / {totalKeys} keys tested
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round((testedCount / totalKeys) * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-300"
              style={{ width: `${(testedCount / totalKeys) * 100}%` }}
            />
          </div>
          {allTested && (
            <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
              <Check className="h-4 w-4" /> All keys tested — your keyboard is working perfectly!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Last key info */}
      {lastKey && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">Last pressed:</span>
          <code className="bg-muted px-2 py-0.5 rounded text-xs">key: {lastKey.key}</code>
          <code className="bg-muted px-2 py-0.5 rounded text-xs">code: {lastKey.code}</code>
        </div>
      )}

      {/* Keyboard Layout */}
      <Card>
        <CardContent className="p-3 sm:p-4 space-y-1.5">
          {KEYBOARD_ROWS.map((row, ri) => (
            <div key={ri} className="flex gap-1">
              {row.map((key) => {
                const isPressed = pressedKeys.has(key)
                const isActive = activeKey === key
                return (
                  <div
                    key={key}
                    className={`
                      ${getKeyWidth(key)} min-w-0
                      flex items-center justify-center
                      rounded-md border text-[10px] sm:text-xs font-medium
                      h-8 sm:h-10
                      transition-all duration-150 select-none
                      ${isActive
                        ? "bg-primary text-primary-foreground border-primary scale-95 shadow-lg shadow-primary/30"
                        : isPressed
                        ? "bg-green-500/20 border-green-500/50 text-green-400"
                        : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                      }
                    `}
                  >
                    {getKeyLabel(key)}
                  </div>
                )
              })}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Untested keys list */}
      {testedCount > 0 && !allTested && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-2">Untested Keys</h3>
            <div className="flex flex-wrap gap-1.5">
              {KEYBOARD_ROWS.flat()
                .filter((k) => !pressedKeys.has(k))
                .map((k) => (
                  <span key={k} className="bg-muted px-2 py-0.5 rounded text-xs text-muted-foreground">
                    {getKeyLabel(k)}
                  </span>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reset */}
      {testedCount > 0 && (
        <Button variant="outline" className="w-full" onClick={reset}>
          <RotateCcw className="h-4 w-4 mr-2" /> Reset
        </Button>
      )}
    </div>
  )
}
