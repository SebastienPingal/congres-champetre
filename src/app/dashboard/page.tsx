"use client"

import { Navbar } from "@/components/navbar"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useMeals } from "@/hooks/use-meals"
import { AlertBanner } from "@/features/participation/alert-banner"
import { EditionInfoCard } from "@/features/participation/edition-info-card"
import { PresenceSection } from "@/features/participation/presence-section"
import { MealsSection } from "@/features/meals/meals-section"
import { ConferencesSection } from "@/features/conferences/conferences-section"
import { ProgramSection } from "@/features/program/program-section"
import { OnboardingModal } from "@/features/onboarding/onboarding-modal"

export default function Dashboard() {
  const { data: user, isLoading, error } = useUserProfile()
  const { data: meals = [] } = useMeals()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p>Erreur lors du chargement du profil</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />

      <OnboardingModal />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bienvenue, {user.name} !</h1>
          <p className="text-gray-600">Gérez votre participation — {user.edition.name}</p>
        </div>

        <AlertBanner user={user} meals={meals} />

        <div className="grid gap-6 md:grid-cols-2">
          <ProgramSection className="md:col-span-2" />
          <EditionInfoCard edition={user.edition} />
          <PresenceSection user={user} />
          {user.isAttending && meals.length > 0 && <MealsSection user={user} />}
          {user.isAttending && <ConferencesSection user={user} />}
        </div>
      </div>
    </div>
  )
}
