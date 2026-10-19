import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveEdition, NoActiveEditionError } from "@/lib/edition"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "🔒 Non authentifié" }, { status: 401 })

    const edition = await getActiveEdition()
    const where = { editionId_giverId: { editionId: edition.id, giverId: session.user.id } }
    const assignment = await prisma.secretSantaAssignment.findUnique({
      where,
      select: { revealedAt: true },
    })

    if (!assignment) {
      return NextResponse.json({ error: "⚠️ Aucun Secret Santa pour toi" }, { status: 404 })
    }

    // On garde la date de la première ouverture.
    const updated = await prisma.secretSantaAssignment.update({
      where,
      data: assignment.revealedAt ? {} : { revealedAt: new Date() },
      select: { revealedAt: true, receiver: { select: { name: true, email: true } } },
    })

    return NextResponse.json({
      assigned: true,
      revealedAt: updated.revealedAt,
      receiverName: updated.receiver.name ?? updated.receiver.email,
    })
  } catch (error) {
    if (error instanceof NoActiveEditionError) {
      return NextResponse.json({ error: "Aucune édition active" }, { status: 503 })
    }
    console.error("🚨 Erreur lors de la révélation du Secret Santa:", error)
    return NextResponse.json({ error: "❌ Erreur lors de la révélation du Secret Santa" }, { status: 500 })
  }
}
