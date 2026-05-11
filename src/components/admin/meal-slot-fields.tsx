"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { DayTimePicker } from "@/components/ui/day-time-picker"

export interface MealSlotData {
  title: string
  startTime: Date | undefined
  endTime: Date | undefined
  description: string
  price: string
  showInRegistration: boolean
}

export function emptyMealSlot(): MealSlotData {
  return { title: "", startTime: undefined, endTime: undefined, description: "", price: "", showInRegistration: true }
}

interface MealSlotFieldsProps {
  index: number
  data: MealSlotData
  onChange: (data: MealSlotData) => void
  onRemove: () => void
  disabled?: boolean
  availableDays?: Date[]
}

export function MealSlotFields({ index, data, onChange, onRemove, disabled, availableDays }: MealSlotFieldsProps) {
  const update = (patch: Partial<MealSlotData>) => onChange({ ...data, ...patch })
  const [duration, setDuration] = useState(2)
  const useGrid = availableDays && availableDays.length > 0

  const handleSlotSelect = (start: Date) => {
    const end = new Date(start)
    end.setHours(start.getHours() + duration, 0, 0, 0)
    update({ startTime: start, endTime: end })
  }

  return (
    <div className="border rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Repas {index + 1}</span>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} disabled={disabled} className="text-red-500 hover:text-red-700 h-7 px-2">
          Supprimer
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Titre</Label>
        <Input
          type="text"
          placeholder="ex: Dîner du samedi soir"
          value={data.title}
          onChange={(e) => update({ title: e.target.value })}
          disabled={disabled}
        />
      </div>

      {/* Duration */}
      <div className="flex flex-col gap-2">
        <Label>Date et heure de début</Label>
        {availableDays?.length ? (
          <DayTimePicker days={availableDays} date={data.startTime} setDate={(d) => update({ startTime: d })} disabled={disabled} placeholder="Choisir le jour et l'heure de début" />
        ) : (
          <DateTimePicker date={data.startTime} setDate={(d) => update({ startTime: d })} disabled={disabled} placeholder="Choisir la date et l'heure de début" />
        )}
      </div>

      {/* Slot selection */}
      <div className="flex flex-col gap-2">
        <Label>Date et heure de fin</Label>
        {availableDays?.length ? (
          <DayTimePicker days={availableDays} date={data.endTime} setDate={(d) => update({ endTime: d })} disabled={disabled} placeholder="Choisir le jour et l'heure de fin" />
        ) : (
          <DateTimePicker date={data.endTime} setDate={(d) => update({ endTime: d })} disabled={disabled} placeholder="Choisir la date et l'heure de fin" />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Description du menu (optionnel)</Label>
        <textarea
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="ex: Barbecue, salades, fromages..."
          value={data.description}
          onChange={(e) => update({ description: e.target.value })}
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Prix (euros, optionnel)</Label>
        <Input type="number" min="0" step="0.5" placeholder="ex: 5"
          value={data.price} onChange={(e) => update({ price: e.target.value })} disabled={disabled}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id={`show-registration-${index}`}
          checked={data.showInRegistration}
          onCheckedChange={(v) => update({ showInRegistration: Boolean(v) })}
          disabled={disabled}
        />
        <Label htmlFor={`show-registration-${index}`}>Proposer à l&apos;inscription</Label>
      </div>
    </div>
  )
}
