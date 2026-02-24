import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendBroadcastEmail } from "@/lib/mail"

const payloadSchema = z.object({
  subject: z.string().trim().min(3, "Le sujet doit contenir au moins 3 caractères").max(200, "Le sujet est trop long"),
  message: z.string().trim().min(5, "Le message doit contenir au moins 5 caractères").max(10000, "Le message est trop long"),
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

    const users = await prisma.user.findMany({
      where: { role: "USER" },
      select: { email: true },
    })
    const recipients = users.map((user) => user.email).filter((email) => email.trim().length > 0)

    if (recipients.length === 0) {
      return NextResponse.json({ error: "📭 Aucun utilisateur destinataire trouvé" }, { status: 400 })
    }

    const result = await sendBroadcastEmail({
      subject: parsed.data.subject,
      message: parsed.data.message,
      recipients,
    })

    return NextResponse.json({
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
