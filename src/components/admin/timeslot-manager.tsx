"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { DayTimePicker } from "@/components/ui/day-time-picker"
import { ConferenceEditForm } from "@/components/conference-edit-form"
import { type MealSlotData } from "@/components/admin/meal-slot-fields"
import { SlotGrid } from "@/components/admin/slot-grid"

interface TimeSlot {
  id: string
  title: string
  startTime: string
  endTime: string
  kind?: 'CONFERENCE' | 'MEAL' | 'BREAK' | 'OTHER'
  description?: string | null
  price?: number | null
  showInRegistration?: boolean
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
  editionDays?: Date[]
  editionStartHour?: number
  editionEndHour?: number
}

export function TimeSlotManager({ timeSlots, onTimeSlotCreated, editionDays, editionStartHour = 10, editionEndHour = 20 }: TimeSlotManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [startDateTime, setStartDateTime] = useState<Date | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [createKind, setCreateKind] = useState<'CONFERENCE' | 'MEAL' | 'BREAK' | 'OTHER'>('CONFERENCE')
  const [createDuration, setCreateDuration] = useState<number>(1)
  const [createMealData, setCreateMealData] = useState<MealSlotData>({ title: "", startTime: undefined, endTime: undefined, description: "", price: "", showInRegistration: true })

  const useGrid = editionDays && editionDays.length > 0

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editStartDateTime, setEditStartDateTime] = useState<Date>()
  const [editEndDateTime, setEditEndDateTime] = useState<Date>()
  const [editKind, setEditKind] = useState<'CONFERENCE' | 'MEAL' | 'BREAK' | 'OTHER'>('CONFERENCE')
  const [editMealData, setEditMealData] = useState<MealSlotData>({ title: "", startTime: undefined, endTime: undefined, description: "", price: "", showInRegistration: true })
  const [editIsLoading, setEditIsLoading] = useState(false)
  const [editError, setEditError] = useState("")

  // Conference edit from left column
  const [editingConferenceId, setEditingConferenceId] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!title.trim() || !startDateTime) {
      setError("Tous les champs sont requis")
      setIsLoading(false)
      return
    }

    const endDateTime = new Date(startDateTime)
    endDateTime.setHours(startDateTime.getHours() + createDuration, 0, 0, 0)

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
          ...(createKind === 'MEAL' ? {
            description: createMealData.description.trim() || null,
            price: createMealData.price ? Number(createMealData.price) : null,
            showInRegistration: createMealData.showInRegistration,
          } : {}),
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setTitle("")
        setStartDateTime(undefined)
        setCreateKind('CONFERENCE')
        setCreateDuration(1)
        setCreateMealData({ title: "", startTime: undefined, endTime: undefined, description: "", price: "", showInRegistration: true })
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
    setEditMealData({ title: "", startTime: undefined, endTime: undefined, description: slot.description || "", price: slot.price != null ? String(slot.price) : "", showInRegistration: slot.showInRegistration !== false })
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
          description: editKind === 'MEAL' ? (editMealData.description.trim() || null) : null,
          price: editKind === 'MEAL' && editMealData.price ? Number(editMealData.price) : null,
          showInRegistration: editKind === 'MEAL' ? editMealData.showInRegistration : true,
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
              {/* Step 1 — Kind */}
              <div className="flex flex-col gap-2">
                <Label>Type de créneau</Label>
                <div className="flex flex-wrap gap-2">
                  {(['CONFERENCE','MEAL','BREAK','OTHER'] as const).map(k => (
                    <Button key={k} type="button" size="sm"
                      variant={createKind === k ? 'secondary' : 'outline'}
                      onClick={() => { setCreateKind(k); setCreateDuration(k === 'CONFERENCE' ? 1 : createDuration); setStartDateTime(undefined) }}
                      disabled={isLoading}
                    >
                      {k === 'CONFERENCE' ? 'Conférence' : k === 'MEAL' ? 'Repas' : k === 'BREAK' ? 'Pause' : 'Autre'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Step 2 — Duration (not for CONFERENCE, fixed at 1h) */}
              {createKind !== 'CONFERENCE' && (
                <div className="flex flex-col gap-2">
                  <Label>Durée</Label>
                  <div className="flex gap-2">
                    {[1,2,3,4].map(h => (
                      <Button key={h} type="button" size="sm"
                        variant={createDuration === h ? 'secondary' : 'outline'}
                        onClick={() => { setCreateDuration(h); setStartDateTime(undefined) }}
                        disabled={isLoading}
                      >
                        {h}h
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3 — Slot selection */}
              <div className="flex flex-col gap-2">
                <Label>Créneau</Label>
                {useGrid ? (
                  <SlotGrid
                    days={editionDays!}
                    startHour={editionStartHour}
                    endHour={editionEndHour}
                    duration={createKind === 'CONFERENCE' ? 1 : createDuration}
                    existingSlots={timeSlots}
                    selected={startDateTime ?? null}
                    onSelect={setStartDateTime}
                  />
                ) : (
                  <DateTimePicker date={startDateTime} setDate={setStartDateTime} disabled={isLoading} placeholder="Choisir la date et l'heure de début" />
                )}
              </div>

              {/* Step 4 — Title + meal details */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">Titre</Label>
                <Input id="title" type="text"
                  placeholder={createKind === 'CONFERENCE' ? 'ex: Conférence matinale' : createKind === 'MEAL' ? 'ex: Dîner du samedi' : 'ex: Pause café'}
                  value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isLoading}
                />
              </div>

              {createKind === 'MEAL' && (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="create-description">Description du menu</Label>
                    <textarea
                      id="create-description"
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="ex: Barbecue, salades, fromages..."
                      value={createMealData.description}
                      onChange={(e) => setCreateMealData(d => ({ ...d, description: e.target.value }))}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="create-price">Prix (euros)</Label>
                    <Input id="create-price" type="number" min="0" step="0.5" placeholder="ex: 5"
                      value={createMealData.price} onChange={(e) => setCreateMealData(d => ({ ...d, price: e.target.value }))} disabled={isLoading}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="create-showInRegistration" checked={createMealData.showInRegistration}
                      onCheckedChange={(v) => setCreateMealData(d => ({ ...d, showInRegistration: Boolean(v) }))} disabled={isLoading}
                    />
                    <Label htmlFor="create-showInRegistration">Proposer à l&apos;inscription</Label>
                  </div>
                </>
              )}

              {error && <div className="text-sm text-red-600">{error}</div>}
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Création..." : "Créer le créneau"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
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
              {editionDays?.length ? (
                <DayTimePicker days={editionDays} date={editStartDateTime} setDate={setEditStartDateTime} disabled={editIsLoading} placeholder="Choisir le jour et l'heure de début" />
              ) : (
                <DateTimePicker date={editStartDateTime} setDate={setEditStartDateTime} disabled={editIsLoading} placeholder="Choisir la date et l'heure de début" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label>Date et heure de fin</Label>
              {editionDays?.length ? (
                <DayTimePicker days={editionDays} date={editEndDateTime} setDate={setEditEndDateTime} disabled={editIsLoading} placeholder="Choisir le jour et l'heure de fin" />
              ) : (
                <DateTimePicker date={editEndDateTime} setDate={setEditEndDateTime} disabled={editIsLoading} placeholder="Choisir la date et l'heure de fin" />
              )}
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
            {editKind === 'MEAL' && (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-description">Description du menu</Label>
                  <textarea
                    id="edit-description"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="ex: Barbecue, salades, fromages..."
                    value={editMealData.description}
                    onChange={(e) => setEditMealData(d => ({ ...d, description: e.target.value }))}
                    disabled={editIsLoading}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-price">Prix (euros)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="ex: 5"
                    value={editMealData.price}
                    onChange={(e) => setEditMealData(d => ({ ...d, price: e.target.value }))}
                    disabled={editIsLoading}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="edit-showInRegistration"
                    checked={editMealData.showInRegistration}
                    onCheckedChange={(v) => setEditMealData(d => ({ ...d, showInRegistration: Boolean(v) }))}
                    disabled={editIsLoading}
                  />
                  <Label htmlFor="edit-showInRegistration">Proposer à l&apos;inscription</Label>
                </div>
              </>
            )}
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