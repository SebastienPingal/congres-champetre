"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDateTimeRange } from "@/lib/helper"

interface TimeSlot {
  id: string
  title: string
  startTime: string
  endTime: string
  isAvailable: boolean
  kind?: "CONFERENCE" | "MEAL" | "BREAK" | "OTHER"
  conference?: {
    id: string
    speaker: {
      name: string
    }
  }
}

interface ConferenceEditFormProps {
  conference: {
    id: string
    title: string
    description?: string | null
    timeSlot?: {
      id: string
    } | null
  }
  onUpdated: () => void
  onClose?: () => void
}

export function ConferenceEditForm({ conference, onUpdated, onClose }: ConferenceEditFormProps) {
  const [title, setTitle] = useState(conference.title)
  const [description, setDescription] = useState(conference.description ?? "")
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(conference.timeSlot?.id ?? "")
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSlots, setIsLoadingSlots] = useState(true)
  const [error, setError] = useState("")

  const originalTimeSlotId = useMemo(() => conference.timeSlot?.id ?? "", [conference.timeSlot?.id])

  useEffect(() => {
    fetchTimeSlots()
  }, [])

  const fetchTimeSlots = async () => {
    try {
      const response = await fetch("/api/timeslots")
      if (response.ok) {
        const slots = await response.json()
        setTimeSlots(slots)
      }
    } catch (error) {
      console.error("🚨 Erreur lors du chargement des créneaux:", error)
    } finally {
      setIsLoadingSlots(false)
    }
  }

  const availableSlots = useMemo(
    () =>
      timeSlots.filter((slot) =>
        slot.kind === "CONFERENCE" && (
          // Either the slot is free, or it's the one currently assigned to this conference
          (slot.isAvailable && !slot.conference) || slot.conference?.id === conference.id
        )
      ),
    [timeSlots, conference.id]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || null,
      }

      // Only send timeSlotId when it changed to avoid backend re-validating unchanged slot
      if (selectedTimeSlot !== originalTimeSlotId) {
        payload.timeSlotId = selectedTimeSlot || null
      }

      const response = await fetch(`/api/conferences/${conference.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      const result = await response.json()

      if (response.ok) {
        onUpdated()
        onClose?.()
      } else {
        setError(result.error || "❌ Une erreur est survenue")
      }
    } catch {
      setError("❌ Une erreur est survenue lors de la mise à jour")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Modifier votre conférence</CardTitle>
        <CardDescription>Mettez à jour les informations et le créneau</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {!isLoadingSlots && (
            <div className="space-y-2">
              <Label>Créneau</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="no-slot"
                    name="timeSlot"
                    value=""
                    checked={selectedTimeSlot === ""}
                    onChange={(e) => setSelectedTimeSlot(e.target.value)}
                    disabled={isLoading}
                  />
                  <label htmlFor="no-slot" className="text-sm">
                    Je choisirai plus tard
                  </label>
                </div>
                {availableSlots.map((slot) => (
                  <div key={slot.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      id={slot.id}
                      name="timeSlot"
                      value={slot.id}
                      checked={selectedTimeSlot === slot.id}
                      onChange={(e) => setSelectedTimeSlot(e.target.value)}
                      disabled={isLoading}
                    />
                    <label htmlFor={slot.id} className="text-sm flex items-center gap-2">
                      <Badge variant="outline">{slot.title}</Badge>
                      <span className="text-xs text-gray-500">
                        {formatDateTimeRange(slot.startTime, slot.endTime)}
                      </span>
                      {slot.conference?.id === conference.id && (
                        <span className="text-xs text-green-600">(actuel)</span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}


