"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { ConferenceEditForm } from "@/components/conference-edit-form"

interface TimeSlot {
  id: string
  title: string
  startTime: string
  endTime: string
  kind?: 'CONFERENCE' | 'MEAL' | 'BREAK' | 'OTHER'
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

interface TimeSlotManagerProps {
  timeSlots: TimeSlot[]
  onTimeSlotCreated: () => void
}

export function TimeSlotManager({ timeSlots, onTimeSlotCreated }: TimeSlotManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [startDateTime, setStartDateTime] = useState<Date>()
  const [endDateTime, setEndDateTime] = useState<Date>()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [createKind, setCreateKind] = useState<'CONFERENCE' | 'MEAL' | 'BREAK' | 'OTHER'>('CONFERENCE')

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editStartDateTime, setEditStartDateTime] = useState<Date>()
  const [editEndDateTime, setEditEndDateTime] = useState<Date>()
  const [editKind, setEditKind] = useState<'CONFERENCE' | 'MEAL' | 'BREAK' | 'OTHER'>('CONFERENCE')
  const [editIsLoading, setEditIsLoading] = useState(false)
  const [editError, setEditError] = useState("")

  // Conference edit from left column
  const [editingConferenceId, setEditingConferenceId] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!title.trim() || !startDateTime || !endDateTime) {
      setError("Tous les champs sont requis")
      setIsLoading(false)
      return
    }

    if (endDateTime <= startDateTime) {
      setError("L'heure de fin doit être après l'heure de début")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/timeslots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
            kind: createKind,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setTitle("")
        setStartDateTime(undefined)
        setEndDateTime(undefined)
        setCreateKind('CONFERENCE')
        setIsDialogOpen(false)
        onTimeSlotCreated()
      } else {
        setError(result.error || "Une erreur est survenue")
      }
    } catch {
      setError("❌ Une erreur est survenue lors de la création")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    })
  }

  const openEditDialog = (slot: TimeSlot) => {
    setEditingSlot(slot)
    setEditTitle(slot.title)
    setEditStartDateTime(new Date(slot.startTime))
    setEditEndDateTime(new Date(slot.endTime))
    setEditKind(slot.kind || 'CONFERENCE')
    setEditError("")
    setIsEditDialogOpen(true)
  }

  // Removed explicit assign dialog; handled within edit modal

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSlot) return

    setEditIsLoading(true)
    setEditError("")

    if (!editTitle.trim() || !editStartDateTime || !editEndDateTime) {
      setEditError("Tous les champs sont requis")
      setEditIsLoading(false)
      return
    }

    if (editEndDateTime <= editStartDateTime) {
      setEditError("L'heure de fin doit être après l'heure de début")
      setEditIsLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/timeslots/${editingSlot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          startTime: editStartDateTime.toISOString(),
          endTime: editEndDateTime.toISOString(),
            kind: editKind,
        })
      })

      const result = await response.json()

      if (response.ok) {
        setIsEditDialogOpen(false)
        setEditingSlot(null)
        onTimeSlotCreated()
      } else {
        setEditError(result.error || "Une erreur est survenue")
      }
    } catch {
      setEditError("❌ Une erreur est survenue lors de la mise à jour")
    } finally {
      setEditIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!editingSlot) return
    setEditIsLoading(true)
    setEditError("")

    try {
      const response = await fetch(`/api/timeslots/${editingSlot.id}`, { method: "DELETE" })
      const result = await response.json().catch(() => ({}))

      if (response.ok) {
        setIsEditDialogOpen(false)
        setEditingSlot(null)
        onTimeSlotCreated()
      } else {
        setEditError(result.error || "❌ Impossible de supprimer ce créneau")
      }
    } catch {
      setEditError("❌ Une erreur est survenue lors de la suppression")
    } finally {
      setEditIsLoading(false)
    }
  }

  const handleDisconnectConference = async (conferenceId?: string) => {
    const idToDisconnect = conferenceId ?? editingSlot?.conference?.id
    if (!idToDisconnect) return
    setEditIsLoading(true)
    setEditError("")

    try {
      const response = await fetch(`/api/conferences/${idToDisconnect}` , {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeSlotId: null })
      })
      const result = await response.json().catch(() => ({}))

      if (response.ok) {
        if (isEditDialogOpen) {
          setIsEditDialogOpen(false)
          setEditingSlot(null)
        }
        onTimeSlotCreated()
      } else {
        setEditError(result.error || "❌ Impossible de retirer la conférence du créneau")
      }
    } catch {
      setEditError("❌ Une erreur est survenue lors du retrait")
    } finally {
      setEditIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              Nouveau créneau
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau créneau</DialogTitle>
              <DialogDescription>
                Définissez les détails du créneau horaire
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">Titre du créneau</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="ex: Conférence matinale"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Date et heure de début</Label>
                <DateTimePicker
                  date={startDateTime}
                  setDate={setStartDateTime}
                  disabled={isLoading}
                  placeholder="Choisir la date et l'heure de début"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Date et heure de fin</Label>
                <DateTimePicker
                  date={endDateTime}
                  setDate={setEndDateTime}
                  disabled={isLoading}
                  placeholder="Choisir la date et l'heure de fin"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Type de créneau</Label>
                <div className="flex flex-wrap items-center gap-2">
                  {(['CONFERENCE','MEAL','BREAK','OTHER'] as const).map(k => (
                    <Button
                      key={k}
                      type="button"
                      variant={createKind === k ? 'secondary' : 'outline'}
                      onClick={() => setCreateKind(k)}
                      disabled={isLoading}
                      size="sm"
                    >
                      {k === 'CONFERENCE' ? 'Conférence' : k === 'MEAL' ? 'Repas' : k === 'BREAK' ? 'Pause' : 'Autre'}
                    </Button>
                  ))}
                </div>
              </div>
              {error && (
                <div className="text-sm text-red-600">
                  {error}
                </div>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Création..." : "Créer le créneau"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isLoading}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {timeSlots.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Aucun créneau créé pour le moment</p>
          <p className="text-sm">Commencez par créer votre premier créneau</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {[...timeSlots]
            .sort((a, b) => {
              if (a.title.toLowerCase() === "last") return 1
              if (b.title.toLowerCase() === "last") return -1
              return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            })
            .map((slot) => (
              <div key={slot.id} className="border rounded-lg p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h4 className="font-medium">{slot.title}</h4>
                    <p className="text-sm text-gray-600">{formatDateTime(slot.startTime)}</p>
                    <p className="text-sm text-gray-600">
                      Durée: {Math.round((new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / (1000 * 60))} minutes
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(slot)}>Éditer</Button>
                  </div>
                </div>
                {slot.conference && (
                  <div className="rounded-lg bg-blue-50 p-3">
                    <h5 className="text-sm font-medium">Conférence assignée:</h5>
                    <div className="text-sm flex flex-col gap-2">
                      <p className="font-medium">{slot.conference.title}</p>
                      <p className="text-gray-600">{slot.conference.speaker.name}</p>
                      <div className="flex items-center gap-2">
                        <Dialog open={editingConferenceId === slot.conference.id} onOpenChange={(open) => setEditingConferenceId(open ? slot.conference!.id : null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">Éditer</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Modifier la conférence</DialogTitle>
                            </DialogHeader>
                            <ConferenceEditForm
                              conference={{
                                id: slot.conference.id,
                                title: slot.conference.title,
                                description: undefined,
                                timeSlot: { id: slot.id }
                              }}
                              onUpdated={() => {
                                onTimeSlotCreated()
                              }}
                              onClose={() => setEditingConferenceId(null)}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button variant="destructive" size="sm" onClick={() => handleDisconnectConference(slot.conference?.id)}>
                          Retirer
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          }
        </div>
      )}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le créneau</DialogTitle>
            <DialogDescription>Ajustez les informations du créneau</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-title">Titre du créneau</Label>
              <Input
                id="edit-title"
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                disabled={editIsLoading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Date et heure de début</Label>
              <DateTimePicker
                date={editStartDateTime}
                setDate={setEditStartDateTime}
                disabled={editIsLoading}
                placeholder="Choisir la date et l'heure de début"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Date et heure de fin</Label>
              <DateTimePicker
                date={editEndDateTime}
                setDate={setEditEndDateTime}
                disabled={editIsLoading}
                placeholder="Choisir la date et l'heure de fin"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Type de créneau</Label>
              <div className="flex flex-wrap items-center gap-2">
                {(['CONFERENCE','MEAL','BREAK','OTHER'] as const).map(k => (
                  <Button
                    key={k}
                    type="button"
                    variant={editKind === k ? 'secondary' : 'outline'}
                    onClick={() => setEditKind(k)}
                    disabled={editIsLoading}
                    size="sm"
                  >
                    {k === 'CONFERENCE' ? 'Conférence' : k === 'MEAL' ? 'Repas' : k === 'BREAK' ? 'Pause' : 'Autre'}
                  </Button>
                ))}
              </div>
            </div>
            {editError && (
              <div className="text-sm text-red-600">{editError}</div>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={editIsLoading} className="flex-1">
                {editIsLoading ? "Sauvegarde..." : "Enregistrer"}
              </Button>
              {editingSlot?.conference && (
                <Button type="button" variant="destructive" onClick={() => handleDisconnectConference()} disabled={editIsLoading}>
                  Retirer la conférence
                </Button>
              )}
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={editIsLoading}>
                Supprimer
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={editIsLoading}>
                Annuler
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}