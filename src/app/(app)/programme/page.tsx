"use client"

import { useRouter } from "next/navigation"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useMeals } from "@/hooks/use-meals"
import { ProgramSection } from "@/features/program/program-section"

const ROUTE_MAP = {
  presence:    "/presence",
  meals:       "/repas",
  conferences: "/conferences",
  payment:     "/paiement",
} as const

export default function ProgrammePage() {
  const router = useRouter()
  const { data: user, isLoading, error } = useUserProfile()
  const { data: meals = [] } = useMeals()

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p>Erreur lors du chargement du profil</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8 flex flex-col gap-4">
      <ProgramSection
        user={user}
        meals={meals}
        onNavigate={(target) => router.push(ROUTE_MAP[target])}
      />
    </div>
  )
}
