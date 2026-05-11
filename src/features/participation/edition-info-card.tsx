"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, MapPin, Users } from "lucide-react"
import type { EditionInfo } from "@/types"

function formatEditionDates(edition: EditionInfo): string {
  if (!edition.startDate && !edition.endDate) return "Dates à définir"
  const opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric" }
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations — {edition.name}</CardTitle>
        <CardDescription>Détails pratiques et planning</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex items-start gap-3 rounded-lg ring-1 ring-green-200 bg-green-50/60 p-3">
            <div className="rounded-md bg-green-100 p-2 text-green-700">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-medium">Lieu</p>
              <p className="text-sm text-gray-700">4 allée des tertres, 77250 Moret-Loing-et-Orvanne</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg ring-1 ring-blue-200 bg-blue-50/60 p-3">
            <div className="rounded-md bg-blue-100 p-2 text-blue-700">
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-medium">Dates</p>
              <p className="text-sm text-gray-700">{formatEditionDates(edition)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg ring-1 ring-amber-200 bg-amber-50/60 p-3 md:col-span-2">
            <div className="rounded-md bg-amber-100 p-2 text-amber-700">
              <Users className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-medium">Participants</p>
              <p className="text-sm text-gray-700">
                Pour le moment, vous serez {edition.participantCount}{" "}
                {edition.participantCount > 1 ? "participants" : "participant"} au congrès
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
