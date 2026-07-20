"use client"

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
 * Bouton icône discret ouvrant la lettre d'intention dans une modale.
 * Permet de relire la lettre à tout moment (le contenu est aussi affiché
 * en première étape de l'onboarding).
 */
export function IntentionLetterModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
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
