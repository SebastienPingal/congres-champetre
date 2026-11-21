/**
 * Signalement de bug — types et limites partagés client/serveur.
 *
 * ⚠ Module volontairement pur (aucun import Prisma / Node) pour rester
 * importable depuis la bulle côté client. La construction du mail vit dans
 * `src/lib/bug-report-email.ts`, la route dans `src/app/api/bug-report/`.
 */

export const BUG_REPORT_LIMITS = {
  descriptionMin: 5,
  descriptionMax: 5000,
  emailMax: 200,
  /** Vercel refuse les corps > 4,5 Mo : on garde de la marge pour le reste du formulaire. */
  screenshotMaxBytes: 4 * 1024 * 1024,
  /** Au-delà, l'image est recompressée côté client avant l'envoi. */
  screenshotTargetBytes: 1.5 * 1024 * 1024,
  screenshotMaxDimension: 2560,
  contextMaxBytes: 32 * 1024,
  /** Entrées gardées dans les tampons d'erreurs et de navigation. */
  bufferSize: 20,
} as const

export interface BugReportLogEntry {
  at: string
  message: string
}

export interface BugReportNavigationEntry {
  at: string
  path: string
}

/** Infos techniques collectées dans le navigateur au moment de l'envoi. */
export interface BugReportClientContext {
  url: string
  referrer: string
  userAgent: string
  language: string
  timezone: string
  viewport: string
  screen: string
  pixelRatio: number
  touch: boolean
  online: boolean
  /** `navigator.connection.effectiveType` (Chrome / Android uniquement). */
  connection: string | null
  /** `data-theme` de `<html>` (thème de l'édition). */
  theme: string | null
  /** `data-mode` effectif (`light` / `dark`). */
  mode: string | null
  /** Préférence stockée (`theme-mode` en localStorage) : light / dark / null = système. */
  modePreference: string | null
  pageLoadedAt: string
  reportedAt: string
  /** Erreurs JS récentes (window.onerror, promesses rejetées, console.error). */
  errors: BugReportLogEntry[]
  /** Dernières pages visitées dans l'appli, de la plus ancienne à la plus récente. */
  navigation: BugReportNavigationEntry[]
}
