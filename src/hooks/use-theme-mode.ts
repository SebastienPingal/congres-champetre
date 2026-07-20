"use client"

import { useEffect, useState } from "react"

const STORAGE_KEY = "theme-mode"

export type ThemeMode = "system" | "light" | "dark"

export const THEME_ORDER: ThemeMode[] = ["system", "light", "dark"]

function readMode(): ThemeMode {
  if (typeof localStorage === "undefined") return "system"
  const v = localStorage.getItem(STORAGE_KEY)
  return v === "light" || v === "dark" ? v : "system"
}

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches
}

function applyMode(mode: ThemeMode) {
  const effective = mode === "system" ? (systemPrefersDark() ? "dark" : "light") : mode
  document.documentElement.setAttribute("data-theme", effective === "dark" ? "crepuscule" : "champetre")
}

/**
 * Gère le mode de thème (system/light/dark) persisté dans localStorage.
 * `mounted` évite le flash d'hydratation côté serveur.
 */
export function useThemeMode() {
  const [mode, setModeState] = useState<ThemeMode>("system")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setModeState(readMode())
  }, [])

  const setMode = (next: ThemeMode) => {
    try {
      if (next === "system") localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // localStorage unavailable — keep in-memory only
    }
    applyMode(next)
    setModeState(next)
  }

  return { mode, setMode, mounted }
}
