// Soutien libre : montant facultatif ajouté au paiement des repas pour aider
// à financer le congrès. Toujours en euros entiers, sans frais PayPal ajoutés.
export const SUPPORT_PRESETS = [0, 5, 10, 20] as const
export const MAX_SUPPORT_AMOUNT = 500

/** Renvoie le soutien validé (entier entre 0 et le plafond), ou `null` si invalide. */
export function parseSupportAmount(value: unknown): number | null {
  if (value === undefined || value === null) return 0
  if (typeof value !== "number" || !Number.isInteger(value)) return null
  if (value < 0 || value > MAX_SUPPORT_AMOUNT) return null
  return value
}
