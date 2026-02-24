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

interface EditionManagerProps {
  onEditionChanged?: () => void
}

export function EditionManager({ onEditionChanged }: EditionManagerProps) {
  const [editions, setEditions] = useState<Edition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createName, setCreateName] = useState("")
  const [createStartDate, setCreateStartDate] = useState<Date>()
  const [createEndDate, setCreateEndDate] = useState<Date>()
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState("")

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createName.trim()) {
      setCreateError("Le nom est requis")
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
          startDate: createStartDate?.toISOString() ?? null,
          endDate: createEndDate?.toISOString() ?? null,
        }),
      })
      const result = await res.json()
      if (res.ok) {
        setCreateName("")
        setCreateStartDate(undefined)
        setCreateEndDate(undefined)
        setIsCreateOpen(false)
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
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>Nouvelle édition</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une nouvelle édition</DialogTitle>
              <DialogDescription>
                Définissez le nom et les dates de la nouvelle édition
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
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
                <Label>Date de début (optionnel)</Label>
                <DateTimePicker
                  date={createStartDate}
                  setDate={setCreateStartDate}
                  disabled={createLoading}
                  placeholder="Choisir la date de début"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Date de fin (optionnel)</Label>
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
                  {createLoading ? "Création..." : "Créer"}
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
