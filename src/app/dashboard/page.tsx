"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ConferenceForm } from "@/components/conference-form"
import { CalendarDays, MapPin, Users } from "lucide-react"
import { WeekendProgram } from "@/components/weekend-program"

interface User {
  id: string
  name: string
  email: string
  role: string
  wantsToSpeak: boolean
  isAttending: boolean
  attendanceDays: 'NONE' | 'DAY1' | 'DAY2' | 'BOTH'
  sleepsOnSite: boolean
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

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    // 🛡️ Middleware ensures we're authenticated, so we can directly fetch user data
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

  const handleWantsToSpeakChange = async (checked: boolean) => {
    setIsUpdating(true)
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
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
          </h1>mt-16 
          <p className="text-gray-600">
            Gérez votre participation au weekend champêtre
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">

          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Informations du weekend
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
                    <p className="text-sm text-gray-700">Weekend du 30 et 31 août 2025</p>
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


          <WeekendProgram />

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
                      <Label htmlFor="attendanceDays" className="text-sm font-medium">Jours de présence</Label>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant={user.attendanceDays === 'BOTH' ? 'secondary' : 'outline'}
                        onClick={() => handleAttendanceDaysChange('BOTH')}
                        disabled={isUpdating}
                      >
                        Les deux jours
                      </Button>
                      <Button
                        type="button"
                        variant={user.attendanceDays === 'DAY1' ? 'secondary' : 'outline'}
                        onClick={() => handleAttendanceDaysChange('DAY1')}
                        disabled={isUpdating}
                      >
                        Seulement le samedi
                      </Button>
                      <Button
                        type="button"
                        variant={user.attendanceDays === 'DAY2' ? 'secondary' : 'outline'}
                        onClick={() => handleAttendanceDaysChange('DAY2')}
                        disabled={isUpdating}
                      >
                        Seulement le dimanche
                      </Button>
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
