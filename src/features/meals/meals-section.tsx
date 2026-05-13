"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, CircleDot, Lock } from "lucide-react"
import { useMeals, useUpdateMealStatus } from "@/hooks/use-meals"
import type { UserProfile } from "@/types"

interface MealsSectionProps {
  user: UserProfile
}

export function MealsSection({ user }: MealsSectionProps) {
  const { data: meals = [] } = useMeals()
  const { mutate: updateMealStatus, isPending: isMealUpdating, variables: mealUpdatingVars } = useUpdateMealStatus()

  const locked = user.edition.isRegistrationClosed
  const needsMealAction = !locked && meals.some((m) => m.status === null)

  return (
    <section id="section-repas" className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Nous nous chargeons de la nourriture et des boissons. Indiquez simplement les repas auxquels vous comptez participer.
        </p>
        {locked ? (
          <Badge variant="outline" className="text-muted-foreground">
            <Lock className="h-3 w-3 mr-1" />Inscriptions fermées
          </Badge>
        ) : needsMealAction ? (
          <Badge variant="outline" className="border-amber-300 text-amber-700">
            <CircleDot className="h-3 w-3 mr-1" />À compléter
          </Badge>
        ) : (
          <Badge variant="outline" className="border-green-300 text-green-700">
            <CheckCircle2 className="h-3 w-3 mr-1" />Complet
          </Badge>
        )}
      </div>

      <ul className="divide-y rounded-lg border bg-white/60">
        {meals.map((meal) => {
          const updating = isMealUpdating && mealUpdatingVars?.timeSlotId === meal.id
          return (
            <li key={meal.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{meal.title}</h4>
                  {meal.price != null && (
                    <span className="text-xs text-muted-foreground">{meal.price} €</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(meal.startTime).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}{" · "}
                  {new Date(meal.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  {" – "}
                  {new Date(meal.endTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </p>
                {meal.description && <p className="text-sm text-foreground/80 mt-1">{meal.description}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant={meal.status === "PRESENT" ? "default" : "outline"}
                  onClick={() => updateMealStatus({ timeSlotId: meal.id, status: "PRESENT" })}
                  disabled={locked || updating}
                >
                  Présent
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={meal.status === "ABSENT" ? "default" : "outline"}
                  onClick={() => updateMealStatus({ timeSlotId: meal.id, status: "ABSENT" })}
                  disabled={locked || updating}
                >
                  Absent
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
