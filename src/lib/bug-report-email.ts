import { escapeHtml } from "@/lib/mail"
import {
  BUG_REPORT_LIMITS,
  type BugReportClientContext,
  type BugReportLogEntry,
  type BugReportNavigationEntry,
} from "@/lib/bug-report"

// ─── Lecture défensive du contexte envoyé par le navigateur ────────────────
// Tout vient du client : on ne garde que les champs connus, coupés à une
// longueur raisonnable. Le HTML est de toute façon échappé au rendu.

function clip(value: unknown, max = 500): string {
  if (typeof value !== "string") return ""
  return value.length > max ? `${value.slice(0, max)}…` : value
}

function clipOrNull(value: unknown, max = 100): string | null {
  const s = clip(value, max)
  return s.length > 0 ? s : null
}

function readRecords(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value
    .slice(-BUG_REPORT_LIMITS.bufferSize)
    .filter((e): e is Record<string, unknown> => typeof e === "object" && e !== null)
}

function readErrors(value: unknown): BugReportLogEntry[] {
  return readRecords(value)
    .map((e) => ({ at: clip(e.at, 40), message: clip(e.message, 1500) }))
    .filter((e) => e.message.length > 0)
}

function readNavigation(value: unknown): BugReportNavigationEntry[] {
  return readRecords(value)
    .map((e) => ({ at: clip(e.at, 40), path: clip(e.path, 300) }))
    .filter((e) => e.path.length > 0)
}

export function parseClientContext(raw: unknown): BugReportClientContext | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > BUG_REPORT_LIMITS.contextMaxBytes) return null
  let data: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null) return null
    data = parsed as Record<string, unknown>
  } catch {
    return null
  }
  return {
    url: clip(data.url),
    referrer: clip(data.referrer),
    userAgent: clip(data.userAgent),
    language: clip(data.language, 50),
    timezone: clip(data.timezone, 80),
    viewport: clip(data.viewport, 30),
    screen: clip(data.screen, 30),
    pixelRatio: typeof data.pixelRatio === "number" ? data.pixelRatio : 0,
    touch: data.touch === true,
    online: data.online !== false,
    connection: clipOrNull(data.connection, 20),
    theme: clipOrNull(data.theme, 30),
    mode: clipOrNull(data.mode, 30),
    modePreference: clipOrNull(data.modePreference, 30),
    pageLoadedAt: clip(data.pageLoadedAt, 40),
    reportedAt: clip(data.reportedAt, 40),
    errors: readErrors(data.errors),
    navigation: readNavigation(data.navigation),
  }
}

// ─── Mail ──────────────────────────────────────────────────────────────────

export interface BugReportEmailInput {
  description: string
  /** Email laissé dans le formulaire par une personne non connectée. */
  contactEmail: string | null
  reporter: {
    id: string
    name: string | null
    email: string
    role: string
    createdAt: Date
    lastLoginAt: Date | null
  } | null
  edition: { name: string } | null
  participation: {
    isAttending: boolean | null
    attendanceDays: string
    sleepsOnSite: boolean | null
    onboardingCompletedAt: Date | null
    hasPaid: boolean
    willPayInCash: boolean
    paidAmount: number | null
    supportAmount: number | null
    paymentStatus: string | null
    wantsSecretSanta: boolean | null
  } | null
  mealsPresent: number | null
  conferencesCount: number | null
  client: BugReportClientContext | null
  server: {
    receivedAt: Date
    userAgent: string | null
    country: string | null
    city: string | null
    commit: string | null
    environment: string | null
  }
  /** Content-ID de l'imprécran joint, pour l'afficher dans le corps. */
  screenshotCid: string | null
  adminUsersUrl: string
}

type Row = [label: string, value: string]
type Section = { title: string; rows: Row[] }

const yesNo = (v: boolean | null | undefined) => (v === true ? "oui" : v === false ? "non" : "pas répondu")
const date = (d: Date | null | undefined) =>
  d ? d.toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "short", timeStyle: "medium" }) : "—"
const or = (v: string | null | undefined) => (v && v.length > 0 ? v : "—")

