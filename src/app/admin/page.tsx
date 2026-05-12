"use client"

import { useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TimeSlotManager } from "@/components/admin/timeslot-manager"
import { ConferenceManager } from "@/components/admin/conference-manager"
import { Users, UserCheck, CalendarRange } from "lucide-react"
import { EditionManager } from "@/components/admin/edition-manager"
import { useTimeSlots } from "@/hooks/use-time-slots"
import { useConferences } from "@/hooks/use-conferences"
import { useAdminStats } from "@/hooks/use-admin-stats"
import { useEditions } from "@/hooks/use-editions"
import { queryKeys } from "@/lib/query-keys"
import type { AdminTimeSlot } from "@/types"

export default function AdminPage() {
  const qc = useQueryClient()
  const { data: timeSlots = [], isLoading: slotsLoading } = useTimeSlots()
  const { data: conferences = [], isLoading: confsLoading } = useConferences()
  const { data: stats, isLoading: statsLoading } = useAdminStats()
  const { data: editions = [], isLoading: editionsLoading } = useEditions()

  const isLoading = slotsLoading || confsLoading || statsLoading || editionsLoading

  const { activeEditionDays, activeEditionStartHour, activeEditionEndHour } = useMemo(() => {
    const active = editions.find((e) => e.isActive)
    if (!active?.startDate || !active?.endDate) {
      return { activeEditionDays: [] as Date[], activeEditionStartHour: 10, activeEditionEndHour: 20 }
    }
    const days: Date[] = []
    const cur = new Date(active.startDate)
    cur.setHours(0, 0, 0, 0)
    const end = new Date(active.endDate)
    end.setHours(0, 0, 0, 0)
    while (cur <= end) {
      days.push(new Date(cur))
      cur.setDate(cur.getDate() + 1)
    }
    return {
      activeEditionDays: days,
      activeEditionStartHour: active.startHour ?? 10,
      activeEditionEndHour: active.endHour ?? 20,
    }
  }, [editions])

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: queryKeys.timeslots })
    qc.invalidateQueries({ queryKey: queryKeys.conferences })
    qc.invalidateQueries({ queryKey: queryKeys.adminStats })
    qc.invalidateQueries({ queryKey: queryKeys.editions })
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

        {/* Gestion des éditions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Gestion des éditions
            </CardTitle>
            <CardDescription>
              Créez et gérez les différentes éditions de l&apos;événement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditionManager onEditionChanged={refreshAll} />
          </CardContent>
        </Card>

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
                timeSlots={timeSlots as AdminTimeSlot[]}
                onTimeSlotCreated={refreshAll}
                editionDays={activeEditionDays}
                editionStartHour={activeEditionStartHour}
                editionEndHour={activeEditionEndHour}
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
                onConferenceUpdated={refreshAll}
              />
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
