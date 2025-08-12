"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TimeSlotManager } from "@/components/admin/timeslot-manager"
import { ConferenceManager } from "@/components/admin/conference-manager"

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

  useEffect(() => {
    // 🛡️ Middleware ensures we're authenticated and have admin role
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [slotsResponse, conferencesResponse] = await Promise.all([
        fetch("/api/timeslots"),
        fetch("/api/conferences")
      ])

      if (slotsResponse.ok) {
        const slotsData = await slotsResponse.json()
        setTimeSlots(slotsData)
      }

      if (conferencesResponse.ok) {
        const conferencesData = await conferencesResponse.json()
        setConferences(conferencesData)
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

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Administration
          </h1>
          <p className="text-gray-600">
            Gérez les créneaux horaires et les conférences
          </p>
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

        {/* Statistiques rapides */}
        <div className="grid gap-4 md:grid-cols-3 mt-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="text-2xl">•</div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {timeSlots.length}
                  </p>
                  <p className="text-sm text-gray-600">Créneaux créés</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="text-2xl">•</div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {conferences.length}
                  </p>
                  <p className="text-sm text-gray-600">Conférences proposées</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="text-2xl">•</div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {conferences.filter(c => c.timeSlot).length}
                  </p>
                  <p className="text-sm text-gray-600">Conférences planifiées</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
