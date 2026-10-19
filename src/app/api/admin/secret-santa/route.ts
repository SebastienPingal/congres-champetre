import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveEdition, NoActiveEditionError } from "@/lib/edition"
import { drawSecretSanta, SECRET_SANTA_MIN_PARTICIPANTS } from "@/lib/secret-santa"

async function getStatus(editionId: string) {
  const [assignments, attending] = await Promise.all([
    prisma.secretSantaAssignment.findMany({
      where: { editionId },
      select: { giverId: true, revealedAt: true, createdAt: true },
    }),
    prisma.editionParticipation.findMany({
      where: { editionId, isAttending: true },
      select: { userId: true },
    }),
  ])

  const drawnIds = new Set(assignments.map((a) => a.giverId))
  const attendingIds = new Set(attending.map((p) => p.userId))

  return {
    drawnAt: assignments[0]?.createdAt ?? null,
    total: assignments.length,
    revealed: assignments.filter((a) => a.revealedAt).length,
    attendingCount: attendingIds.size,
    // Présents qui ne figurent pas dans le tirage (inscrits après coup).
    missingCount: [...attendingIds].filter((id) => !drawnIds.has(id)).length,
    // Tirés qui ne sont plus présents (désistés après coup).
    staleCount: [...drawnIds].filter((id) => !attendingIds.has(id)).length,
    minParticipants: SECRET_SANTA_MIN_PARTICIPANTS,
  }
}

function handleError(error: unknown, context: string) {
  if (error instanceof NoActiveEditionError) {
    return NextResponse.json({ error: "Aucune édition active" }, { status: 503 })
  }
  console.error(`🚨 ${context}:`, error)
  return NextResponse.json({ error: `❌ ${context}` }, { status: 500 })
}

export async function GET() {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const edition = await getActiveEdition()
    return NextResponse.json(await getStatus(edition.id))
  } catch (error) {
    return handleError(error, "Erreur lors de la récupération du Secret Santa")
  }
}

// Lance (ou relance) le tirage : remplace l'éventuel tirage existant.
export async function POST() {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const edition = await getActiveEdition()
    const attending = await prisma.editionParticipation.findMany({
      where: { editionId: edition.id, isAttending: true },
      select: { userId: true },
    })

    if (attending.length < SECRET_SANTA_MIN_PARTICIPANTS) {
      return NextResponse.json(
        { error: `⚠️ Il faut au moins ${SECRET_SANTA_MIN_PARTICIPANTS} participants présents pour lancer le tirage` },
        { status: 409 }
      )
    }

    const pairs = drawSecretSanta(attending.map((p) => p.userId))

    await prisma.$transaction([
      prisma.secretSantaAssignment.deleteMany({ where: { editionId: edition.id } }),
      prisma.secretSantaAssignment.createMany({
        data: pairs.map((p) => ({ ...p, editionId: edition.id })),
      }),
    ])

    return NextResponse.json(await getStatus(edition.id))
  } catch (error) {
    return handleError(error, "Erreur lors du tirage du Secret Santa")
  }
}

export async function DELETE() {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const edition = await getActiveEdition()
    await prisma.secretSantaAssignment.deleteMany({ where: { editionId: edition.id } })

    return NextResponse.json(await getStatus(edition.id))
  } catch (error) {
    return handleError(error, "Erreur lors de l'annulation du Secret Santa")
  }
}
