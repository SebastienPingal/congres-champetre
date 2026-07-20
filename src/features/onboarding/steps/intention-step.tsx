"use client"

import { IntentionLetterContent } from "../intention-letter"

/**
 * Première étape de l'onboarding : la lettre d'intention.
 * Le bouton "Continuer" est rendu par le pied figé de la modal
 * (`onboarding-modal.tsx`), pas ici.
 */
export function IntentionStep() {
  return <IntentionLetterContent />
}
