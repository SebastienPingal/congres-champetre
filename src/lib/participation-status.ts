/**
 * Statut de validation d'une participation — logique partagée client/serveur.
 *
 * ⚠ Module volontairement pur (aucun import Prisma) pour rester importable
 * depuis les composants clients. La logique DB vit dans `src/lib/participation.ts`.
 */

export interface ParticipationValidationInput {
  /** `EditionParticipation.isAttending` */
  isAttending: boolean | null
  /** `EditionParticipation.hasPaid` */
  hasPaid: boolean
  /** Montant dû en euros — somme des repas PRESENT ayant un prix. */
  amountDue: number
}

/**
 * Une participation est **validée** dès qu'il ne reste rien à régler :
 * - soit le paiement a été encaissé (`hasPaid`),
 * - soit le participant ne doit rien (`amountDue <= 0`, aucun repas payant coché)
 *   → validation automatique, il n'a aucune action à faire.
 *
 * Un utilisateur qui n'a pas confirmé sa présence n'est jamais « validé » :
 * il n'y a pas de participation à valider.
 */
export function isParticipationValidated({
  isAttending,
  hasPaid,
  amountDue,
}: ParticipationValidationInput): boolean {
  if (isAttending !== true) return false
  return hasPaid || amountDue <= 0
}

/**
 * Validé sans paiement : le participant ne doit rien et n'a donc jamais
 * eu à passer par PayPal. Sert à distinguer l'affichage « Merci pour votre
 * règlement » de « Rien à régler ».
 */
export function isValidatedWithoutPayment(input: ParticipationValidationInput): boolean {
  return isParticipationValidated(input) && !input.hasPaid
}
