"use client"

import { useState, useEffect } from "react"
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
  kind?: 'CONFERENCE' | 'MEAL' | 'BREAK' | 'OTHER'
  conference?: {
    id: string
    speaker: {
      name: string
    }
  }
}

interface ConferenceFormProps {
  onConferenceCreated: () => void
}

export function ConferenceForm({ onConferenceCreated }: ConferenceFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("")
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSlots, setIsLoadingSlots] = useState(true)
  const [error, setError] = useState("")

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!title.trim()) {
      setError("Le titre est requis")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/conferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          timeSlotId: selectedTimeSlot || null,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setTitle("")
        setDescription("")
        setSelectedTimeSlot("")
        onConferenceCreated()
      } else {
        setError(result.error || "❌ Une erreur est survenue")
      }
    } catch {
      setError("❌ Une erreur est survenue lors de la création")
    } finally {
      setIsLoading(false)
    }
  }

  const availableSlots = timeSlots.filter(slot =>
    slot.kind === 'CONFERENCE' && !slot.conference
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Proposer une conférence</CardTitle>
        <CardDescription>
          Remplissez les informations de votre présentation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre de la conférence *</Label>
            <Input
              id="title"
              type="text"
              placeholder="Le titre de votre présentation..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Input
              id="description"
              type="text"
              placeholder="Courte description de votre conférence..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {!isLoadingSlots && availableSlots.length > 0 && (
            <div className="space-y-2">
              <Label>Créneau souhaité (optionnel)</Label>
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
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600">
              {error}
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Création..." : "Proposer ma conférence"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}