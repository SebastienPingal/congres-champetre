"use client"

import { useState } from "react"
import { Navbar, type DashboardSection } from "@/components/navbar"
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
import {
  UserCheck,
  UtensilsCrossed,
  CreditCard,
  Mic,
  CalendarDays,
  type LucideIcon,
} from "lucide-react"

const SECTION_LABELS: Record<DashboardSection, { label: string; icon: LucideIcon }> = {
  program:     { label: "Programme",   icon: CalendarDays },
  presence:    { label: "Présence",    icon: UserCheck },
  meals:       { label: "Repas",       icon: UtensilsCrossed },
  conferences: { label: "Conférences", icon: Mic },
  payment:     { label: "Paiement",    icon: CreditCard },
}

const VALID_SECTIONS: DashboardSection[] = ["program", "presence", "meals", "conferences", "payment"]

export default function Dashboard() {
  const { data: user, isLoading, error } = useUserProfile()
  const { data: meals = [] } = useMeals()

  const [active, setActive] = useState<DashboardSection>(() => {
    if (typeof window === "undefined") return "presence"
    const s = new URLSearchParams(window.location.search).get("section") as DashboardSection | null
    return s && VALID_SECTIONS.includes(s) ? s : "presence"
  })

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

  const currentItem = SECTION_LABELS[active]
  const CurrentIcon = currentItem.icon

  return (
    <div className="min-h-screen">
      <Navbar activeSection={active} onSectionChange={setActive} />

      <OnboardingModal />

      {active === "program" ? (
        <div className="container mx-auto px-4 py-6 lg:py-8 flex flex-col gap-4">
          <ProgramSection user={user} meals={meals} onNavigate={setActive} />
        </div>
      ) : (
        <div className="container mx-auto px-4 py-6 lg:py-8 flex flex-col gap-6">
          <div className="flex items-center gap-2 text-2xl lg:text-3xl font-bold text-foreground">
            <CurrentIcon className="h-6 w-6 lg:h-7 lg:w-7 text-primary" />
            <h1>{currentItem.label}</h1>
          </div>

          <EditionInfoCard edition={user.edition} />

          <AlertBanner user={user} meals={meals} />

          {active === "presence" && <PresenceSection user={user} />}
          {active === "meals" && showMeals && <MealsSection user={user} />}
          {active === "payment" && showPayment && <PaymentSection user={user} />}
          {active === "conferences" && showConferences && <ConferencesSection user={user} />}
        </div>
      )}
    </div>
  )
}
