"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"

type Theme = "dark" | "light"

const ThemeContext = createContext<{ theme: Theme; toggle: () => void; transitioning: boolean }>({
  theme: "dark",
  toggle: () => {},
  transitioning: false,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark")
  const [transitioning, setTransitioning] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null
    if (stored) setTheme(stored)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    localStorage.setItem("theme", theme)
  }, [theme])

  const toggle = useCallback(() => {
    setTransitioning(true)
    // Small delay so the fade-out starts before the colors swap
    setTimeout(() => {
      setTheme((t) => (t === "dark" ? "light" : "dark"))
      // Fade back in after colors have been applied
      setTimeout(() => setTransitioning(false), 200)
    }, 150)
  }, [])

  return <ThemeContext.Provider value={{ theme, toggle, transitioning }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
