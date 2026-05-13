"use client"

import { Card, CardContent } from "@/components/ui/card"
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

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" aria-hidden="true" />
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  )
}

export function EditionInfoCard({ edition }: { edition: EditionInfo }) {
  const participantsLabel = `${edition.participantCount} ${edition.participantCount > 1 ? "participants inscrits" : "participant inscrit"}`

  return (
    <Card>
      <CardContent className="grid gap-4 sm:grid-cols-3 sm:gap-6 py-4">
        <InfoItem
          icon={MapPin}
          label="Lieu"
          value="4 allée des tertres, 77250 Moret-Loing-et-Orvanne"
        />
        <InfoItem icon={CalendarDays} label="Dates" value={formatEditionDates(edition)} />
        <InfoItem icon={Users} label="Participants" value={participantsLabel} />
      </CardContent>
    </Card>
  )
}
