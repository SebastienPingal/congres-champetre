"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ConferenceForm } from "@/components/conference-form"
import { ConferenceEditForm } from "@/components/conference-edit-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CalendarDays, MapPin, Users } from "lucide-react"
import { WeekendProgram } from "@/components/weekend-program"
import { ConferenceDeleteButton } from "@/components/conference-delete-button"

interface EditionInfo {
  id: string
  name: string
  startDate: string | null
  endDate: string | null
}

interface User {
  id: string
  name: string
  email: string
  role: string
  wantsToSpeak: boolean
  isAttending: boolean
  attendanceDays: 'NONE' | 'DAY1' | 'DAY2' | 'BOTH'
  sleepsOnSite: boolean
  edition: EditionInfo
  conferences: Array<{
    id: string
    title: string
    description?: string
    timeSlot?: {
      id: string
      title: string
      startTime: string
      endTime: string
    }
  }>
}

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

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [pendingAttendanceDays, setPendingAttendanceDays] = useState<User["attendanceDays"] | null>(null)
  const [editingConferenceId, setEditingConferenceId] = useState<string | null>(null)

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/user/profile")
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error) {
      console.error("🚨 Erreur lors du chargement du profil:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const buildGoogleCalendarUrl = (
    selection: 'DAY1' | 'DAY2' | 'BOTH'
  ) => {
    const title = user?.edition?.name ?? 'Congrès Champêtre'
    const location = '4 allée des tertres, 77250 Moret-Loing-et-Orvanne'
    const details = `Weekend de conférences et de partage entre amis.`

    if (!user?.edition?.startDate || !user?.edition?.endDate) {
      return null
    }

    const start = new Date(user.edition.startDate)
    const end = new Date(user.edition.endDate)

    const toCalDate = (d: Date) =>
      `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`

    const addDay = (d: Date) => {
      const next = new Date(d)
      next.setDate(next.getDate() + 1)
      return next
    }

    let dates: string
    if (selection === 'DAY1') {
      dates = `${toCalDate(start)}/${toCalDate(addDay(start))}`
    } else if (selection === 'DAY2') {
      dates = `${toCalDate(end)}/${toCalDate(addDay(end))}`
    } else {
      dates = `${toCalDate(start)}/${toCalDate(addDay(end))}`
    }

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      details,
      location,
      trp: 'false',
      dates
    })
    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }

  const handleAddToGoogleCalendar = () => {
    if (!user || !user.isAttending) return
    const selection = user.attendanceDays
    if (selection === 'NONE') return
    const url = buildGoogleCalendarUrl(selection)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleWantsToSpeakChange = async (checked: boolean) => {
    setIsUpdating(true)
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wantsToSpeak: checked }),
      })

      if (response.ok) {
        const result = await response.json()
        setUser(result.user)
      }
    } catch (error) {
      console.error("🚨 Erreur lors de la mise à jour:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleIsAttendingChange = async (checked: boolean) => {
    if (!user) return
    setIsUpdating(true)
    try {
      const payload: Record<string, unknown> = { isAttending: checked }
      if (checked && user.attendanceDays === 'NONE') {
        payload.attendanceDays = 'BOTH'
      }
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (response.ok) {
        const result = await response.json()
        setUser(result.user)
      }
    } catch (error) {
      console.error("🚨 Erreur lors de la mise à jour de la présence:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAttendanceDaysChange = async (value: 'NONE' | 'DAY1' | 'DAY2' | 'BOTH') => {
    setIsUpdating(true)
    setPendingAttendanceDays(value)
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceDays: value }),
      })
      if (response.ok) {
        const result = await response.json()
        setUser(result.user)
      }
    } catch (error) {
      console.error("🚨 Erreur lors de la mise à jour des jours de présence:", error)
    } finally {
      setIsUpdating(false)
      setPendingAttendanceDays(null)
    }
  }

  const handleSleepsOnSiteChange = async (checked: boolean) => {
    setIsUpdating(true)
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sleepsOnSite: checked }),
      })
      if (response.ok) {
        const result = await response.json()
        setUser(result.user)
      }
    } catch (error) {
      console.error("🚨 Erreur lors de la mise à jour de l'hébergement:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleConferenceCreated = () => {
    fetchUserProfile()
  }

  const handleConferenceUpdated = () => {
    fetchUserProfile()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p>Erreur lors du chargement du profil</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenue, {user.name} !
          </h1>
          <p className="text-gray-600">
            Gérez votre participation — {user.edition.name}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">

          <WeekendProgram className="md:col-span-2" />

          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Informations — {user.edition.name}
              </CardTitle>
              <CardDescription>
                Détails pratiques et planning
              </CardDescription>
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
                    <p className="text-sm text-gray-700">{formatEditionDates(user.edition)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg ring-1 ring-amber-200 bg-amber-50/60 p-3 md:col-span-2">
                  <div className="rounded-md bg-amber-100 p-2 text-amber-700">
                    <Users className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">Participants</p>
                    <p className="text-sm text-gray-700">Liste en cours de constitution</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RSVP / Présence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Présence au weekend
              </CardTitle>
              <CardDescription>
                Indiquez vos disponibilités et hébergement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="isAttending"
                    checked={user.isAttending}
                    onCheckedChange={(v) => handleIsAttendingChange(Boolean(v))}
                    disabled={isUpdating}
                  />
                  <label htmlFor="isAttending" className="text-sm font-medium">
                    Je serai présent
                  </label>
                </div>

                {user.isAttending && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <Label id="attendanceDaysLabel" className="text-sm font-medium">Jours de présence</Label>
                    </div>
                    <div
                      className="flex flex-wrap items-center gap-2"
                      role="radiogroup"
                      aria-labelledby="attendanceDaysLabel"
                    >
                      {(() => {
                        const selectedDays = pendingAttendanceDays ?? user.attendanceDays
                        return (
                          <>
                          <Button
                        type="button"
                            role="radio"
                            aria-checked={selectedDays === 'BOTH'}
                            variant={selectedDays === 'BOTH' ? 'default' : 'outline'}
                            onClick={() => handleAttendanceDaysChange('BOTH')}
                        disabled={isUpdating}
                      >
                        Les deux jours
                      </Button>
                      <Button
                        type="button"
                            role="radio"
                            aria-checked={selectedDays === 'DAY1'}
                            variant={selectedDays === 'DAY1' ? 'default' : 'outline'}
                            onClick={() => handleAttendanceDaysChange('DAY1')}
                        disabled={isUpdating}
                      >
                        Seulement le samedi
                      </Button>
                      <Button
                        type="button"
                            role="radio"
                            aria-checked={selectedDays === 'DAY2'}
                            variant={selectedDays === 'DAY2' ? 'default' : 'outline'}
                            onClick={() => handleAttendanceDaysChange('DAY2')}
                        disabled={isUpdating}
                      >
                        Seulement le dimanche
                      </Button>
                          </>
                        )
                      })()}
                    </div>

                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="sleepsOnSite"
                        checked={user.sleepsOnSite}
                        onCheckedChange={(v) => handleSleepsOnSiteChange(Boolean(v))}
                        disabled={isUpdating || !user.isAttending}
                      />
                      <label htmlFor="sleepsOnSite" className="text-sm font-medium">
                        Je dors sur place
                      </label>
                    </div>

                    {user.edition.startDate && user.edition.endDate && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          onClick={handleAddToGoogleCalendar}
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
          {/* Participation aux conférences */}
          {user.isAttending && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Participation aux conférences
                </CardTitle>
                <CardDescription>
                  Indiquez si vous souhaitez présenter une conférence
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="wantsToSpeak"
                    checked={user.wantsToSpeak}
                    onCheckedChange={handleWantsToSpeakChange}
                    disabled={isUpdating}
                  />
                  <label htmlFor="wantsToSpeak" className="text-sm font-medium">
                    Je souhaite faire une présentation
                  </label>
                </div>

                {user.wantsToSpeak && (
                  <div className="pt-4 border-t">
                    <Badge variant="secondary" className="mb-4">
                      Conférencier inscrit
                    </Badge>

                    {user.conferences.length === 0 ? (
                      <ConferenceForm onConferenceCreated={handleConferenceCreated} />
                    ) : (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold">Votre conférence :</h4>
                        {user.conferences.map((conference) => (
                          <div key={conference.id} className="p-3 bg-gray-50 rounded-lg">
                            <h5 className="font-medium">{conference.title}</h5>
                            {conference.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {conference.description}
                              </p>
                            )}
                            {conference.timeSlot ? (
                              <div className="mt-2 text-sm">
                                <Badge variant="outline">
                                  {conference.timeSlot.title}
                                </Badge>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(conference.timeSlot.startTime).toLocaleString("fr-FR")} - {" "}
                                  {new Date(conference.timeSlot.endTime).toLocaleString("fr-FR")}
                                </p>
                              </div>
                            ) : (
                              <Badge variant="secondary" className="mt-2">
                                En attente d&apos;attribution de créneau
                              </Badge>
                            )}

                            <div className="flex items-center gap-2 mt-3">
                              <Dialog open={editingConferenceId === conference.id} onOpenChange={(open) => setEditingConferenceId(open ? conference.id : null)}>
                                <DialogTrigger asChild>
                                  <Button type="button" variant="outline">Modifier</Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Modifier la conférence</DialogTitle>
                                  </DialogHeader>
                                  <ConferenceEditForm
                                    conference={{
                                      id: conference.id,
                                      title: conference.title,
                                      description: conference.description,
                                      timeSlot: conference.timeSlot ? { id: conference.timeSlot.id } : null
                                    }}
                                    onUpdated={handleConferenceUpdated}
                                    onClose={() => setEditingConferenceId(null)}
                                  />
                                </DialogContent>
                              </Dialog>
                              <ConferenceDeleteButton
                                conferenceId={conference.id}
                                onDeleted={() => {
                                  setEditingConferenceId(null)
                                  fetchUserProfile()
                                }}
                                label="Supprimer"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
