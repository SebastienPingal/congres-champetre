"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Speaker = {
  id: string
  name: string
  email: string
}

type Conference = {
  id: string
  title: string
  speaker: Speaker
}

type TimeSlot = {
  id: string
  title: string
  startTime: string
  endTime: string
  kind?: 'CONFERENCE' | 'MEAL' | 'BREAK' | 'OTHER'
  conference?: Conference
}

function formatHourMinute(dateString: string) {
  return new Date(dateString).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })
}

function getDayKey(dateString: string) {
  const d = new Date(dateString)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function getDayLabel(dateString: string) {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long"
  })
}

export function WeekendProgram() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/timeslots")
        if (!res.ok) {
          setError("Impossible de charger le programme")
          setIsLoading(false)
          return
        }
        const data: TimeSlot[] = await res.json()
        if (!isCancelled) setTimeSlots(data)
      } catch {
        setError("Impossible de charger le programme")
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    })()
    return () => {
      isCancelled = true
    }
  }, [])

  const byDay = useMemo(() => {
    const groups = new Map<string, TimeSlot[]>()
    for (const slot of timeSlots) {
      const key = getDayKey(slot.startTime)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(slot)
    }
    // sort keys (days) ascending
    const keys = [...groups.keys()].sort()
    // limit to 2 days (weekend view)
    const limitedKeys = keys.slice(0, 2)
    const result: Array<{ key: string; label: string; slots: TimeSlot[] }> = []
    for (const key of limitedKeys) {
      const slots = groups.get(key)!
      slots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      result.push({ key, label: getDayLabel(slots[0].startTime), slots })
    }
    return result
  }, [timeSlots])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Programme du weekend
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center">
            <p className="text-sm text-gray-600">Chargement du programme…</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : byDay.length === 0 ? (
          <div className="flex items-center justify-center">
            <p className="text-sm text-gray-600">Aucun créneau publié pour le moment</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {byDay.map(day => (
              <div key={day.key} className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold capitalize">{day.label}</h3>
                  <Badge variant="secondary">{day.slots.length} créneau{day.slots.length > 1 ? "x" : ""}</Badge>
                </div>

                <div className="flex flex-col gap-3">
                  {day.slots.map(slot => (
                    <div
                      key={slot.id}
                      className={cn(
                        "rounded-lg ring-1",
                        slot.kind === 'CONFERENCE' && "bg-violet-50 ring-violet-200 border-l-4 border-violet-400",
                        slot.kind === 'MEAL' && "bg-amber-50 ring-amber-200 border-l-4 border-amber-400",
                        slot.kind === 'BREAK' && "bg-sky-50 ring-sky-200 border-l-4 border-sky-400",
                        (!slot.kind || slot.kind === 'OTHER') && "bg-gray-50 ring-gray-200 border-l-4 border-gray-300"
                      )}
                    >
                      {slot.kind === 'MEAL' ? (
                        <div className="flex items-start gap-4 p-4">
                          <div className="shrink-0">
                            <div className="text-xs text-gray-500">
                              {formatHourMinute(slot.startTime)} – {formatHourMinute(slot.endTime)}
                            </div>
                          </div>
                          <div className="flex grow flex-col">
                            <p className="text-sm font-medium">{slot.title}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-4 p-4">
                          <div className="shrink-0">
                            <div className="text-xs text-gray-500">
                              {formatHourMinute(slot.startTime)} – {formatHourMinute(slot.endTime)}
                            </div>
                          </div>

                          <div className="flex grow flex-col gap-1">
                            {slot.conference ? (
                              <div className="flex flex-col gap-1">
                                <p className="text-base font-semibold">{slot.conference.title}</p>
                                <p className="text-xs text-gray-600">{slot.conference.speaker.name}</p>
                                {slot.title && (
                                  <p className="text-xs text-gray-500">{slot.title}</p>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col">
                                <p className="text-sm font-medium">{slot.title}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


