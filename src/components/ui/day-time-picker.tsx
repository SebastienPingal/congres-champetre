"use client"

import * as React from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ClockIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface DayTimePickerProps {
  days: Date[]
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  disabled?: boolean
  placeholder?: string
}

const hours = Array.from({ length: 24 }, (_, i) => i)
const minutes = Array.from({ length: 12 }, (_, i) => i * 5)

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

export function DayTimePicker({
  days,
  date,
  setDate,
  disabled = false,
  placeholder = "Choisir un jour et une heure",
}: DayTimePickerProps) {
  const [open, setOpen] = React.useState(false)

  const selectedDay = date ? days.find((d) => isSameDay(d, date)) ?? null : null

  const selectDay = (day: Date) => {
    const next = new Date(day)
    next.setHours(date?.getHours() ?? 9, date?.getMinutes() ?? 0, 0, 0)
    setDate(next)
  }

  const setTime = (type: "hour" | "minute", value: number) => {
    const base = date ? new Date(date) : new Date(days[0] ?? new Date())
    if (type === "hour") base.setHours(value)
    else base.setMinutes(value)
    base.setSeconds(0, 0)
    setDate(base)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
        >
          <ClockIcon className="mr-2 h-4 w-4" />
          {date
            ? format(date, "EEEE dd MMMM 'à' HH:mm", { locale: fr })
            : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex flex-col gap-3">
          {/* Day selector */}
          <div className="flex flex-wrap gap-2">
            {days.map((day) => (
              <Button
                key={day.toISOString()}
                type="button"
                size="sm"
                variant={selectedDay && isSameDay(day, selectedDay) ? "default" : "outline"}
                onClick={() => selectDay(day)}
              >
                {format(day, "EEE dd MMM", { locale: fr })}
              </Button>
            ))}
          </div>

          {/* Time selector */}
          <div className="flex divide-x border rounded-md overflow-hidden">
            <ScrollArea className="h-48 w-16">
              <div className="flex flex-col p-1">
                {hours.map((h) => (
                  <Button
                    key={h}
                    type="button"
                    size="sm"
                    variant={date && date.getHours() === h ? "default" : "ghost"}
                    className="w-full"
                    onClick={() => setTime("hour", h)}
                  >
                    {h.toString().padStart(2, "0")}
                  </Button>
                ))}
              </div>
              <ScrollBar />
            </ScrollArea>
            <ScrollArea className="h-48 w-16">
              <div className="flex flex-col p-1">
                {minutes.map((m) => (
                  <Button
                    key={m}
                    type="button"
                    size="sm"
                    variant={date && date.getMinutes() === m ? "default" : "ghost"}
                    className="w-full"
                    onClick={() => setTime("minute", m)}
                  >
                    {m.toString().padStart(2, "0")}
                  </Button>
                ))}
              </div>
              <ScrollBar />
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
