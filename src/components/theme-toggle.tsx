"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "theme-mode"

type Mode = "light" | "dark"

function readMode(): Mode {
  if (typeof document === "undefined") return "light"
  return document.documentElement.getAttribute("data-theme") === "crepuscule" ? "dark" : "light"
}

export function ThemeToggle({ className }: { className?: string }) {
  const [mode, setMode] = useState<Mode>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setMode(readMode())
  }, [])

  const toggle = () => {
    const next: Mode = mode === "light" ? "dark" : "light"
    const themeId = next === "dark" ? "crepuscule" : "champetre"
    document.documentElement.setAttribute("data-theme", themeId)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // localStorage unavailable — keep in-memory only
    }
    setMode(next)
  }

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={mode === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
      onClick={toggle}
      className={className}
    >
      {mounted && mode === "dark" ? <Sun /> : <Moon />}
    </Button>
  )
}
