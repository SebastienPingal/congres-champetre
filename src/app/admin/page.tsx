"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TimeSlotManager } from "@/components/admin/timeslot-manager"
import { ConferenceManager } from "@/components/admin/conference-manager"
import { Users, UserCheck, CalendarRange } from "lucide-react"
import { UsersTable } from "@/components/admin/users-table"

interface TimeSlot {
  id: string
  title: string
  startTime: string
  endTime: string
  conference?: {
    id: string
    title: string
    speaker: {
      id: string
      name: string
      email: string
    }
  }
}

interface Conference {
  id: string
  title: string
  description?: string
  speaker: {
    id: string
    name: string
    email: string
  }
  timeSlot?: {
    id: string
    title: string
    startTime: string
    endTime: string
  }
}

export default function AdminPage() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [conferences, setConferences] = useState<Conference[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<{ totalUsers: number; attendingUsers: number; attendingRate: number } | null>(null)

  useEffect(() => {
    // 🛡️ Middleware ensures we're authenticated and have admin role
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [slotsResponse, conferencesResponse, statsResponse] = await Promise.all([
        fetch("/api/timeslots"),
        fetch("/api/conferences"),
        fetch("/api/admin/stats")
      ])

      if (slotsResponse.ok) {
        const slotsData = await slotsResponse.json()
        setTimeSlots(slotsData)
      }

      if (conferencesResponse.ok) {
        const conferencesData = await conferencesResponse.json()
        setConferences(conferencesData)
      }

      if (statsResponse.ok) {
        const s = await statsResponse.json()
        setStats(s)
      }
    } catch (error) {
      console.error("🚨 Erreur lors du chargement des données:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTimeSlotCreated = () => {
    fetchData()
  }

  const handleConferenceUpdated = () => {
    fetchData()
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />

      <div className="container flex flex-col gap-4 mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Administration
          </h1>
          <p className="text-gray-600">
            Gérez les créneaux horaires et les conférences
          </p>
        </div>


        {/* Statistiques rapides */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 text-blue-700">
                  <CalendarRange className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {timeSlots.length}
                  </p>
                  <p className="text-sm text-gray-600">
                    Créneaux créés
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-100 text-purple-700">
                  <CalendarRange className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {conferences.length}
                  </p>
                  <p className="text-sm text-gray-600">
                    Conférences proposées
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-emerald-100 text-emerald-700">
                  <CalendarRange className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {conferences.filter(c => c.timeSlot).length}
                  </p>
                  <p className="text-sm text-gray-600">
                    Conférences planifiées
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-amber-100 text-amber-700">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats ? stats.totalUsers : "—"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Utilisateurs inscrits
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>


        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 text-green-700">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats ? stats.attendingUsers : "—"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Participants au weekend
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-sky-100 text-sky-700">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats ? `${stats.attendingRate}%` : "—"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Taux de participation
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Gestion des créneaux */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Gestion des créneaux
              </CardTitle>
              <CardDescription>
                Créez et gérez les créneaux horaires disponibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TimeSlotManager
                timeSlots={timeSlots}
                onTimeSlotCreated={handleTimeSlotCreated}
              />
            </CardContent>
          </Card>

          {/* Gestion des conférences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Gestion des conférences
              </CardTitle>
              <CardDescription>
                Assignez les conférences aux créneaux disponibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConferenceManager
                conferences={conferences}
                onConferenceUpdated={handleConferenceUpdated}
              />
            </CardContent>
          </Card>
        </div>

        {/* Utilisateurs */}
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Utilisateurs
              </CardTitle>
              <CardDescription>
                Liste des inscrits et leurs informations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsersTable />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
