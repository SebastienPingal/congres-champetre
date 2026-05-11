"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useTimeSlots } from "@/hooks/use-time-slots"
import type { TimeSlot } from "@/types"

function formatHourMinute(dateString: string) {
  return new Date(dateString).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function getDayKey(dateString: string) {
  const d = new Date(dateString)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function getDayLabel(dateString: string) {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

export function ProgramSection({ className }: { className?: string }) {
  const { data: timeSlots = [], isLoading, error } = useTimeSlots()

  const byDay = useMemo(() => {
    const groups = new Map<string, TimeSlot[]>()
    for (const slot of timeSlots) {
      const key = getDayKey(slot.startTime)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(slot)
    }
    const keys = [...groups.keys()].sort().slice(0, 2)
    return keys.map((key) => {
      const slots = groups.get(key)!.sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
      return { key, label: getDayLabel(slots[0].startTime), slots }
    })
  }, [timeSlots])

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Programme du weekend</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-gray-600 text-center">Chargement du programme…</p>
        ) : error ? (
          <p className="text-sm text-red-600 text-center">Impossible de charger le programme</p>
        ) : byDay.length === 0 ? (
          <p className="text-sm text-gray-600 text-center">Aucun créneau publié pour le moment</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {byDay.map((day) => (
              <div key={day.key} className="flex flex-col gap-4">
                <h3 className="text-lg font-semibold capitalize">{day.label}</h3>
                <div className="flex flex-col gap-3">
                  {day.slots.map((slot) => (
                    <div
                      key={slot.id}
                      className={cn(
                        "rounded-lg ring-1",
                        slot.kind === "CONFERENCE" && "bg-violet-50 ring-violet-200 border-l-4 border-violet-400",
                        slot.kind === "MEAL" && "bg-amber-50 ring-amber-200 border-l-4 border-amber-400",
                        slot.kind === "BREAK" && "bg-sky-50 ring-sky-200 border-l-4 border-sky-400",
                        slot.kind === "OTHER" && "bg-gray-50 ring-gray-200 border-l-4 border-gray-300"
                      )}
                    >
                      {slot.kind === "MEAL" ? (
                        <div className="flex items-start gap-4 p-4">
                          <div className="shrink-0 text-xs text-gray-500">
                            {formatHourMinute(slot.startTime)} – {formatHourMinute(slot.endTime)}
                          </div>
                          <p className="text-sm font-medium grow">{slot.title}</p>
                        </div>
                      ) : (
                        <div className="flex items-start gap-4 p-4">
                          <div className="shrink-0 text-xs text-gray-500">
                            {formatHourMinute(slot.startTime)} – {formatHourMinute(slot.endTime)}
                          </div>
                          <div className="flex grow flex-col gap-1">
                            {slot.conference ? (
                              <>
                                <p className="text-base font-semibold">{slot.conference.title}</p>
                                <p className="text-xs text-gray-600">{slot.conference.speaker.name}</p>
                                {slot.title && <p className="text-xs text-gray-500">{slot.title}</p>}
                              </>
                            ) : (
                              <p className="text-sm font-medium">{slot.title}</p>
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
