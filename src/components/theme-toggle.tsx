"use client"

import { useEffect, useState } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "theme-mode"

type Mode = "system" | "light" | "dark"

const ORDER: Mode[] = ["system", "light", "dark"]
const LABELS: Record<Mode, string> = {
  system: "Suit le thème système (clic pour passer en clair)",
  light: "Thème clair (clic pour passer en sombre)",
  dark: "Thème sombre (clic pour suivre le système)",
}

function readMode(): Mode {
  if (typeof localStorage === "undefined") return "system"
  const v = localStorage.getItem(STORAGE_KEY)
  return v === "light" || v === "dark" ? v : "system"
}

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches
}

function applyMode(mode: Mode) {
  const effective = mode === "system" ? (systemPrefersDark() ? "dark" : "light") : mode
  document.documentElement.setAttribute("data-theme", effective === "dark" ? "crepuscule" : "champetre")
}

export function ThemeToggle({ className }: { className?: string }) {
  const [mode, setMode] = useState<Mode>("system")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setMode(readMode())
  }, [])

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length]
    try {
      if (next === "system") localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // localStorage unavailable — keep in-memory only
    }
    applyMode(next)
    setMode(next)
  }

  const Icon = mounted
    ? mode === "system"
      ? Monitor
      : mode === "dark"
        ? Sun
        : Moon
    : Monitor

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={LABELS[mode]}
      title={LABELS[mode]}
      onClick={cycle}
      className={className}
    >
      <Icon />
    </Button>
  )
}
