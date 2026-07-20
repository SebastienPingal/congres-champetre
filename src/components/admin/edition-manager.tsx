"use client"

import { useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { MealSlotFields, MealSlotData, emptyMealSlot } from "@/components/admin/meal-slot-fields"
import { useEditions } from "@/hooks/use-editions"
import { queryKeys } from "@/lib/query-keys"

type WizardStep = 'info' | 'meals'

interface EditionManagerProps {
  onEditionChanged?: () => void
}

export function EditionManager({ onEditionChanged }: EditionManagerProps) {
  const qc = useQueryClient()
  const { data: editions = [], isLoading: loading, error: queryError } = useEditions()
  const error = queryError ? "Impossible de charger les éditions" : null

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState<WizardStep>('info')
  const [createdEditionId, setCreatedEditionId] = useState<string | null>(null)

  // Step 1 state
  const [createName, setCreateName] = useState("")
  const [createStartDate, setCreateStartDate] = useState<Date | undefined>()
  const [createEndDate, setCreateEndDate] = useState<Date | undefined>()
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState("")

  // Step 2 state
  const [mealSlots, setMealSlots] = useState<MealSlotData[]>([])

  const wizardDays = useMemo<Date[]>(() => {
    if (!createStartDate || !createEndDate) return []
    const days: Date[] = []
    const cur = new Date(createStartDate)
    cur.setHours(0, 0, 0, 0)
    const end = new Date(createEndDate)
    end.setHours(0, 0, 0, 0)
    while (cur <= end) {
      days.push(new Date(cur))
      cur.setDate(cur.getDate() + 1)
    }
    return days
  }, [createStartDate, createEndDate])
  const [savingMeals, setSavingMeals] = useState(false)
  const [mealsError, setMealsError] = useState("")

  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Edit state
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editStartDate, setEditStartDate] = useState<Date | undefined>()
  const [editEndDate, setEditEndDate] = useState<Date | undefined>()
  const [editStartHour, setEditStartHour] = useState("10")
  const [editEndHour, setEditEndHour] = useState("20")
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState("")

  const openEdit = (edition: (typeof editions)[number]) => {
    setEditId(edition.id)
    setEditName(edition.name)
    setEditStartDate(edition.startDate ? new Date(edition.startDate) : undefined)
    setEditEndDate(edition.endDate ? new Date(edition.endDate) : undefined)
    setEditStartHour(String(edition.startHour ?? 10))
    setEditEndHour(String(edition.endHour ?? 20))
    setEditError("")
  }

  const handleEditOpenChange = (open: boolean) => {
    if (!open) {
      setEditId(null)
      setEditError("")
    }
  }

  const handleUpdateEdition = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editId) return
    if (!editName.trim()) {
      setEditError("Le nom est requis")
      return
    }
    if (!editStartDate || !editEndDate) {
      setEditError("Les dates de début et de fin sont requises")
      return
    }
    if (editEndDate <= editStartDate) {
      setEditError("La date de fin doit être après la date de début")
      return
    }
    const startHour = Number(editStartHour)
    const endHour = Number(editEndHour)
    if (!Number.isInteger(startHour) || startHour < 0 || startHour > 23 ||
        !Number.isInteger(endHour) || endHour < 0 || endHour > 23) {
      setEditError("Les heures doivent être comprises entre 0 et 23")
      return
    }
    if (endHour <= startHour) {
      setEditError("L'heure de fin doit être après l'heure de début")
      return
    }
    setEditLoading(true)
    setEditError("")
    try {
      const res = await fetch(`/api/editions/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          startDate: editStartDate.toISOString(),
          endDate: editEndDate.toISOString(),
          startHour,
          endHour,
        }),
      })
      const result = await res.json()
      if (res.ok) {
        setEditId(null)
        invalidateEditions()
        onEditionChanged?.()
      } else {
        setEditError(result.error || "Erreur lors de la mise à jour")
      }
    } catch {
      setEditError("Erreur lors de la mise à jour")
    } finally {
      setEditLoading(false)
    }
  }

  const invalidateEditions = () => {
    qc.invalidateQueries({ queryKey: queryKeys.editions })
  }

  const resetWizard = () => {
    setWizardStep('info')
    setCreatedEditionId(null)
    setCreateName("")
    setCreateStartDate(undefined)
    setCreateEndDate(undefined)
    setCreateError("")
    setMealSlots([])
    setMealsError("")
  }

  const handleDialogOpenChange = (open: boolean) => {
    setIsCreateOpen(open)
    if (!open) resetWizard()
  }

  const handleCreateEdition = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createName.trim()) {
      setCreateError("Le nom est requis")
      return
    }
    if (!createStartDate || !createEndDate) {
      setCreateError("Les dates de début et de fin sont requises")
      return
    }
    if (createEndDate <= createStartDate) {
      setCreateError("La date de fin doit être après la date de début")
      return
    }
    setCreateLoading(true)
    setCreateError("")

    try {
      const res = await fetch("/api/editions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName.trim(),
          startDate: createStartDate.toISOString(),
          endDate: createEndDate.toISOString(),
        }),
      })
      const result = await res.json()
      if (res.ok) {
        setCreatedEditionId(result.edition?.id ?? result.id)
        setWizardStep('meals')
        invalidateEditions()
        onEditionChanged?.()
      } else {
        setCreateError(result.error || "Erreur lors de la création")
      }
    } catch {
      setCreateError("Erreur lors de la création")
    } finally {
      setCreateLoading(false)
    }
  }

  const handleFinish = async () => {
    if (!createdEditionId) {
      setIsCreateOpen(false)
      resetWizard()
      return
    }

    const validSlots = mealSlots.filter((s) => s.title.trim() && s.startTime && s.endTime)

    if (validSlots.length === 0) {
      setIsCreateOpen(false)
      resetWizard()
      return
    }

    setSavingMeals(true)
    setMealsError("")

    try {
      for (const slot of validSlots) {
        if (!slot.startTime || !slot.endTime) continue
        const res = await fetch("/api/timeslots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: slot.title.trim(),
            startTime: slot.startTime.toISOString(),
            endTime: slot.endTime.toISOString(),
            kind: "MEAL",
            description: slot.description.trim() || null,
            price: slot.price ? Number(slot.price) : null,
            showInRegistration: slot.showInRegistration,
            editionId: createdEditionId,
          }),
        })
        if (!res.ok) {
          const result = await res.json().catch(() => ({}))
          throw new Error(result.error || `Erreur sur le repas "${slot.title}"`)
        }
      }
      setIsCreateOpen(false)
      resetWizard()
      invalidateEditions()
      onEditionChanged?.()
    } catch (err) {
      setMealsError(err instanceof Error ? err.message : "Erreur lors de la création des repas")
    } finally {
      setSavingMeals(false)
    }
  }

  const handleSetActive = async (editionId: string) => {
    setActionLoading(editionId)
    try {
      const res = await fetch(`/api/editions/${editionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      })
      if (res.ok) {
        invalidateEditions()
        onEditionChanged?.()
      }
    } catch {
      // silently fail
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (editionId: string) => {
    setActionLoading(editionId)
    try {
      const res = await fetch(`/api/editions/${editionId}`, {
        method: "DELETE",
      })
      const result = await res.json()
      if (res.ok) {
        invalidateEditions()
        onEditionChanged?.()
      } else {
        alert(result.error || "Impossible de supprimer")
      }
    } catch {
      // silently fail
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">⏳ Chargement des éditions...</div>
  }

  if (error) {
    return <div className="text-sm text-destructive">🚨 {error}</div>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Dialog open={isCreateOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button>Nouvelle édition</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {wizardStep === 'info' ? 'Créer une nouvelle édition' : 'Repas du weekend'}
              </DialogTitle>
              <DialogDescription>
                {wizardStep === 'info'
                  ? 'Étape 1 sur 2 — Informations générales'
                  : 'Étape 2 sur 2 — Créneaux repas (optionnel)'}
              </DialogDescription>
            </DialogHeader>

            {/* Progress bar */}
            <div className="flex gap-1.5 mb-2">
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${wizardStep === 'info' || wizardStep === 'meals' ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${wizardStep === 'meals' ? 'bg-primary' : 'bg-muted'}`} />
            </div>

            {wizardStep === 'info' && (
              <form onSubmit={handleCreateEdition} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edition-name">Nom de l&apos;édition</Label>
                  <Input
                    id="edition-name"
                    type="text"
                    placeholder="ex: Édition 2026"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    required
                    disabled={createLoading}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Début du weekend</Label>
                  <DateTimePicker
                    date={createStartDate}
                    setDate={(d) => {
                      setCreateStartDate(d)
                      if (d && !createEndDate) {
                        const next = new Date(d)
                        next.setDate(next.getDate() + 1)
                        setCreateEndDate(next)
                      }
                    }}
                    disabled={createLoading}
                    placeholder="Choisir la date de début"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Fin du weekend</Label>
                  <DateTimePicker
                    date={createEndDate}
                    setDate={setCreateEndDate}
                    disabled={createLoading}
                    placeholder="Choisir la date de fin"
                  />
                </div>
                {createError && (
                  <div className="text-sm text-destructive">{createError}</div>
                )}
                <div className="flex gap-2">
                  <Button type="submit" disabled={createLoading} className="flex-1">
                    {createLoading ? "Création..." : "Créer l'édition →"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={createLoading}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            )}

            {wizardStep === 'meals' && (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  Ajoutez les créneaux repas du weekend. Vous pourrez en ajouter d&apos;autres plus tard via le gestionnaire de créneaux.
                </p>

                {mealSlots.length > 0 && (
                  <div className="flex flex-col gap-3">
                    {mealSlots.map((slot, i) => (
                      <MealSlotFields
                        key={i}
                        index={i}
                        data={slot}
                        onChange={(updated) =>
                          setMealSlots((prev) => prev.map((s, idx) => (idx === i ? updated : s)))
                        }
                        onRemove={() =>
                          setMealSlots((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        disabled={savingMeals}
                        availableDays={wizardDays}
                      />
                    ))}
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMealSlots((prev) => [...prev, emptyMealSlot()])}
                  disabled={savingMeals}
                >
                  + Ajouter un repas
                </Button>

                {mealsError && (
                  <div className="text-sm text-destructive">{mealsError}</div>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleFinish}
                    disabled={savingMeals}
                    className="flex-1"
                  >
                    {savingMeals
                      ? "Enregistrement..."
                      : mealSlots.filter((s) => s.title.trim()).length === 0
                      ? "Terminer sans repas"
                      : `Terminer (${mealSlots.filter((s) => s.title.trim()).length} repas)`}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setWizardStep('info')}
                    disabled={savingMeals}
                  >
                    Retour
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {editions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Aucune édition créée</p>
          <p className="text-sm">Commencez par créer votre première édition</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {editions.map((edition) => (
            <div
              key={edition.id}
              className={`border rounded-lg p-4 flex flex-col gap-3 ${
                edition.isActive
                  ? "ring-2 ring-primary bg-green-soft/50"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{edition.name}</h4>
                    {edition.isActive && (
                      <Badge className="bg-green-soft text-primary">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(edition.startDate)} → {formatDate(edition.endDate)}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{edition._count?.participations ?? 0} participant(s)</span>
                    <span>{edition._count?.conferences ?? 0} conférence(s)</span>
                    <span>{edition._count?.timeSlots ?? 0} créneau(x)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(edition)}
                    disabled={actionLoading === edition.id}
                  >
                    Éditer
                  </Button>
                  {!edition.isActive && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetActive(edition.id)}
                        disabled={actionLoading === edition.id}
                      >
                        Activer
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(edition.id)}
                        disabled={actionLoading === edition.id}
                      >
                        Supprimer
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog d'édition */}
      <Dialog open={editId !== null} onOpenChange={handleEditOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l&apos;édition</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations générales de l&apos;édition
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateEdition} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-edition-name">Nom de l&apos;édition</Label>
              <Input
                id="edit-edition-name"
                type="text"
                placeholder="ex: Édition 2026"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                disabled={editLoading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Début du weekend</Label>
              <DateTimePicker
                date={editStartDate}
                setDate={setEditStartDate}
                disabled={editLoading}
                placeholder="Choisir la date de début"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Fin du weekend</Label>
              <DateTimePicker
                date={editEndDate}
                setDate={setEditEndDate}
                disabled={editLoading}
                placeholder="Choisir la date de fin"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-start-hour">Heure de début du programme</Label>
                <Input
                  id="edit-start-hour"
                  type="number"
                  min={0}
                  max={23}
                  value={editStartHour}
                  onChange={(e) => setEditStartHour(e.target.value)}
                  disabled={editLoading}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-end-hour">Heure de fin du programme</Label>
                <Input
                  id="edit-end-hour"
                  type="number"
                  min={0}
                  max={23}
                  value={editEndHour}
                  onChange={(e) => setEditEndHour(e.target.value)}
                  disabled={editLoading}
                />
              </div>
            </div>
            {editError && <div className="text-sm text-destructive">{editError}</div>}
            <div className="flex gap-2">
              <Button type="submit" disabled={editLoading} className="flex-1">
                {editLoading ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleEditOpenChange(false)}
                disabled={editLoading}
              >
                Annuler
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
