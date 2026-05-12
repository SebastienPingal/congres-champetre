"use client"

import { AlertTriangle, CircleDot, Lock } from "lucide-react"
import type { UserProfile, MealSlot } from "@/types"

interface AlertBannerProps {
  user: UserProfile
  meals: MealSlot[]
}

export function AlertBanner({ user, meals }: AlertBannerProps) {
  const locked = user.edition.isRegistrationClosed
  const totalToPay = meals
    .filter((m) => m.status === "PRESENT" && m.price != null)
    .reduce((sum, m) => sum + (m.price ?? 0), 0)

  const needsPresenceAction = !locked && !user.isAttending
  const needsMealAction =
    !locked && user.isAttending && meals.length > 0 && meals.some((m) => m.status === null)
  const needsConferenceAction =
    !locked && user.isAttending && user.wantsToSpeak && user.conferences.length === 0
  const needsPayment = user.isAttending && totalToPay > 0 && !user.hasPaid

  if (locked) {
    if (user.isAttending && totalToPay > 0 && !user.hasPaid) {
      return (
        <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 shadow-sm animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-red-100 p-2 text-red-600 shrink-0">
              <Lock className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-red-900">Inscriptions fermées</p>
              <p className="text-sm text-red-800">
                Votre participation n&apos;a pas été validée par un paiement. Contactez l&apos;organisateur si vous souhaitez encore venir.
              </p>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  if (!needsPresenceAction && !needsMealAction && !needsConferenceAction && !needsPayment) return null

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  return (
    <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-sm animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-amber-100 p-2 text-amber-600 shrink-0">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-semibold text-amber-900">Il reste des informations à compléter</p>
          <ul className="flex flex-col gap-1.5">
            {needsPresenceAction && (
              <li>
                <a
                  href="#section-presence"
                  className="inline-flex items-center gap-1.5 text-sm text-amber-800 underline underline-offset-2 hover:text-amber-950 transition-colors"
                  onClick={scrollTo("section-presence")}
                >
                  <CircleDot className="h-3.5 w-3.5 text-green-600" />
                  Confirmez votre présence au weekend
                </a>
              </li>
            )}
            {needsMealAction && (
              <li>
                <a
                  href="#section-repas"
                  className="inline-flex items-center gap-1.5 text-sm text-amber-800 underline underline-offset-2 hover:text-amber-950 transition-colors"
                  onClick={scrollTo("section-repas")}
                >
                  <CircleDot className="h-3.5 w-3.5 text-amber-600" />
                  Indiquez votre présence aux repas
                </a>
              </li>
            )}
            {needsPayment && (
              <li>
                <a
                  href="#section-validation"
                  className="inline-flex items-center gap-1.5 text-sm text-amber-800 underline underline-offset-2 hover:text-amber-950 transition-colors"
                  onClick={scrollTo("section-validation")}
                >
                  <CircleDot className="h-3.5 w-3.5 text-amber-600" />
                  Validez votre participation ({totalToPay} €)
                </a>
              </li>
            )}
            {needsConferenceAction && (
              <li>
                <a
                  href="#section-conferences"
                  className="inline-flex items-center gap-1.5 text-sm text-amber-800 underline underline-offset-2 hover:text-amber-950 transition-colors"
                  onClick={scrollTo("section-conferences")}
                >
                  <CircleDot className="h-3.5 w-3.5 text-violet-600" />
                  Proposez votre conférence
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
