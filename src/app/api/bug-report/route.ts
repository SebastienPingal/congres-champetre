import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveEdition } from "@/lib/edition"
import { sendEmail } from "@/lib/mail"
import { BUG_REPORT_LIMITS } from "@/lib/bug-report"
import { buildBugReportEmail, parseClientContext, type BugReportEmailInput } from "@/lib/bug-report-email"

export const dynamic = "force-dynamic"

const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"])
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** Délai minimal entre l'ouverture du formulaire et l'envoi : en dessous, c'est un robot. */
const MIN_FILL_MS = 2000

// Limite best-effort, en mémoire : sur Vercel chaque instance a la sienne, ce
// n'est pas une vraie protection, juste de quoi freiner un formulaire qui boucle.
const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 }
const recentReports = new Map<string, number[]>()

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const hits = (recentReports.get(key) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs)
  if (hits.length >= RATE_LIMIT.max) {
    recentReports.set(key, hits)
    return true
  }
  hits.push(now)
  recentReports.set(key, hits)
  return false
}

function clientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
}

function decodeHeader(value: string | null): string | null {
  if (!value) return null
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export async function POST(request: NextRequest) {
  try {
    const recipient = process.env.BUG_REPORT_EMAIL?.trim()
    if (!recipient) {
      console.error("🐞 BUG_REPORT_EMAIL n'est pas configuré : signalement impossible à envoyer")
      return NextResponse.json(
        { error: "Le signalement de bug n'est pas encore configuré. Prévenez l'organisation autrement 🙏" },
        { status: 503 }
      )
    }

    const session = await auth()
    const userId = session?.user?.id ?? null

    if (isRateLimited(userId ?? `ip:${clientIp(request)}`)) {
      return NextResponse.json(
        { error: "Trop de signalements d'un coup. Réessayez dans quelques minutes." },
        { status: 429 }
      )
    }

    let form: FormData
    try {
      form = await request.formData()
    } catch {
      return NextResponse.json({ error: "⚠️ Requête invalide" }, { status: 400 })
    }

    // Anti-spam pour les visiteurs anonymes : champ piège rempli ou envoi
    // trop rapide → on répond « OK » sans rien envoyer.
    const honeypot = form.get("website")
    const openedAt = Number(form.get("openedAt"))
    if (
      (typeof honeypot === "string" && honeypot.length > 0) ||
      (!userId && Number.isFinite(openedAt) && Date.now() - openedAt < MIN_FILL_MS)
    ) {
      return NextResponse.json({ message: "✅ Merci !" })
    }

    const description = String(form.get("description") ?? "").trim()
    if (description.length < BUG_REPORT_LIMITS.descriptionMin) {
      return NextResponse.json({ error: "Décrivez le problème en quelques mots." }, { status: 400 })
    }
    if (description.length > BUG_REPORT_LIMITS.descriptionMax) {
      return NextResponse.json(
        { error: `Description trop longue (${BUG_REPORT_LIMITS.descriptionMax} caractères maximum).` },
        { status: 400 }
      )
    }

    let contactEmail: string | null = null
    if (!userId) {
      const raw = String(form.get("contactEmail") ?? "").trim()
      if (raw.length > 0) {
        if (raw.length > BUG_REPORT_LIMITS.emailMax || !EMAIL_PATTERN.test(raw)) {
          return NextResponse.json({ error: "Cette adresse email ne semble pas valide." }, { status: 400 })
        }
        contactEmail = raw
      }
    }

    const screenshot = form.get("screenshot")
    let attachment: { filename: string; content: Buffer; contentType: string; cid: string } | null = null
    if (screenshot instanceof File && screenshot.size > 0) {
      if (screenshot.size > BUG_REPORT_LIMITS.screenshotMaxBytes) {
        return NextResponse.json({ error: "Imprécran trop lourd (4 Mo maximum)." }, { status: 400 })
      }
      if (!ALLOWED_IMAGE_TYPES.has(screenshot.type)) {
        return NextResponse.json({ error: "Format d'image non supporté (png, jpeg, gif, webp)." }, { status: 400 })
      }
      const extension = screenshot.type.split("/")[1]
      attachment = {
        filename: `imprecran.${extension === "jpeg" ? "jpg" : extension}`,
        content: Buffer.from(await screenshot.arrayBuffer()),
        contentType: screenshot.type,
        cid: "bug-report-screenshot",
      }
    }

    // ─── Données de session côté serveur (on ne fait pas confiance au client) ───
    let reporter: BugReportEmailInput["reporter"] = null
    let edition: BugReportEmailInput["edition"] = null
    let participation: BugReportEmailInput["participation"] = null
    let mealsPresent: number | null = null
    let conferencesCount: number | null = null

    if (userId) {
      reporter = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, createdAt: true, lastLoginAt: true },
      })

      // Le bug peut justement venir d'une édition manquante : on n'échoue pas pour ça.
      const activeEdition = await getActiveEdition().catch(() => null)
      if (activeEdition) {
        edition = { name: activeEdition.name }
        const [p, meals, conferences] = await Promise.all([
          prisma.editionParticipation.findUnique({
            where: { userId_editionId: { userId, editionId: activeEdition.id } },
            select: {
              isAttending: true,
              attendanceDays: true,
              sleepsOnSite: true,
              onboardingCompletedAt: true,
              hasPaid: true,
              willPayInCash: true,
              paidAmount: true,
              supportAmount: true,
              paymentStatus: true,
              wantsSecretSanta: true,
            },
          }),
          prisma.mealRegistration.count({
            where: { userId, status: "PRESENT", timeSlot: { editionId: activeEdition.id } },
          }),
          prisma.conference.count({ where: { speakerId: userId, editionId: activeEdition.id } }),
        ])
        participation = p
        mealsPresent = meals
        conferencesCount = conferences
      }
    }

    const { subject, html, text } = buildBugReportEmail({
      description,
      contactEmail,
      reporter,
      edition,
      participation,
      mealsPresent,
      conferencesCount,
      client: parseClientContext(form.get("context")),
      server: {
        receivedAt: new Date(),
        userAgent: request.headers.get("user-agent"),
        country: request.headers.get("x-vercel-ip-country"),
        city: decodeHeader(request.headers.get("x-vercel-ip-city")),
        commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
        environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? null,
      },
      screenshotCid: attachment?.cid ?? null,
      adminUsersUrl: `${request.nextUrl.origin}/admin/users`,
    })

    await sendEmail({
      to: recipient,
      subject,
      html,
      text,
      replyTo: reporter?.email ?? contactEmail ?? undefined,
      attachments: attachment ? [attachment] : undefined,
    })

    return NextResponse.json({ message: "✅ Merci !" })
  } catch (error) {
    console.error("🚨 Erreur signalement de bug:", error)
    return NextResponse.json(
      { error: "❌ Le signalement n'a pas pu être envoyé. Réessayez dans un instant." },
      { status: 500 }
    )
  }
}
