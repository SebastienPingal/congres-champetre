"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDateTimeRange } from "@/lib/helper"
import { useUpdateConference } from "@/hooks/use-conferences"
import { useTimeSlots } from "@/hooks/use-time-slots"

interface ConferenceEditFormProps {
  conference: {
    id: string
    title: string
    description?: string | null
    timeSlot?: { id: string } | null
  }
  onUpdated?: () => void
  onClose?: () => void
}

export function ConferenceEditForm({ conference, onUpdated, onClose }: ConferenceEditFormProps) {
  const [title, setTitle] = useState(conference.title)
  const [description, setDescription] = useState(conference.description ?? "")
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(conference.timeSlot?.id ?? "")
  const [error, setError] = useState("")

  const originalTimeSlotId = useMemo(() => conference.timeSlot?.id ?? "", [conference.timeSlot?.id])
  const { data: timeSlots = [], isLoading: isLoadingSlots } = useTimeSlots()
  const { mutate: updateConference, isPending } = useUpdateConference()

  const availableSlots = useMemo(
    () =>
      timeSlots.filter(
        (slot) =>
          slot.kind === "CONFERENCE" &&
          (!slot.conference || slot.conference?.id === conference.id)
      ),
    [timeSlots, conference.id]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const payload: Parameters<typeof updateConference>[0] = {
      id: conference.id,
      title: title.trim(),
      description: description.trim() || null,
    }
    if (selectedTimeSlot !== originalTimeSlotId) {
      payload.timeSlotId = selectedTimeSlot || null
    }

    updateConference(payload, {
      onSuccess: () => {
        onUpdated?.()
        onClose?.()
      },
      onError: (err) => setError(err.message),
    })
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
            <Label htmlFor="edit-title">Titre *</Label>
            <Input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Input
              id="edit-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
            />
          </div>

          {!isLoadingSlots && (
            <div className="space-y-2">
              <Label>Créneau</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="edit-no-slot"
                    name="editTimeSlot"
                    value=""
                    checked={selectedTimeSlot === ""}
                    onChange={(e) => setSelectedTimeSlot(e.target.value)}
                    disabled={isPending}
                  />
                  <label htmlFor="edit-no-slot" className="text-sm">Je choisirai plus tard</label>
                </div>
                {availableSlots.map((slot) => (
                  <div key={slot.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      id={`edit-${slot.id}`}
                      name="editTimeSlot"
                      value={slot.id}
                      checked={selectedTimeSlot === slot.id}
                      onChange={(e) => setSelectedTimeSlot(e.target.value)}
                      disabled={isPending}
                    />
                    <label htmlFor={`edit-${slot.id}`} className="text-sm flex items-center gap-2">
                      <Badge variant="outline">{slot.title}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTimeRange(slot.startTime, slot.endTime)}
                      </span>
                      {slot.conference?.id === conference.id && (
                        <span className="text-xs text-primary">(actuel)</span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <div className="text-sm text-destructive">{error}</div>}

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
