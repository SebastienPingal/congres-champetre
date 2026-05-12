import { prisma } from "@/lib/prisma"
import type { AttendanceDays } from "@/types"

export type ParticipationUpdateInput = {
  isAttending?: boolean | null
  attendanceDays?: AttendanceDays | string
  sleepsOnSite?: boolean | null
  willPayInCash?: boolean
}

export type ParticipationValidationError = { error: string; status: number }

const VALID_ATTENDANCE_DAYS = ["NONE", "DAY1", "DAY2", "BOTH", "UNKNOWN"] as const

/**
 * Construit le payload d'upsert pour `EditionParticipation` à partir du body de la requête.
 *
 * Règles métier appliquées :
 * - `isAttending=false|null` → reset `attendanceDays=NONE` et `sleepsOnSite=null`.
 * - `attendanceDays` ≠ NONE/UNKNOWN → force `isAttending=true`.
 * - `sleepsOnSite=true` interdit si la participation finale a `isAttending` falsy.
 * - Nouvelle participation + `isAttending=true` sans `attendanceDays` explicite → défaut `BOTH`.
 *
 * Renvoie :
 * - `null` si aucun champ participation à mettre à jour.
 * - `{ error, status }` si validation échoue.
 * - `{ data }` sinon, à passer à `upsertParticipation`.
 */
export async function buildParticipationUpdate(
  userId: string,
  editionId: string,
  body: ParticipationUpdateInput,
): Promise<{ data: Record<string, unknown> } | ParticipationValidationError | null> {
  const participationData: Record<string, unknown> = {}
  let needsUpdate = false

  if (typeof body.isAttending === "boolean" || body.isAttending === null) {
    participationData.isAttending = body.isAttending
    needsUpdate = true
    if (body.isAttending === false || body.isAttending === null) {
      participationData.attendanceDays = "NONE"
      participationData.sleepsOnSite = null
    }
  }

  if (typeof body.attendanceDays === "string") {
    if (!VALID_ATTENDANCE_DAYS.includes(body.attendanceDays as typeof VALID_ATTENDANCE_DAYS[number])) {
      return { error: "📝 Valeur attendanceDays invalide", status: 400 }
    }
    participationData.attendanceDays = body.attendanceDays
    needsUpdate = true
    if (body.attendanceDays !== "NONE" && body.attendanceDays !== "UNKNOWN") {
      participationData.isAttending = true
    }
  }

  if (typeof body.sleepsOnSite === "boolean" || body.sleepsOnSite === null) {
    participationData.sleepsOnSite = body.sleepsOnSite
    needsUpdate = true
  }

  if (typeof body.willPayInCash === "boolean") {
    participationData.willPayInCash = body.willPayInCash
    needsUpdate = true
  }

  if (!needsUpdate) return null

  const existing = await prisma.editionParticipation.findUnique({
    where: { userId_editionId: { userId, editionId } },
  })

  const finalIsAttending =
    "isAttending" in participationData
      ? (participationData.isAttending as boolean | null)
      : (existing?.isAttending ?? null)

  if (body.sleepsOnSite === true && !finalIsAttending) {
    return { error: "📝 Impossible de dormir sur place si non présent", status: 400 }
  }

  if (body.isAttending === true && !existing) {
    participationData.attendanceDays = participationData.attendanceDays ?? "BOTH"
  }

  return { data: participationData }
}

export async function upsertParticipation(
  userId: string,
  editionId: string,
  data: Record<string, unknown>,
) {
  return prisma.editionParticipation.upsert({
    where: { userId_editionId: { userId, editionId } },
    create: {
      userId,
      editionId,
      isAttending: (data.isAttending as boolean | null) ?? null,
      attendanceDays: (data.attendanceDays as AttendanceDays) ?? "NONE",
      sleepsOnSite: (data.sleepsOnSite as boolean | null) ?? null,
      willPayInCash: (data.willPayInCash as boolean | undefined) ?? false,
    },
    update: data,
  })
}
