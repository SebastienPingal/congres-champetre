"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDateTimeRange } from "@/lib/helper"
import { useCreateConference } from "@/hooks/use-conferences"
import { useTimeSlots } from "@/hooks/use-time-slots"

interface ConferenceFormProps {
  onConferenceCreated?: () => void
  /** Wrap the form in a Card with title/description header. Default: true */
  withCard?: boolean
}

export function ConferenceForm({ onConferenceCreated, withCard = true }: ConferenceFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("")
  const [error, setError] = useState("")

  const { data: timeSlots = [], isLoading: isLoadingSlots } = useTimeSlots()
  const { mutate: createConference, isPending } = useCreateConference()

  const availableSlots = timeSlots.filter(
    (slot) => slot.kind === "CONFERENCE" && !slot.conference
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!title.trim()) {
      setError("Le titre est requis")
      return
    }
    createConference(
      {
        title: title.trim(),
        description: description.trim() || null,
        timeSlotId: selectedTimeSlot || null,
      },
      {
        onSuccess: () => {
          setTitle("")
          setDescription("")
          setSelectedTimeSlot("")
          onConferenceCreated?.()
        },
        onError: (err) => setError(err.message),
      }
    )
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="conf-title">Titre de la conférence *</Label>
        <Input
          id="conf-title"
          type="text"
          placeholder="Le titre de votre présentation..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="conf-description">Description (optionnel)</Label>
        <Input
          id="conf-description"
          type="text"
          placeholder="Courte description de votre conférence..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isPending}
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
                disabled={isPending}
              />
              <label htmlFor="no-slot" className="text-sm">Je choisirai plus tard</label>
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
                  disabled={isPending}
                />
                <label htmlFor={slot.id} className="text-sm flex items-center gap-2">
                  <Badge variant="outline">{slot.title}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTimeRange(slot.startTime, slot.endTime)}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <div className="text-sm text-destructive">{error}</div>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Création..." : "Proposer ma conférence"}
      </Button>
    </form>
  )

  if (!withCard) return formContent

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Proposer une conférence</CardTitle>
        <CardDescription>Remplissez les informations de votre présentation</CardDescription>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  )
}