function buildSections(input: BugReportEmailInput): Section[] {
  const sections: Section[] = []
  const { reporter, participation, client, server } = input

  sections.push({
    title: "Qui",
    rows: reporter
      ? [
          ["Nom", or(reporter.name)],
          ["Email", reporter.email],
          ["Rôle", reporter.role],
          ["ID", reporter.id],
          ["Compte créé", date(reporter.createdAt)],
          ["Dernière connexion", date(reporter.lastLoginAt)],
        ]
      : [
          ["Connecté", "non (visiteur anonyme)"],
          ["Email de contact", or(input.contactEmail)],
        ],
  })

  if (reporter) {
    sections.push({
      title: `Inscription${input.edition ? ` — ${input.edition.name}` : ""}`,
      rows: participation
        ? [
            ["Vient", yesNo(participation.isAttending)],
            ["Jours", participation.attendanceDays],
            ["Dort sur place", yesNo(participation.sleepsOnSite)],
            ["Onboarding terminé", date(participation.onboardingCompletedAt)],
            ["Repas cochés présents", String(input.mealsPresent ?? "—")],
            ["Conférences", String(input.conferencesCount ?? "—")],
            ["Payé", `${participation.hasPaid ? "oui" : "non"}${participation.willPayInCash ? " (espèces)" : ""}`],
            ["Montant payé", participation.paidAmount != null ? `${participation.paidAmount} €` : "—"],
            ["Soutien", participation.supportAmount != null ? `${participation.supportAmount} €` : "—"],
            ["Statut PayPal", or(participation.paymentStatus)],
            ["Secret Santa", yesNo(participation.wantsSecretSanta)],
          ]
        : [["Participation", input.edition ? "aucune ligne pour l'édition active" : "aucune édition active"]],
    })
  }

  if (client) {
    sections.push({
      title: "Page & navigateur",
      rows: [
        ["URL", or(client.url)],
        ["Page précédente", or(client.referrer)],
        ["Navigateur", or(client.userAgent)],
        ["Langue", or(client.language)],
        ["Fuseau", or(client.timezone)],
        ["Fenêtre", or(client.viewport)],
        ["Écran", `${or(client.screen)} @${client.pixelRatio}x${client.touch ? " · tactile" : ""}`],
        ["Réseau", `${client.online ? "en ligne" : "HORS LIGNE"}${client.connection ? ` · ${client.connection}` : ""}`],
        ["Thème", `${or(client.theme)} · ${or(client.mode)} (préférence : ${client.modePreference ?? "système"})`],
        ["Page chargée à", or(client.pageLoadedAt)],
        ["Signalé à", or(client.reportedAt)],
      ],
    })
  }

  sections.push({
    title: "Serveur",
    rows: [
      ["Reçu", date(server.receivedAt)],
      ["Environnement", or(server.environment)],
      ["Commit", or(server.commit)],
      ["Localisation (IP)", [server.city, server.country].filter(Boolean).join(", ") || "—"],
      ...(client ? [] : ([["User-Agent", or(server.userAgent)]] as Row[])),
    ],
  })

  return sections
}

function renderTableHtml(rows: Row[]): string {
  return `<table style="border-collapse:collapse;width:100%;font-size:13px">${rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#666;white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td><td style="padding:4px 0;word-break:break-word">${escapeHtml(value)}</td></tr>`
    )
    .join("")}</table>`
}

function renderLogHtml(title: string, lines: string[]): string {
  if (lines.length === 0) return ""
  return `<h3 style="margin:20px 0 6px;font-size:14px">${escapeHtml(title)}</h3><pre style="background:#f5f5f5;padding:10px;border-radius:6px;font-size:12px;white-space:pre-wrap;word-break:break-word;margin:0">${escapeHtml(lines.join("\n"))}</pre>`
}

export function buildBugReportEmail(input: BugReportEmailInput): { subject: string; html: string; text: string } {
  const who = input.reporter?.name || input.reporter?.email || input.contactEmail || "anonyme"
  const firstLine = input.description.split("\n")[0].trim()
  const summary = firstLine.length > 60 ? `${firstLine.slice(0, 60)}…` : firstLine
  const subject = `🐞 Bug signalé par ${who} : ${summary}`

  const sections = buildSections(input)
  const errors = input.client?.errors.map((e) => `[${e.at}] ${e.message}`) ?? []
  const navigation = input.client?.navigation.map((e) => `[${e.at}] ${e.path}`) ?? []

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#222;max-width:720px">
<h2 style="margin:0 0 12px;font-size:18px">🐞 Nouveau signalement de bug</h2>
<div style="background:#fff8e1;border:1px solid #f0d58c;border-radius:6px;padding:12px;white-space:pre-wrap;font-size:14px">${escapeHtml(input.description)}</div>
${input.screenshotCid ? `<h3 style="margin:20px 0 6px;font-size:14px">Imprécran</h3><img src="cid:${input.screenshotCid}" alt="Imprécran" style="max-width:100%;border:1px solid #ddd;border-radius:6px">` : ""}
${sections.map((s) => `<h3 style="margin:20px 0 6px;font-size:14px">${escapeHtml(s.title)}</h3>${renderTableHtml(s.rows)}`).join("\n")}
${renderLogHtml(`Erreurs JS récentes (${errors.length})`, errors)}
${renderLogHtml("Pages visitées", navigation)}
${input.reporter ? `<p style="margin-top:20px;font-size:13px"><a href="${escapeHtml(input.adminUsersUrl)}">Ouvrir /admin/users</a></p>` : ""}
</div>`

  const text = [
    "Nouveau signalement de bug",
    "",
    input.description,
    "",
    ...sections.flatMap((s) => [`## ${s.title}`, ...s.rows.map(([l, v]) => `${l} : ${v}`), ""]),
    ...(errors.length > 0 ? ["## Erreurs JS récentes", ...errors, ""] : []),
    ...(navigation.length > 0 ? ["## Pages visitées", ...navigation, ""] : []),
    input.screenshotCid ? "(imprécran en pièce jointe)" : "",
  ].join("\n")

  return { subject, html, text }
}
