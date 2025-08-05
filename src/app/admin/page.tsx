"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TimeSlotManager } from "@/components/admin/timeslot-manager"
import { ConferenceManager } from "@/components/admin/conference-manager"

interface TimeSlot {
  id: string
  title: string
  startTime: string
  endTime: string
  isAvailable: boolean
  conferences: Array<{
    id: string
    title: string
    speaker: {
      id: string
      name: string
      email: string
    }
  }>
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
  const { data: session, status } = useSession()
  const router = useRouter()
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [conferences, setConferences] = useState<Conference[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    if (session.user.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }
    fetchData()
  }, [session, status, router])

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

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== "ADMIN") {
    return null
  }

  const assignedConferences = conferences.filter(c => c.timeSlot)
  const unassignedConferences = conferences.filter(c => !c.timeSlot)

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
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

        {/* Statistiques rapides */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{timeSlots.length}</div>
                <p className="text-sm text-gray-600">Créneaux</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{conferences.length}</div>
                <p className="text-sm text-gray-600">Conférences</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{assignedConferences.length}</div>
                <p className="text-sm text-gray-600">Assignées</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{unassignedConferences.length}</div>
                <p className="text-sm text-gray-600">En attente</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Gestion des créneaux */}
          <div className="space-y-6">
            <TimeSlotManager 
              timeSlots={timeSlots}
              onTimeSlotCreated={handleTimeSlotCreated}
            />
            
            {/* Conférences en attente d'attribution */}
            {unassignedConferences.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Conférences en attente
                  </CardTitle>
                  <CardDescription>
                    Conférences sans créneau assigné
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {unassignedConferences.map((conference) => (
                      <div key={conference.id} className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                        <h4 className="font-medium">{conference.title}</h4>
                        <p className="text-sm text-gray-600">
                          {conference.speaker.name}
                        </p>
                        {conference.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {conference.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Gestion des conférences */}
          <div>
            <ConferenceManager 
              conferences={conferences}
              timeSlots={timeSlots}
              onConferenceUpdated={handleConferenceUpdated}
            />
          </div>
        </div>
      </div>
    </div>
  )
}