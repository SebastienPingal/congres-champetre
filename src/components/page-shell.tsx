"use client"

import type { ReactNode } from "react"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useMeals } from "@/hooks/use-meals"
import { AlertBanner } from "@/features/participation/alert-banner"
import { EditionInfoCard } from "@/features/participation/edition-info-card"
import type { UserProfile, MealSlot } from "@/types"
import type { LucideIcon } from "lucide-react"

interface PageShellProps {
  title: string
  icon: LucideIcon
  children: (ctx: { user: UserProfile; meals: MealSlot[] }) => ReactNode
}

export function PageShell({ title, icon: Icon, children }: PageShellProps) {
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
    <div className="mx-auto w-full max-w-5xl px-4 py-8 lg:py-10 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Icon className="h-7 w-7 lg:h-8 lg:w-8" style={{ color: "var(--green)" }} />
        <h1
          className="font-display"
          style={{
            fontSize: "clamp(2rem, 4.5vw, 3rem)",
            fontWeight: 600,
            letterSpacing: "-0.025em",
            lineHeight: 1.05,
            color: "var(--ink)",
          }}
        >
          {title}
        </h1>
      </div>

      <EditionInfoCard edition={user.edition} />
      <AlertBanner user={user} meals={meals} />

      {children({ user, meals })}
    </div>
  )
}
