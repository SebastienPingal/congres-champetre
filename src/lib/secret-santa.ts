import { randomInt } from "crypto"

export const SECRET_SANTA_MIN_PARTICIPANTS = 3

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
