"use client"

import { Navbar } from "@/components/navbar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useMeals } from "@/hooks/use-meals"
import { AlertBanner } from "@/features/participation/alert-banner"
import { EditionInfoCard } from "@/features/participation/edition-info-card"
import { PresenceSection } from "@/features/participation/presence-section"
import { MealsSection } from "@/features/meals/meals-section"
import { PaymentSection } from "@/features/meals/payment-section"
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

  const showMeals = user.isAttending && meals.length > 0
  const showPayment = user.isAttending && !!user.onboardingCompletedAt
  const showConferences = user.isAttending

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

        <div className="mb-6">
          <EditionInfoCard edition={user.edition} />
        </div>

        <Tabs defaultValue="presence" className="gap-6">
          <TabsList className="w-full h-auto flex-wrap justify-start">
            <TabsTrigger value="presence">👋 Présence</TabsTrigger>
            {showMeals && <TabsTrigger value="meals">🍽️ Repas</TabsTrigger>}
            {showPayment && <TabsTrigger value="payment">💳 Paiement</TabsTrigger>}
            {showConferences && <TabsTrigger value="conferences">🎤 Conférences</TabsTrigger>}
            <TabsTrigger value="program">📅 Programme</TabsTrigger>
          </TabsList>

          <TabsContent value="presence">
            <PresenceSection user={user} />
          </TabsContent>

          {showMeals && (
            <TabsContent value="meals">
              <MealsSection user={user} />
            </TabsContent>
          )}

          {showPayment && (
            <TabsContent value="payment">
              <PaymentSection user={user} />
            </TabsContent>
          )}

          {showConferences && (
            <TabsContent value="conferences">
              <ConferencesSection user={user} />
            </TabsContent>
          )}

          <TabsContent value="program">
            <ProgramSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
