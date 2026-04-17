"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { formatDateTimeRange } from "@/lib/helper"

interface Conference {
  id: string
  speaker: {
    id: string
  }
}

interface UserOption {
  id: string
  name: string | null
  email: string
}

interface TimeSlot {
  id: string
  title: string
  startTime: string
  endTime: string
  kind?: "CONFERENCE" | "MEAL" | "BREAK" | "OTHER"
  conference?: {
    id: string
  }
}

interface ConferenceCreateDialogProps {
  conferences: Conference[]
  onConferenceCreated: () => void
}

export function ConferenceCreateDialog({ conferences, onConferenceCreated }: ConferenceCreateDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [users, setUsers] = useState<UserOption[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedSpeakerId, setSelectedSpeakerId] = useState("")
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState("")
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isOpen) return

    const loadData = async () => {
      setIsLoadingData(true)
      setError("")

      try {
        const [usersResponse, slotsResponse] = await Promise.all([
          fetch("/api/admin/users"),
          fetch("/api/timeslots"),
        ])

        if (!usersResponse.ok || !slotsResponse.ok) {
          setError("❌ Impossible de charger les options")
          return
        }

        const usersPayload = await usersResponse.json()
        const slotsPayload = await slotsResponse.json()
        setUsers(usersPayload.users || [])
        setTimeSlots(slotsPayload || [])
      } catch {
        setError("❌ Une erreur est survenue lors du chargement")
      } finally {
        setIsLoadingData(false)
      }
    }

    void loadData()
  }, [isOpen])

  const speakerIdsWithConference = useMemo(
    () => new Set(conferences.map((conference) => conference.speaker.id)),
    [conferences]
  )

  const availableSpeakers = useMemo(
    () => users.filter((user) => !speakerIdsWithConference.has(user.id)),
    [users, speakerIdsWithConference]
  )

  const availableTimeSlots = useMemo(
    () => timeSlots.filter((slot) => slot.kind === "CONFERENCE" && !slot.conference),
    [timeSlots]
  )

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setSelectedSpeakerId("")
    setSelectedTimeSlotId("")
    setError("")
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      resetForm()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!title.trim()) {
      setError("Le titre est requis")
      return
    }

    if (!selectedSpeakerId) {
      setError("Veuillez sélectionner un conférencier")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/conferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          speakerId: selectedSpeakerId,
          timeSlotId: selectedTimeSlotId || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "❌ Une erreur est survenue")
        return
      }

      setIsOpen(false)
      resetForm()
      onConferenceCreated()
    } catch {
      setError("❌ Une erreur est survenue lors de la création")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Ajouter une conférence</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une conférence</DialogTitle>
          <DialogDescription>
            Choisissez un conférencier puis assignez un créneau si besoin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="conference-title">Titre *</Label>
            <Input
              id="conference-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la conférence"
              required
              disabled={isLoadingData || isSubmitting}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="conference-description">Description</Label>
            <Input
              id="conference-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optionnel)"
              disabled={isLoadingData || isSubmitting}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="conference-speaker">Conférencier *</Label>
            <select
              id="conference-speaker"
              value={selectedSpeakerId}
              onChange={(e) => setSelectedSpeakerId(e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              disabled={isLoadingData || isSubmitting || availableSpeakers.length === 0}
              required
            >
              <option value="">Sélectionnez un conférencier</option>
              {availableSpeakers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || "Sans nom"} ({user.email})
                </option>
              ))}
            </select>
            {availableSpeakers.length === 0 && !isLoadingData && (
              <p className="text-sm text-gray-500">
                Tous les utilisateurs ont déjà une conférence sur cette édition.
              </p>
            )}
          </div>

          {!isLoadingData && availableTimeSlots.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label>Créneau (optionnel)</Label>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="admin-no-slot"
                    name="timeSlot"
                    value=""
                    checked={selectedTimeSlotId === ""}
                    onChange={(e) => setSelectedTimeSlotId(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <label htmlFor="admin-no-slot" className="text-sm">
                    Choisir plus tard
                  </label>
                </div>
                {availableTimeSlots.map((slot) => (
                  <div key={slot.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      id={`slot-${slot.id}`}
                      name="timeSlot"
                      value={slot.id}
                      checked={selectedTimeSlotId === slot.id}
                      onChange={(e) => setSelectedTimeSlotId(e.target.value)}
                      disabled={isSubmitting}
                    />
                    <label htmlFor={`slot-${slot.id}`} className="text-sm flex items-center gap-2">
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

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={isLoadingData || isSubmitting || availableSpeakers.length === 0} className="flex-1">
              {isSubmitting ? "Création..." : "Créer la conférence"}
            </Button>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
