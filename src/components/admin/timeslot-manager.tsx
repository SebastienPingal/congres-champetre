"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DateTimePicker } from "@/components/ui/date-time-picker"

interface TimeSlot {
  id: string
  title: string
  startTime: string
  endTime: string
  isAvailable: boolean
  conferences: Array<{
    id: string
    title: string
    speaker: {
      id: string
      name: string
      email: string
    }
  }>
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
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setTitle("")
        setStartDateTime(undefined)
        setEndDateTime(undefined)
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            Créneaux horaires
          </CardTitle>
          <CardDescription>
            Gérez les créneaux disponibles pour les conférences
          </CardDescription>
        </div>
        
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
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
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

              <div className="space-y-2">
                <Label>Date et heure de début</Label>
                <DateTimePicker
                  date={startDateTime}
                  setDate={setStartDateTime}
                  disabled={isLoading}
                  placeholder="Choisir la date et l'heure de début"
                />
              </div>

              <div className="space-y-2">
                <Label>Date et heure de fin</Label>
                <DateTimePicker
                  date={endDateTime}
                  setDate={setEndDateTime}
                  disabled={isLoading}
                  placeholder="Choisir la date et l'heure de fin"
                />
              </div>

              {error && (
                <div className="text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-4">
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
      </CardHeader>
      
      <CardContent>
        {timeSlots.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Aucun créneau créé pour le moment</p>
            <p className="text-sm">Commencez par créer votre premier créneau</p>
          </div>
        ) : (
          <div className="space-y-4">
            {timeSlots.map((slot) => (
              <div key={slot.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{slot.title}</h4>
                    <p className="text-sm text-gray-600">
                      {formatDateTime(slot.startTime)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Durée: {Math.round((new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / (1000 * 60))} minutes
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {slot.isAvailable ? (
                      <Badge variant="secondary">Disponible</Badge>
                    ) : (
                      <Badge variant="destructive">Indisponible</Badge>
                    )}
                  </div>
                </div>
                
                {slot.conferences.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <h5 className="text-sm font-medium mb-2">Conférence assignée:</h5>
                    {slot.conferences.map((conference) => (
                      <div key={conference.id} className="text-sm">
                        <p className="font-medium">{conference.title}</p>
                        <p className="text-gray-600">{conference.speaker.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}