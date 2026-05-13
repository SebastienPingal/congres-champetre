"use client"

import { useMemo } from "react"
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

const kindAccent: Record<TimeSlot["kind"], string> = {
  CONFERENCE: "bg-violet-400",
  MEAL: "bg-amber-400",
  BREAK: "bg-sky-400",
  OTHER: "bg-gray-300",
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

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement du programme…</p>
  }
  if (error) {
    return <p className="text-sm text-destructive">Impossible de charger le programme</p>
  }
  if (byDay.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun créneau publié pour le moment</p>
  }

  return (
    <section className={cn("flex flex-col gap-8", className)}>
      <div className="grid gap-8 md:grid-cols-2">
        {byDay.map((day) => (
          <div key={day.key} className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground capitalize">
              {day.label}
            </h3>
            <ul className="flex flex-col">
              {day.slots.map((slot, index) => (
                <li
                  key={slot.id}
                  className={cn(
                    "flex items-start gap-4 py-3",
                    index !== 0 && "border-t"
                  )}
                >
                  <div className="flex items-center gap-2 shrink-0 w-24">
                    <span className={cn("h-2 w-2 rounded-full", kindAccent[slot.kind])} aria-hidden="true" />
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {formatHourMinute(slot.startTime)}
                    </span>
                  </div>
                  <div className="flex grow flex-col min-w-0">
                    {slot.kind === "CONFERENCE" && slot.conference ? (
                      <>
                        <p className="font-medium">{slot.conference.title}</p>
                        <p className="text-xs text-muted-foreground">{slot.conference.speaker.name}</p>
                      </>
                    ) : (
                      <p className="text-sm">{slot.title}</p>
                    )}
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground shrink-0">
                    {formatHourMinute(slot.endTime)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
