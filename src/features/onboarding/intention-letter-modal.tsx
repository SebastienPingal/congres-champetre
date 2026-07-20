"use client"

import type { ReactNode } from "react"
import { ScrollText } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { IntentionLetterContent } from "./intention-letter"

/**
 * Modale de la lettre d'intention (nos valeurs). Permet de relire la lettre
 * à tout moment ; le même contenu est affiché en première étape de l'onboarding.
 *
 * Passe un `children` pour fournir ton propre déclencheur (rendu via
 * `DialogTrigger asChild`). Sans enfant, un bouton icône par défaut est utilisé.
 */
export function IntentionLetterModal({ children }: { children?: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children ?? (
          <button
            type="button"
            aria-label="Lire la lettre d'intention"
            title="Lettre d'intention"
            className="flex items-center justify-center shrink-0 rounded-[10px] transition-colors"
            style={{
              width: 34,
              height: 34,
              border: "1px solid var(--line-2)",
              color: "var(--ink)",
              background: "transparent",
            }}
          >
            <ScrollText width={16} height={16} />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Lettre d&apos;intention
          </DialogTitle>
        </DialogHeader>
        <IntentionLetterContent className="mt-1" />
      </DialogContent>
    </Dialog>
  )
}
