import type { BugReportClientContext } from "@/lib/bug-report"
import { getSessionBuffers } from "./session-buffers"

const pageLoadedAt = typeof window !== "undefined" ? new Date().toISOString() : ""

function readModePreference(): string | null {
  try {
    return localStorage.getItem("theme-mode")
  } catch {
    return null
  }
}

/** Instantané du navigateur au moment de l'envoi (appelé côté client uniquement). */
export function collectClientContext(): BugReportClientContext {
  const html = document.documentElement
  const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection
  const { errors, navigation } = getSessionBuffers()

  return {
    url: window.location.href,
    referrer: document.referrer,
    userAgent: navigator.userAgent,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    viewport: `${window.innerWidth}×${window.innerHeight}`,
    screen: `${window.screen.width}×${window.screen.height}`,
    pixelRatio: window.devicePixelRatio,
    touch: navigator.maxTouchPoints > 0,
    online: navigator.onLine,
    connection: connection?.effectiveType ?? null,
    theme: html.getAttribute("data-theme"),
    mode: html.getAttribute("data-mode"),
    modePreference: readModePreference(),
    pageLoadedAt,
    reportedAt: new Date().toISOString(),
    errors,
    navigation,
  }
}
