"use client"

import { UtensilsCrossed } from "lucide-react"
import { PageShell } from "@/components/page-shell"
import { MealsSection } from "@/features/meals/meals-section"

export default function RepasPage() {
  return (
    <PageShell title="Repas" icon={UtensilsCrossed}>
      {({ user, meals }) => {
        if (!user.isAttending || meals.length === 0) {
          return (
            <p className="text-sm text-muted-foreground">
              Aucun repas à afficher pour le moment.
            </p>
          )
        }
        return <MealsSection user={user} />
      }}
    </PageShell>
  )
}
