"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
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
import { cn } from "@/lib/utils"
import {
  UserCheck,
  UtensilsCrossed,
  CreditCard,
  Mic,
  CalendarDays,
  Menu,
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
  const [mobileOpen, setMobileOpen] = useState(false)

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

  const currentItem = items.find((item) => item.key === active) ?? items[0]

  const handleSelect = (key: SectionKey) => {
    setActive(key)
    setMobileOpen(false)
  }

  const navList = (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon
        const isActive = item.key === active
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => handleSelect(item.key)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              "hover:bg-gray-100",
              isActive && "bg-green-100 text-green-900 hover:bg-green-100"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-green-700" : "text-gray-500")} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />

      <OnboardingModal />

      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
            Bienvenue, {user.name} !
          </h1>
          <p className="text-gray-600 text-sm lg:text-base">
            Gérez votre participation — {user.edition.name}
          </p>
        </div>

        <AlertBanner user={user} meals={meals} />

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 flex flex-col gap-6">
              <div className="rounded-lg border bg-white/70 backdrop-blur p-3">
                {navList}
              </div>
              <EditionInfoCard edition={user.edition} />
            </div>
          </aside>

          <main className="flex flex-col gap-6 min-w-0">
            <div className="flex items-center justify-between lg:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Menu className="h-4 w-4" />
                    <span className="flex items-center gap-2">
                      <currentItem.icon className="h-4 w-4" />
                      {currentItem.label}
                    </span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-6">
                  <SheetTitle className="mb-4">Navigation</SheetTitle>
                  {navList}
                  <div className="mt-6">
                    <EditionInfoCard edition={user.edition} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {active === "presence" && <PresenceSection user={user} />}
            {active === "meals" && showMeals && <MealsSection user={user} />}
            {active === "payment" && showPayment && <PaymentSection user={user} />}
            {active === "conferences" && showConferences && <ConferencesSection user={user} />}
            {active === "program" && <ProgramSection />}
          </main>
        </div>
      </div>
    </div>
  )
}
