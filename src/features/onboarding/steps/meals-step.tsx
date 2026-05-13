"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { MealSlot, MealStatus } from "@/types"

interface MealsStepProps {
  meals: MealSlot[]
  onAnswer: (selections: Record<string, MealStatus>) => void
  isSubmitting: boolean
}

function formatMealTime(startTime: string, endTime: string): string {
  const opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }
  const timeOpts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }
  const date = new Date(startTime).toLocaleDateString("fr-FR", opts)
  const start = new Date(startTime).toLocaleTimeString("fr-FR", timeOpts)
  const end = new Date(endTime).toLocaleTimeString("fr-FR", timeOpts)
  return `${date} · ${start}–${end}`
}

export function MealsStep({ meals, onAnswer, isSubmitting }: MealsStepProps) {
  const [selections, setSelections] = useState<Record<string, MealStatus>>(
    Object.fromEntries(meals.map((m) => [m.id, m.status]))
  )

  const toggle = (mealId: string, status: "PRESENT" | "ABSENT") => {
    setSelections((prev) => ({
      ...prev,
      [mealId]: prev[mealId] === status ? null : status,
    }))
  }

  const handleSubmit = () => {
    onAnswer(selections)
  }

  const answeredCount = Object.values(selections).filter((s) => s !== null).length

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-center text-sm">
        Cochez les repas auxquels vous participerez.
        <br />
        <span className="text-muted-foreground/80">Vous pourrez modifier ça plus tard.</span>
      </p>

      {meals.length === 0 ? (
        <p className="text-sm text-muted-foreground/80 text-center py-4">
          Aucun repas programmé pour le moment.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {meals.map((meal) => {
            const status = selections[meal.id]
            return (
              <div
                key={meal.id}
                className={`rounded-lg border p-4 transition-colors ${
                  status === "PRESENT"
                    ? "border-warn-border bg-warn-bg"
                    : status === "ABSENT"
                    ? "border-border bg-muted/50"
                    : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{meal.title}</span>
                      {meal.price != null && (
                        <Badge variant="secondary" className="shrink-0">{meal.price} €</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatMealTime(meal.startTime, meal.endTime)}</p>
                    {meal.description && (
                      <p className="text-xs text-muted-foreground mt-1">{meal.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      variant={status === "PRESENT" ? "default" : "outline"}
                      className="text-xs px-2.5"
                      onClick={() => toggle(meal.id, "PRESENT")}
                      disabled={isSubmitting}
                    >
                      Présent
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={status === "ABSENT" ? "default" : "outline"}
                      className="text-xs px-2.5"
                      onClick={() => toggle(meal.id, "ABSENT")}
                      disabled={isSubmitting}
                    >
                      Absent
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Button
        type="button"
        className="w-full"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {answeredCount === 0
          ? "Passer (répondre plus tard)"
          : `Continuer (${answeredCount} repas renseigné${answeredCount > 1 ? "s" : ""})`}
      </Button>
    </div>
  )
}
