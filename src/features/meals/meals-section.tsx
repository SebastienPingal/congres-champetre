"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CircleDot, Lock, UtensilsCrossed } from "lucide-react"
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
    <Card
      id="section-repas"
      className={needsMealAction ? "animate-border-rotate animate-border-rotate-amber shadow-md" : "border-l-4 border-l-amber-300"}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5" />
            Repas sur place
          </CardTitle>
          {locked ? (
            <Badge className="bg-gray-100 text-gray-700 border-gray-300" variant="outline">
              <Lock className="h-3 w-3 mr-1" />Inscriptions fermées
            </Badge>
          ) : needsMealAction ? (
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-300" variant="outline">
              <CircleDot className="h-3 w-3 mr-1" />À compléter
            </Badge>
          ) : null}
        </div>
        <CardDescription>
          Nous nous chargeons de toute la nourriture et des boissons (y compris un peu d&apos;alcool).
          Indiquez les repas auxquels vous participez.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {meals.map((meal) => (
            <div
              key={meal.id}
              className={`rounded-lg border p-4 transition-colors ${
                meal.status === "PRESENT"
                  ? "border-amber-300 bg-amber-50/60"
                  : meal.status === "ABSENT"
                  ? "border-gray-300 bg-gray-50/60"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{meal.title}</h4>
                    {meal.price != null && <Badge variant="secondary">{meal.price} €</Badge>}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(meal.startTime).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}{" "}
                    de{" "}
                    {new Date(meal.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}{" "}
                    à{" "}
                    {new Date(meal.endTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {meal.description && <p className="text-sm text-gray-600 mt-2">{meal.description}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={meal.status === "PRESENT" ? "default" : "outline"}
                    onClick={() => updateMealStatus({ timeSlotId: meal.id, status: "PRESENT" })}
                    disabled={locked || (isMealUpdating && mealUpdatingVars?.timeSlotId === meal.id)}
                  >
                    Présent
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={meal.status === "ABSENT" ? "default" : "outline"}
                    onClick={() => updateMealStatus({ timeSlotId: meal.id, status: "ABSENT" })}
                    disabled={locked || (isMealUpdating && mealUpdatingVars?.timeSlotId === meal.id)}
                  >
                    Absent
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
