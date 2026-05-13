"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
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

type SectionKey = "presence" | "meals" | "payment" | "conferences" | "program"

type NavItem = {
  key: SectionKey
  label: string
  icon: LucideIcon
}

export default function Dashboard() {
  const { data: user, isLoading, error } = useUserProfile()
  const { data: meals = [] } = useMeals()
  const [active, setActive] = useState<SectionKey>("presence")

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

  const items: NavItem[] = [
    { key: "program", label: "Programme", icon: CalendarDays },
    { key: "presence", label: "Présence", icon: UserCheck },
    ...(showMeals ? [{ key: "meals" as const, label: "Repas", icon: UtensilsCrossed }] : []),
    ...(showConferences ? [{ key: "conferences" as const, label: "Conférences", icon: Mic }] : []),
    ...(showPayment ? [{ key: "payment" as const, label: "Paiement", icon: CreditCard }] : []),
  ]

  const currentItem = items.find((item) => item.key === active) ?? items[0]
  const CurrentIcon = currentItem.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />

      <OnboardingModal />

      <SidebarProvider className="min-h-[calc(100svh-4rem)]">
        <Sidebar variant="inset" className="top-16 h-[calc(100svh-4rem)]">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Ma participation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => {
                    const Icon = item.icon
                    return (
                      <SidebarMenuItem key={item.key}>
                        <SidebarMenuButton
                          tooltip={item.label}
                          isActive={item.key === active}
                          onClick={() => setActive(item.key)}
                        >
                          <Icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="bg-transparent">
          <div className="container mx-auto px-4 py-6 lg:py-8 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="md:hidden" />
              <div className="flex items-center gap-2 text-2xl lg:text-3xl font-bold text-gray-900">
                <CurrentIcon className="h-6 w-6 lg:h-7 lg:w-7 text-green-700" />
                <h1>{currentItem.label}</h1>
              </div>
            </div>

            <EditionInfoCard edition={user.edition} />

            <AlertBanner user={user} meals={meals} />

            {active === "presence" && <PresenceSection user={user} />}
            {active === "meals" && showMeals && <MealsSection user={user} />}
            {active === "payment" && showPayment && <PaymentSection user={user} />}
            {active === "conferences" && showConferences && <ConferencesSection user={user} />}
            {active === "program" && <ProgramSection />}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
