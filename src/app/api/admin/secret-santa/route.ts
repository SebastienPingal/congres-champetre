import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveEdition, NoActiveEditionError } from "@/lib/edition"
import { drawSecretSanta, secretSantaPoolWhere, SECRET_SANTA_MIN_PARTICIPANTS } from "@/lib/secret-santa"
import type { Edition } from "@prisma/client"

async function getStatus(edition: Pick<Edition, "id" | "secretSantaEnabled">) {
  const editionId = edition.id
  const [assignments, attending] = await Promise.all([
    prisma.secretSantaAssignment.findMany({
      where: { editionId },
      select: { giverId: true, revealedAt: true, createdAt: true },
    }),
    prisma.editionParticipation.findMany({
      where: { editionId, isAttending: true },
      select: { userId: true, wantsSecretSanta: true },
    }),
  ])

  const drawnIds = new Set(assignments.map((a) => a.giverId))
  // Vivier du tirage : présents ET volontaires.
  const poolIds = new Set(attending.filter((p) => p.wantsSecretSanta === true).map((p) => p.userId))

  return {
    enabled: edition.secretSantaEnabled,
    drawnAt: assignments[0]?.createdAt ?? null,
    total: assignments.length,
    revealed: assignments.filter((a) => a.revealedAt).length,
    attendingCount: attending.length,
    optedInCount: poolIds.size,
    declinedCount: attending.filter((p) => p.wantsSecretSanta === false).length,
    awaitingAnswerCount: attending.filter((p) => p.wantsSecretSanta === null).length,
    // Volontaires présents qui ne figurent pas dans le tirage (inscrits après coup).
    missingCount: [...poolIds].filter((id) => !drawnIds.has(id)).length,
    // Tirés qui ne sont plus dans le vivier (désistés après coup).
    staleCount: [...drawnIds].filter((id) => !poolIds.has(id)).length,
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
    return NextResponse.json(await getStatus(edition))
  } catch (error) {
    return handleError(error, "Erreur lors de la récupération du Secret Santa")
  }
}

const patchSchema = z.object({ enabled: z.boolean() })

// Active / désactive le Secret Santa de l'édition active (ouvre les inscriptions).
export async function PATCH(req: Request) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const parsed = patchSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: "⚠️ Requête invalide" }, { status: 400 })
    }

    const edition = await getActiveEdition()

    if (!parsed.data.enabled) {
      const drawn = await prisma.secretSantaAssignment.count({ where: { editionId: edition.id } })
      if (drawn > 0) {
        return NextResponse.json(
          { error: "⚠️ Annule d'abord le tirage pour désactiver le Secret Santa" },
          { status: 409 }
        )
      }
    }

    const updated = await prisma.edition.update({
      where: { id: edition.id },
      data: { secretSantaEnabled: parsed.data.enabled },
    })

    return NextResponse.json(await getStatus(updated))
  } catch (error) {
    return handleError(error, "Erreur lors de la mise à jour du Secret Santa")
  }
}

// Lance (ou relance) le tirage : remplace l'éventuel tirage existant.
export async function POST() {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const edition = await getActiveEdition()
    if (!edition.secretSantaEnabled) {
      return NextResponse.json({ error: "⚠️ Active d'abord le Secret Santa" }, { status: 409 })
    }

    const pool = await prisma.editionParticipation.findMany({
      where: secretSantaPoolWhere(edition.id),
      select: { userId: true },
    })

    if (pool.length < SECRET_SANTA_MIN_PARTICIPANTS) {
      return NextResponse.json(
        { error: `⚠️ Il faut au moins ${SECRET_SANTA_MIN_PARTICIPANTS} volontaires présents pour lancer le tirage` },
        { status: 409 }
      )
    }

    const pairs = drawSecretSanta(pool.map((p) => p.userId))

    await prisma.$transaction([
      prisma.secretSantaAssignment.deleteMany({ where: { editionId: edition.id } }),
      prisma.secretSantaAssignment.createMany({
        data: pairs.map((p) => ({ ...p, editionId: edition.id })),
      }),
    ])

    return NextResponse.json(await getStatus(edition))
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

    return NextResponse.json(await getStatus(edition))
  } catch (error) {
    return handleError(error, "Erreur lors de l'annulation du Secret Santa")
  }
}
