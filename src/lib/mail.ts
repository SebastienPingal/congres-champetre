import nodemailer from "nodemailer"

type MailConfig = {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
}

type BroadcastEmailInput = {
  subject: string
  message: string
  recipients: string[]
}

export type BroadcastEmailResult = {
  total: number
  sent: number
  failed: number
  errors: Array<{ email: string; error: string }>
}

function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (typeof value !== "string" || value.length === 0) return defaultValue
  return value.toLowerCase() === "true"
}

function readMailConfig(): MailConfig {
  const host = process.env.SMTP_HOST
  const portRaw = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM
  const secure = parseBooleanEnv(process.env.SMTP_SECURE, false)

  const missing: string[] = []
  if (!host) missing.push("SMTP_HOST")
  if (!portRaw) missing.push("SMTP_PORT")
  if (!user) missing.push("SMTP_USER")
  if (!pass) missing.push("SMTP_PASS")
  if (!from) missing.push("SMTP_FROM")

  if (missing.length > 0) {
    throw new Error(`📭 Configuration SMTP incomplète: ${missing.join(", ")}`)
  }

  const resolvedHost = host as string
  const resolvedUser = user as string
  const resolvedPass = pass as string
  const resolvedFrom = from as string

  const port = Number(portRaw)
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("⚠️ SMTP_PORT doit être un entier positif")
  }

  return { host: resolvedHost, port, secure, user: resolvedUser, pass: resolvedPass, from: resolvedFrom }
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;")
}

function sanitizeUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl)
    if (parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "mailto:") {
      return parsed.toString()
    }
    return null
  } catch {
    return null
  }
}

function applyInlineMarkdown(line: string): string {
  let rendered = line
  rendered = rendered.replace(/`([^`]+)`/g, "<code>$1</code>")
  rendered = rendered.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label: string, rawUrl: string) => {
    const safeUrl = sanitizeUrl(rawUrl.trim())
    if (!safeUrl) return label
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${label}</a>`
  })
  rendered = rendered.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  rendered = rendered.replace(/\*([^*]+)\*/g, "<em>$1</em>")
  return rendered
}

function markdownToSafeHtml(markdown: string): string {
  const escaped = escapeHtml(markdown).replaceAll("\r\n", "\n")
  const lines = escaped.split("\n")
  const htmlBlocks: string[] = []
  let listItems: string[] = []

  const flushList = () => {
    if (listItems.length > 0) {
      htmlBlocks.push(`<ul>${listItems.join("")}</ul>`)
      listItems = []
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (line.length === 0) {
      flushList()
      continue
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      flushList()
      const level = headingMatch[1].length
      const content = applyInlineMarkdown(headingMatch[2])
      htmlBlocks.push(`<h${level}>${content}</h${level}>`)
      continue
    }

    const listMatch = line.match(/^[-*]\s+(.*)$/)
    if (listMatch) {
      const content = applyInlineMarkdown(listMatch[1])
      listItems.push(`<li>${content}</li>`)
      continue
    }

    flushList()
    htmlBlocks.push(`<p>${applyInlineMarkdown(line)}</p>`)
  }

  flushList()
  return htmlBlocks.join("")
}

export async function sendBroadcastEmail(input: BroadcastEmailInput): Promise<BroadcastEmailResult> {
  const config = readMailConfig()
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  })

  const normalizedRecipients = input.recipients
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0)
  const dedupedRecipients = Array.from(new Set(normalizedRecipients))

  let sent = 0
  const errors: Array<{ email: string; error: string }> = []

  const safeHtmlBody = markdownToSafeHtml(input.message)

  for (const email of dedupedRecipients) {
    try {
      await transporter.sendMail({
        from: config.from,
        to: email,
        subject: input.subject,
        text: input.message,
        html: safeHtmlBody,
      })
      sent += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue"
      errors.push({ email, error: message })
      console.error(`📧❌ Échec d'envoi vers ${email}:`, error)
    }
  }

  return {
    total: dedupedRecipients.length,
    sent,
    failed: dedupedRecipients.length - sent,
    errors,
  }
}
