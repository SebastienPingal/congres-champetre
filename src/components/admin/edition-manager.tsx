"use client"

import { useEffect, useState } from "react"
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

interface Edition {
  id: string
  name: string
  startDate: string | null
  endDate: string | null
  isActive: boolean
  createdAt: string
  _count: {
    participations: number
    conferences: number
    timeSlots: number
  }
}

type WizardStep = 'info' | 'meals'

interface EditionManagerProps {
  onEditionChanged?: () => void
}

export function EditionManager({ onEditionChanged }: EditionManagerProps) {
  const [editions, setEditions] = useState<Edition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const wizardDays: Date[] = (() => {
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
  })()
  const [savingMeals, setSavingMeals] = useState(false)
  const [mealsError, setMealsError] = useState("")

  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchEditions()
  }, [])

  const fetchEditions = async () => {
    try {
      const res = await fetch("/api/editions")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setEditions(data)
    } catch {
      setError("Impossible de charger les éditions")
    } finally {
      setLoading(false)
    }
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
        fetchEditions()
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
      fetchEditions()
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
        fetchEditions()
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
        fetchEditions()
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
    return <div className="text-sm text-gray-600">⏳ Chargement des éditions...</div>
  }

  if (error) {
    return <div className="text-sm text-red-600">🚨 {error}</div>
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
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${wizardStep === 'info' || wizardStep === 'meals' ? 'bg-green-500' : 'bg-gray-200'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${wizardStep === 'meals' ? 'bg-green-500' : 'bg-gray-200'}`} />
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
                  <div className="text-sm text-red-600">{createError}</div>
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
                <p className="text-sm text-gray-600">
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
                  <div className="text-sm text-red-600">{mealsError}</div>
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
        <div className="text-center py-8 text-gray-500">
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
                  ? "ring-2 ring-green-500 bg-green-50/50"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{edition.name}</h4>
                    {edition.isActive && (
                      <Badge className="bg-green-100 text-green-700">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {formatDate(edition.startDate)} → {formatDate(edition.endDate)}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{edition._count.participations} participant(s)</span>
                    <span>{edition._count.conferences} conférence(s)</span>
                    <span>{edition._count.timeSlots} créneau(x)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
    </div>
  )
}
