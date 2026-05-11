"use client"

import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"

interface ExistingSlot {
  startTime: string | Date
  endTime: string | Date
}

interface SlotGridProps {
  days: Date[]
  startHour: number
  endHour: number
  duration: number
  existingSlots?: ExistingSlot[]
  selected: Date | null
  onSelect: (startTime: Date) => void
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function isOccupied(day: Date, hour: number, duration: number, existingSlots: ExistingSlot[]) {
  const slotStart = new Date(day)
  slotStart.setHours(hour, 0, 0, 0)
  const slotEnd = new Date(day)
  slotEnd.setHours(hour + duration, 0, 0, 0)

  return existingSlots.some((s) => {
    const eStart = new Date(s.startTime)
    const eEnd = new Date(s.endTime)
    return eStart < slotEnd && eEnd > slotStart
  })
}

export function SlotGrid({ days, startHour, endHour, duration, existingSlots = [], selected, onSelect }: SlotGridProps) {
  const availableStartHours = Array.from(
    { length: Math.max(0, endHour - startHour - duration + 1) },
    (_, i) => startHour + i
  )

  if (availableStartHours.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-2">
        Durée trop longue pour les heures de l&apos;édition.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Hour header */}
      <div className="flex gap-0.5 pl-20">
        {availableStartHours.map((h) => (
          <div key={h} className="w-8 text-center text-xs text-gray-400 font-medium">
            {h}h
          </div>
        ))}
      </div>

      {/* Day rows */}
      {days.map((day) => (
        <div key={day.toISOString()} className="flex items-center gap-0.5">
          <span className="w-20 shrink-0 text-xs font-medium text-gray-600 capitalize">
            {format(day, "EEE dd MMM", { locale: fr })}
          </span>
          {availableStartHours.map((hour) => {
            const occupied = isOccupied(day, hour, duration, existingSlots)
            const isSelected = selected !== null && isSameDay(day, selected) && selected.getHours() === hour

            return (
              <Button
                key={hour}
                type="button"
                size="sm"
                className="w-8 h-7 p-0 text-xs"
                variant={isSelected ? "default" : occupied ? "ghost" : "outline"}
                disabled={occupied}
                onClick={() => {
                  const start = new Date(day)
                  start.setHours(hour, 0, 0, 0)
                  onSelect(start)
                }}
              >
                {occupied ? "·" : `${hour}`}
              </Button>
            )
          })}
        </div>
      ))}

      {selected && (
        <p className="text-xs text-gray-500 text-center mt-1">
          {format(selected, "EEEE dd MMMM", { locale: fr })} · {selected.getHours()}h → {selected.getHours() + duration}h
        </p>
      )}
    </div>
  )
}
