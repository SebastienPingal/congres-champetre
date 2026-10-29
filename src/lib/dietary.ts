/**
 * Régimes alimentaires — logique partagée client/serveur.
 *
 * ⚠ Module volontairement pur (aucun import Prisma) pour rester importable
 * depuis les composants clients. Stockés sur `User.dietaryRestrictions` (valeurs
 * ci-dessous) + `User.dietaryNotes` (texte libre « Autre »).
 */

export const DIETARY_OPTIONS = [
  { value: "VEGETARIAN", label: "Végétarien" },
  { value: "VEGAN", label: "Végan" },
  { value: "GLUTEN_FREE", label: "Sans gluten" },
  { value: "LACTOSE_FREE", label: "Sans lactose" },
  { value: "NO_PORK", label: "Sans porc" },
  { value: "NUT_ALLERGY", label: "Allergie aux fruits à coque" },
  { value: "BIG_EATER", label: "Je suis un gros mangeur" },
] as const

export type DietaryRestriction = (typeof DIETARY_OPTIONS)[number]["value"]

export const DIETARY_NOTES_MAX_LENGTH = 500

const DIETARY_LABELS = Object.fromEntries(
  DIETARY_OPTIONS.map((o) => [o.value, o.label]),
) as Record<DietaryRestriction, string>

export function isDietaryRestriction(value: unknown): value is DietaryRestriction {
  return typeof value === "string" && value in DIETARY_LABELS
}

/** Garde les valeurs connues, sans doublon, dans l'ordre de `DIETARY_OPTIONS`. */
export function sanitizeDietaryRestrictions(values: unknown): DietaryRestriction[] {
  if (!Array.isArray(values)) return []
  return DIETARY_OPTIONS.map((o) => o.value).filter((v) => values.includes(v))
}

/** Texte libre : trim + tronqué ; vide → `null`. */
export function sanitizeDietaryNotes(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim().slice(0, DIETARY_NOTES_MAX_LENGTH)
  return trimmed || null
}

/** Résumé lisible : « Végétarien, Sans gluten — allergie kiwi ». `null` si rien. */
export function formatDiet(restrictions: string[], notes: string | null): string | null {
  const labels = restrictions.filter(isDietaryRestriction).map((v) => DIETARY_LABELS[v])
  const parts = [labels.join(", "), notes ?? ""].filter(Boolean)
  return parts.length > 0 ? parts.join(" — ") : null
}
