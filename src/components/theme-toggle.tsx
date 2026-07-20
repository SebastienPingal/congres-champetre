"use client"

import { useState } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useThemeMode, THEME_ORDER, type ThemeMode } from "@/hooks/use-theme-mode"

const ICONS = { system: Monitor, light: Sun, dark: Moon } as const
const LABELS: Record<ThemeMode, string> = {
  system: "Suit le thème système (clic pour passer en clair)",
  light: "Thème clair (clic pour passer en sombre)",
  dark: "Thème sombre (clic pour suivre le système)",
}

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, setMode, mounted } = useThemeMode()
  const [hover, setHover] = useState(false)

  const next = THEME_ORDER[(THEME_ORDER.indexOf(mode) + 1) % THEME_ORDER.length]

  const displayed = mounted && hover ? next : mode
  const Icon = ICONS[displayed]

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={LABELS[mode]}
      title={LABELS[mode]}
      onClick={() => setMode(next)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className={className}
    >
      <Icon />
    </Button>
  )
}
