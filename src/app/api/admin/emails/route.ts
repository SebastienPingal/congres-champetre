import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendBroadcastEmail } from "@/lib/mail"

const recipientFilter = z.enum([
  "all",
  "participants",
  "non_participants",
  "not_paid",
  "paid",
  "speakers",
])

const payloadSchema = z.object({
  subject: z.string().trim().min(3, "Le sujet doit contenir au moins 3 caractères").max(200, "Le sujet est trop long"),
  message: z.string().trim().min(5, "Le message doit contenir au moins 5 caractères").max(10000, "Le message est trop long"),
  sendToAdminOnly: z.boolean().optional().default(false),
  filter: recipientFilter.optional().default("all"),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "🔒 Non authentifié" }, { status: 401 })
    }

    const me = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (me?.role !== "ADMIN") {
      return NextResponse.json({ error: "⚠️ Accès refusé - Admin requis" }, { status: 403 })
    }

    const rawBody = await req.json().catch(() => null)
    const parsed = payloadSchema.safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "⚠️ Requête invalide",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    let recipients: string[] = []

    if (parsed.data.sendToAdminOnly) {
      const adminEmail = session.user.email?.trim()
      if (!adminEmail) {
        return NextResponse.json({ error: "📭 Email admin introuvable pour l'envoi test" }, { status: 400 })
      }
      recipients = [adminEmail]
    } else {
      const activeEdition = await prisma.edition.findFirst({ where: { isActive: true } })
      const filter = parsed.data.filter

      if (filter === "all") {
        const users = await prisma.user.findMany({ select: { email: true } })
        recipients = users.map((u) => u.email)
      } else if (!activeEdition) {
        return NextResponse.json({ error: "📭 Aucune édition active — impossible de filtrer les destinataires" }, { status: 400 })
      } else if (filter === "participants") {
        const participations = await prisma.editionParticipation.findMany({
          where: { editionId: activeEdition.id, isAttending: true },
          select: { user: { select: { email: true } } },
        })
        recipients = participations.map((p) => p.user.email)
      } else if (filter === "non_participants") {
        const participantIds = await prisma.editionParticipation.findMany({
          where: { editionId: activeEdition.id, isAttending: true },
          select: { userId: true },
        })
        const ids = participantIds.map((p) => p.userId)
        const users = await prisma.user.findMany({
          where: { id: { notIn: ids } },
          select: { email: true },
        })
        recipients = users.map((u) => u.email)
      } else if (filter === "not_paid") {
        const participations = await prisma.editionParticipation.findMany({
          where: { editionId: activeEdition.id, isAttending: true, hasPaid: false },
          select: { user: { select: { email: true } } },
        })
        recipients = participations.map((p) => p.user.email)
      } else if (filter === "paid") {
        const participations = await prisma.editionParticipation.findMany({
          where: { editionId: activeEdition.id, isAttending: true, hasPaid: true },
          select: { user: { select: { email: true } } },
        })
        recipients = participations.map((p) => p.user.email)
      } else if (filter === "speakers") {
        const conferences = await prisma.conference.findMany({
          where: { editionId: activeEdition.id },
          select: { speaker: { select: { email: true } } },
        })
        recipients = [...new Set(conferences.map((c) => c.speaker.email))]
      }

      recipients = recipients.filter((email) => email.trim().length > 0)
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: "📭 Aucun utilisateur destinataire trouvé" }, { status: 400 })
    }

    const result = await sendBroadcastEmail({
      subject: parsed.data.subject,
      message: parsed.data.message,
      recipients,
    })

    return NextResponse.json({
      mode: parsed.data.sendToAdminOnly ? "admin_test" : "broadcast",
      total: result.total,
      sent: result.sent,
      failed: result.failed,
      errors: result.errors.slice(0, 20),
    })
  } catch (error) {
    console.error("📧🚨 Erreur lors de l'envoi d'email global:", error)
    const message = error instanceof Error ? error.message : "❌ Erreur serveur"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
