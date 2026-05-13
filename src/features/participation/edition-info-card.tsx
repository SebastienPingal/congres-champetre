"use client"

import { CalendarDays, MapPin, Users } from "lucide-react"
import type { EditionInfo } from "@/types"

function formatEditionDates(edition: EditionInfo): string {
  if (!edition.startDate && !edition.endDate) return "Dates à définir"
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }
  if (edition.startDate && edition.endDate) {
    const start = new Date(edition.startDate)
    const end = new Date(edition.endDate)
    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString("fr-FR", opts)
    }
    return `Du ${start.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} au ${end.toLocaleDateString("fr-FR", opts)}`
  }
  if (edition.startDate) return `À partir du ${new Date(edition.startDate).toLocaleDateString("fr-FR", opts)}`
  return `Jusqu'au ${new Date(edition.endDate!).toLocaleDateString("fr-FR", opts)}`
}

export function EditionInfoCard({ edition }: { edition: EditionInfo }) {
  const participantsLabel = `${edition.participantCount} ${edition.participantCount > 1 ? "participants inscrits" : "participant inscrit"}`

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <MapPin className="h-4 w-4 text-primary/70" aria-hidden="true" />
        4 allée des tertres, 77250 Moret-Loing-et-Orvanne
      </span>
      <span className="text-muted-foreground/40">·</span>
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays className="h-4 w-4 text-primary/70" aria-hidden="true" />
        {formatEditionDates(edition)}
      </span>
      <span className="text-muted-foreground/40">·</span>
      <span className="inline-flex items-center gap-1.5">
        <Users className="h-4 w-4 text-primary/70" aria-hidden="true" />
        {participantsLabel}
      </span>
    </div>
  )
}
