import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveEdition, NoActiveEditionError } from "@/lib/edition"
import { sendBroadcastEmail } from "@/lib/mail"
import { isSecretSantaDrawn } from "@/lib/secret-santa"

const payloadSchema = z.object({
  // unrevealed / all : tirés (après le tirage). invite : présents qui n'ont pas
  // encore dit s'ils participent (avant le tirage).
  target: z.enum(["unrevealed", "all", "invite"]),
})

// Invitation à s'inscrire : présents sans réponse au Secret Santa.
async function sendInvitations(req: Request, edition: { id: string; name: string; secretSantaEnabled: boolean }) {
  if (!edition.secretSantaEnabled) {
    return NextResponse.json({ error: "⚠️ Le Secret Santa n'est pas activé" }, { status: 409 })
  }
  if (await isSecretSantaDrawn(edition.id)) {
    return NextResponse.json({ error: "⚠️ Le tirage a déjà eu lieu" }, { status: 409 })
  }

  const participations = await prisma.editionParticipation.findMany({
    where: {
      editionId: edition.id,
      isAttending: true,
      wantsSecretSanta: null,
      user: { emailBlacklisted: false },
    },
    select: { user: { select: { email: true } } },
  })

  if (participations.length === 0) {
    return NextResponse.json({ error: "⚠️ Aucun destinataire" }, { status: 409 })
  }

  const link = `${new URL(req.url).origin}/secret-santa`
  const message = [
    "Bonjour,",
    "",
    `Le **Secret Santa** de ${edition.name} est ouvert 🎁`,
    "",
    "Chaque volontaire offrira un petit cadeau à une personne tirée au sort parmi les participants présents au weekend.",
    "",
    `[Je participe (ou pas)](${link})`,
    "",
    "Les inscriptions se ferment au moment du tirage.",
  ].join("\n")

  const result = await sendBroadcastEmail({
    subject: "🎁 Participes-tu au Secret Santa ?",
    message,
    recipients: participations.map((p) => p.user.email),
  })

  return NextResponse.json(result)
}

export async function POST(req: Request) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const parsed = payloadSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: "⚠️ Requête invalide" }, { status: 400 })
    }

    const edition = await getActiveEdition()
    if (parsed.data.target === "invite") return sendInvitations(req, edition)

    const assignments = await prisma.secretSantaAssignment.findMany({
      where: {
        editionId: edition.id,
        ...(parsed.data.target === "unrevealed" ? { revealedAt: null } : {}),
        // Les comptes blacklistés ne reçoivent aucun mail admin.
        giver: { emailBlacklisted: false },
      },
      select: { giver: { select: { email: true } } },
    })

    if (assignments.length === 0) {
      return NextResponse.json({ error: "⚠️ Aucun destinataire" }, { status: 409 })
    }

    // Le nom n'est volontairement pas dans le mail : la surprise se fait sur le site.
    const link = `${new URL(req.url).origin}/secret-santa`
    const message = [
      "Bonjour,",
      "",
      `Le tirage du **Secret Santa** de ${edition.name} a eu lieu 🎁`,
      "",
      "Un cadeau t'attend sur le site : ouvre-le pour découvrir à qui tu vas faire une surprise.",
      "",
      `[Ouvrir mon cadeau](${link})`,
      "",
      "Chut… c'est un secret 🤫",
    ].join("\n")

    const result = await sendBroadcastEmail({
      subject: "🎁 Ton Secret Santa t'attend",
      message,
      recipients: assignments.map((a) => a.giver.email),
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof NoActiveEditionError) {
      return NextResponse.json({ error: "Aucune édition active" }, { status: 503 })
    }
    console.error("🚨 Erreur lors de l'envoi des mails Secret Santa:", error)
    return NextResponse.json({ error: "❌ Erreur lors de l'envoi des mails" }, { status: 500 })
  }
}
