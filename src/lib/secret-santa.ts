import { randomInt } from "crypto"
import { prisma } from "@/lib/prisma"

export const SECRET_SANTA_MIN_PARTICIPANTS = 3

// Vivier du tirage : volontaires ET présents au weekend.
export function secretSantaPoolWhere(editionId: string) {
  return { editionId, isAttending: true, wantsSecretSanta: true }
}

export async function isSecretSantaDrawn(editionId: string): Promise<boolean> {
  return (await prisma.secretSantaAssignment.count({ where: { editionId } })) > 0
}

/**
 * L'inscription au Secret Santa n'est modifiable que si l'admin l'a activé et
 * tant que le tirage n'a pas eu lieu. Renvoie le message d'erreur (409) sinon.
 */
export async function getSecretSantaOptInError(edition: {
  id: string
  secretSantaEnabled: boolean
}): Promise<string | null> {
  if (!edition.secretSantaEnabled) return "🎁 Le Secret Santa n'est pas ouvert"
  if (await isSecretSantaDrawn(edition.id)) return "🔒 Le tirage du Secret Santa a déjà eu lieu"
  return null
}

// Fisher–Yates avec un aléa cryptographique.
function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Mélange puis chaîne chaque personne à la suivante (la dernière offre à la
// première) : un seul grand cycle, donc personne ne se tire soi-même et il n'y
// a pas de « paires fermées » A↔B.
export function drawSecretSanta(userIds: string[]): Array<{ giverId: string; receiverId: string }> {
  if (userIds.length < SECRET_SANTA_MIN_PARTICIPANTS) {
    throw new Error(`Il faut au moins ${SECRET_SANTA_MIN_PARTICIPANTS} participants`)
  }
  const order = shuffle(Array.from(new Set(userIds)))
  return order.map((giverId, i) => ({
    giverId,
    receiverId: order[(i + 1) % order.length],
  }))
}
