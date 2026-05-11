"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CheckCircle2, CircleDot } from "lucide-react"
import { useState } from "react"
import { useUpdateProfile } from "@/hooks/use-user-profile"
import type { UserProfile, AttendanceDays } from "@/types"

interface PresenceSectionProps {
  user: UserProfile
}

function buildGoogleCalendarUrl(
  selection: Exclude<AttendanceDays, 'NONE' | 'UNKNOWN'>,
  edition: UserProfile['edition']
): string | null {
  if (!edition.startDate || !edition.endDate) return null
  const title = edition.name
  const location = '4 allée des tertres, 77250 Moret-Loing-et-Orvanne'
  const details = 'Weekend de conférences et de partage entre amis.'
  const start = new Date(edition.startDate)
  const end = new Date(edition.endDate)
  const toCalDate = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const addDay = (d: Date) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n }
  let dates: string
  if (selection === 'DAY1') {
    dates = `${toCalDate(start)}/${toCalDate(addDay(start))}`
  } else if (selection === 'DAY2') {
    dates = `${toCalDate(end)}/${toCalDate(addDay(end))}`
  } else {
    dates = `${toCalDate(start)}/${toCalDate(addDay(end))}`
  }
  const params = new URLSearchParams({ action: 'TEMPLATE', text: title, details, location, trp: 'false', dates })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function PresenceSection({ user }: PresenceSectionProps) {
  const { mutate: updateProfile, isPending } = useUpdateProfile()
  const [pendingDays, setPendingDays] = useState<AttendanceDays | null>(null)
  const needsAction = user.isAttending !== true

  const handleAttendingChange = (value: boolean | null) => {
    const payload: Parameters<typeof updateProfile>[0] = { isAttending: value }
    if (value === true && user.attendanceDays === 'NONE') payload.attendanceDays = 'BOTH'
    updateProfile(payload)
  }

  const handleDaysChange = (value: AttendanceDays) => {
    setPendingDays(value)
    updateProfile({ attendanceDays: value }, { onSettled: () => setPendingDays(null) })
  }

  const handleSleepChange = (value: boolean | null) => {
    updateProfile({ sleepsOnSite: value })
  }

  const handleGoogleCalendar = () => {
    const sel = user.attendanceDays
    if (sel === 'NONE' || sel === 'UNKNOWN') return
    const url = buildGoogleCalendarUrl(sel, user.edition)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  const selectedDays = pendingDays ?? user.attendanceDays

  return (
    <Card
      id="section-presence"
      className={needsAction ? "animate-border-rotate animate-border-rotate-green shadow-md" : "border-l-4 border-l-green-300"}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Présence au weekend</CardTitle>
          {needsAction ? (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-300" variant="outline">
              <CircleDot className="h-3 w-3 mr-1" />À compléter
            </Badge>
          ) : (
            <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200" variant="outline">
              <CheckCircle2 className="h-3 w-3 mr-1" />Confirmé
            </Badge>
          )}
        </div>
        <CardDescription>Indiquez vos disponibilités et hébergement</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Serez-vous présent(e) au weekend ?</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={user.isAttending === true ? "default" : "outline"}
                size="sm"
                onClick={() => handleAttendingChange(true)}
                disabled={isPending}
              >
                Oui, je viens !
              </Button>
              <Button
                type="button"
                variant={user.isAttending === false ? "default" : "outline"}
                size="sm"
                onClick={() => handleAttendingChange(false)}
                disabled={isPending}
              >
                Non
              </Button>
              <Button
                type="button"
                variant={user.isAttending === null ? "secondary" : "ghost"}
                size="sm"
                className="text-gray-500"
                onClick={() => handleAttendingChange(null)}
                disabled={isPending}
              >
                Je ne sais pas encore
              </Button>
            </div>
          </div>

          {user.isAttending === true && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label id="attendanceDaysLabel" className="text-sm font-medium">Jours de présence</Label>
              </div>
              <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-labelledby="attendanceDaysLabel">
                {(["BOTH", "DAY1", "DAY2"] as const).map((val) => (
                  <Button
                    key={val}
                    type="button"
                    role="radio"
                    aria-checked={selectedDays === val}
                    variant={selectedDays === val ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleDaysChange(val)}
                    disabled={isPending}
                  >
                    {val === "BOTH" ? "Les deux jours" : val === "DAY1" ? "Seulement le samedi" : "Seulement le dimanche"}
                  </Button>
                ))}
                <Button
                  type="button"
                  role="radio"
                  aria-checked={selectedDays === "UNKNOWN"}
                  variant={selectedDays === "UNKNOWN" ? "secondary" : "ghost"}
                  size="sm"
                  className="text-gray-500"
                  onClick={() => handleDaysChange("UNKNOWN")}
                  disabled={isPending}
                >
                  Je ne sais pas encore
                </Button>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Hébergement sur place ?</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={user.sleepsOnSite === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSleepChange(true)}
                    disabled={isPending}
                  >
                    Oui, je dors sur place
                  </Button>
                  <Button
                    type="button"
                    variant={user.sleepsOnSite === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSleepChange(false)}
                    disabled={isPending}
                  >
                    Non, je rentre
                  </Button>
                  <Button
                    type="button"
                    variant={user.sleepsOnSite === null ? "secondary" : "ghost"}
                    size="sm"
                    className="text-gray-500"
                    onClick={() => handleSleepChange(null)}
                    disabled={isPending}
                  >
                    Je ne sais pas encore
                  </Button>
                </div>
              </div>

              {user.edition.startDate && user.edition.endDate && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={handleGoogleCalendar}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Ajouter à Google Calendar
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
