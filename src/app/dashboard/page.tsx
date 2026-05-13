"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
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
    { key: "presence", label: "Présence", icon: UserCheck },
    ...(showMeals ? [{ key: "meals" as const, label: "Repas", icon: UtensilsCrossed }] : []),
    ...(showPayment ? [{ key: "payment" as const, label: "Paiement", icon: CreditCard }] : []),
    ...(showConferences ? [{ key: "conferences" as const, label: "Conférences", icon: Mic }] : []),
    { key: "program", label: "Programme", icon: CalendarDays },
  ]

  const currentLabel = items.find((item) => item.key === active)?.label ?? ""

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />

      <OnboardingModal />

      <SidebarProvider>
        <Sidebar variant="inset" className="top-16 h-[calc(100svh-4rem)]">
          <SidebarHeader>
            <div className="px-2 py-1">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.edition.name}</p>
            </div>
          </SidebarHeader>

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

          <SidebarFooter>
            <EditionInfoCard edition={user.edition} />
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="bg-transparent">
          <header className="sticky top-16 z-20 flex items-center gap-2 border-b bg-white/70 backdrop-blur px-4 py-3 md:hidden">
            <SidebarTrigger />
            <h2 className="text-base font-semibold">{currentLabel}</h2>
          </header>

          <div className="container mx-auto px-4 py-6 lg:py-8 flex flex-col gap-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                Bienvenue, {user.name} !
              </h1>
              <p className="text-gray-600 text-sm lg:text-base">
                Gérez votre participation — {user.edition.name}
              </p>
            </div>

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
