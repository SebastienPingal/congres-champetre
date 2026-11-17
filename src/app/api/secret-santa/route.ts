import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveEdition, NoActiveEditionError } from "@/lib/edition"

// Le nom du destinataire n'est renvoyé qu'une fois le cadeau ouvert
// (`POST /api/secret-santa/reveal`), pour ne pas gâcher la surprise.
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "🔒 Non authentifié" }, { status: 401 })

    const edition = await getActiveEdition()
    const [assignment, drawnCount, participation] = await Promise.all([
      prisma.secretSantaAssignment.findUnique({
        where: { editionId_giverId: { editionId: edition.id, giverId: session.user.id } },
        select: { revealedAt: true, receiver: { select: { name: true, email: true } } },
      }),
      prisma.secretSantaAssignment.count({ where: { editionId: edition.id } }),
      prisma.editionParticipation.findUnique({
        where: { userId_editionId: { userId: session.user.id, editionId: edition.id } },
        select: { wantsSecretSanta: true, isAttending: true },
      }),
    ])

    const base = {
      enabled: edition.secretSantaEnabled,
      drawn: drawnCount > 0,
      wantsSecretSanta: participation?.wantsSecretSanta ?? null,
      isAttending: participation?.isAttending ?? null,
    }

    if (!assignment) return NextResponse.json({ ...base, assigned: false })

    return NextResponse.json({
      ...base,
      assigned: true,
      revealedAt: assignment.revealedAt,
      receiverName: assignment.revealedAt ? (assignment.receiver.name ?? assignment.receiver.email) : null,
    })
  } catch (error) {
    if (error instanceof NoActiveEditionError) {
      return NextResponse.json({ error: "Aucune édition active" }, { status: 503 })
    }
    console.error("🚨 Erreur lors de la récupération du Secret Santa:", error)
    return NextResponse.json({ error: "❌ Erreur lors de la récupération du Secret Santa" }, { status: 500 })
  }
}
