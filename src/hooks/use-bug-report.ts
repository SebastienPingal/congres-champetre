import { useMutation } from "@tanstack/react-query"
import type { BugReportClientContext } from "@/lib/bug-report"

export interface BugReportPayload {
  description: string
  /** Seulement pour les visiteurs non connectés (sinon l'email du compte est utilisé). */
  contactEmail: string | null
  screenshot: File | null
  context: BugReportClientContext
  /** Horodatage d'ouverture du formulaire (anti-spam). */
  openedAt: number
  /** Champ piège anti-robot : doit rester vide. */
  honeypot: string
}

/** POST `/api/bug-report` (multipart). Pas de cache à mettre à jour. */
export function useSendBugReport() {
  return useMutation({
    mutationFn: async (payload: BugReportPayload) => {
      const form = new FormData()
      form.set("description", payload.description)
      if (payload.contactEmail) form.set("contactEmail", payload.contactEmail)
      if (payload.screenshot) form.set("screenshot", payload.screenshot)
      form.set("context", JSON.stringify(payload.context))
      form.set("openedAt", String(payload.openedAt))
      form.set("website", payload.honeypot)

      const res = await fetch("/api/bug-report", { method: "POST", body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Le signalement n'a pas pu être envoyé.")
      return data
    },
  })
}
