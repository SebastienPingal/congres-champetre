"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { formatDateTimeRange } from "@/lib/helper"

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

interface TimeSlot {
  id: string
  title: string
  startTime: string
  endTime: string
  isAvailable: boolean
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

interface ConferenceManagerProps {
  conferences: Conference[]
  timeSlots: TimeSlot[]
  onConferenceUpdated: () => void
}

export function ConferenceManager({ conferences, timeSlots, onConferenceUpdated }: ConferenceManagerProps) {
  const [selectedConference, setSelectedConference] = useState<Conference | null>(null)
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const openAssignDialog = (conference: Conference) => {
    setSelectedConference(conference)
    setSelectedTimeSlotId(conference.timeSlot?.id || "")
    setIsDialogOpen(true)
    setError("")
  }

  const handleAssignTimeSlot = async () => {
    if (!selectedConference) return

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/conferences/${selectedConference.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeSlotId: selectedTimeSlotId || null,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setIsDialogOpen(false)
        setSelectedConference(null)
        setSelectedTimeSlotId("")
        onConferenceUpdated()
      } else {
        setError(result.error || "❌ Une erreur est survenue")
      }
    } catch {
      setError("❌ Une erreur est survenue lors de l&apos;assignation")
    } finally {
      setIsLoading(false)
    }
  }

  const getAvailableSlots = () => {
    return timeSlots.filter(slot => {
      // Slot disponible ET (soit vide, soit occupé par la conférence actuelle)
      return slot.isAvailable && (
        !slot.conference ||
        (selectedConference && slot.conference.id === selectedConference.id)
      )
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Gestion des conférences
        </CardTitle>
        <CardDescription>
          Assignez des créneaux aux conférences proposées
        </CardDescription>
      </CardHeader>

      <CardContent>
        {conferences.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">•</div>
            <p>Aucune conférence proposée pour le moment</p>
            <p className="text-sm">Les participants peuvent proposer des conférences depuis leur dashboard</p>
          </div>
        ) : (
          <div className="space-y-4">
            {conferences.map((conference) => (
              <div key={conference.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium">{conference.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {conference.speaker.name} ({conference.speaker.email})
                    </p>
                    {conference.description && (
                      <p className="text-sm text-gray-500 mb-2">
                        {conference.description}
                      </p>
                    )}

                    {conference.timeSlot ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {conference.timeSlot.title}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDateTimeRange(conference.timeSlot.startTime, conference.timeSlot.endTime)}
                        </span>
                      </div>
                    ) : (
                      <Badge variant="secondary">
                        Pas de créneau assigné
                      </Badge>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAssignDialog(conference)}
                  >
                    {conference.timeSlot ? "↻" : "+"} {conference.timeSlot ? "Modifier" : "Assigner"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assigner un créneau</DialogTitle>
              <DialogDescription>
                Choisissez un créneau pour la conférence &quot;{selectedConference?.title}&quot;
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Créneaux disponibles</Label>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="no-slot"
                      name="timeSlot"
                      value=""
                      checked={selectedTimeSlotId === ""}
                      onChange={(e) => setSelectedTimeSlotId(e.target.value)}
                      disabled={isLoading}
                    />
                    <label htmlFor="no-slot" className="text-sm">
                      Retirer l&apos;assignation
                    </label>
                  </div>

                  {getAvailableSlots().map((slot) => (
                    <div key={slot.id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        id={slot.id}
                        name="timeSlot"
                        value={slot.id}
                        checked={selectedTimeSlotId === slot.id}
                        onChange={(e) => setSelectedTimeSlotId(e.target.value)}
                        disabled={isLoading}
                      />
                      <label htmlFor={slot.id} className="text-sm flex items-center gap-2 flex-1">
                        <Badge variant="outline">{slot.title}</Badge>
                        <span className="text-xs text-gray-500">
                          {formatDateTimeRange(slot.startTime, slot.endTime)}
                        </span>
                        {slot.conference && slot.conference.id === selectedConference?.id && (
                          <Badge variant="secondary" className="text-xs">
                            Actuellement assigné
                          </Badge>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleAssignTimeSlot} disabled={isLoading} className="flex-1">
                  {isLoading ? "Assignation..." : "Confirmer"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isLoading}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}