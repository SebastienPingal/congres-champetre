import { BUG_REPORT_LIMITS, type BugReportLogEntry, type BugReportNavigationEntry } from "@/lib/bug-report"

// Tampons circulaires gardés en mémoire pendant la session de navigation,
// joints au signalement pour voir ce qui s'est passé juste avant le bug.

const errors: BugReportLogEntry[] = []
const navigation: BugReportNavigationEntry[] = []
let installed = false

const now = () => new Date().toISOString()

function push<T>(buffer: T[], entry: T) {
  buffer.push(entry)
  if (buffer.length > BUG_REPORT_LIMITS.bufferSize) buffer.shift()
}

function describe(value: unknown): string {
  if (value instanceof Error) {
    const stack = value.stack?.split("\n").slice(1, 4).map((l) => l.trim()).join(" | ")
    return `${value.name}: ${value.message}${stack ? ` (${stack})` : ""}`
  }
  if (typeof value === "string") return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function recordError(message: string) {
  push(errors, { at: now(), message: message.slice(0, 1500) })
}

/** Branche les écouteurs d'erreurs une seule fois (idempotent). */
export function installErrorCapture() {
  if (installed || typeof window === "undefined") return
  installed = true

  window.addEventListener("error", (event) => {
    const where = event.filename ? ` @ ${event.filename}:${event.lineno}:${event.colno}` : ""
    recordError(`[error] ${event.error ? describe(event.error) : event.message}${where}`)
  })
  window.addEventListener("unhandledrejection", (event) => {
    recordError(`[promesse rejetée] ${describe(event.reason)}`)
  })

  const originalConsoleError = console.error.bind(console)
  console.error = (...args: unknown[]) => {
    try {
      recordError(`[console.error] ${args.map(describe).join(" ")}`)
    } catch {
      // ne jamais casser console.error
    }
    originalConsoleError(...args)
  }
}

export function recordNavigation(path: string) {
  if (navigation.at(-1)?.path === path) return
  push(navigation, { at: now(), path })
}

export function getSessionBuffers() {
  return { errors: [...errors], navigation: [...navigation] }
}
