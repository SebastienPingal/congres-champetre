"use client"

import Link from "next/link"
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
        <div className="mb-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 shadow-sm animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-destructive/20 p-2 text-destructive shrink-0">
              <Lock className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-destructive">Inscriptions fermées</p>
              <p className="text-sm text-destructive">
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

  const linkCls = "inline-flex items-center gap-1.5 text-sm text-warn underline underline-offset-2 hover:text-warn transition-colors"

  return (
    <div className="mb-6 rounded-xl border border-warn-border bg-warn-bg p-4 shadow-sm animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-warn-border p-2 text-warn shrink-0">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-semibold text-warn">Il reste des informations à compléter</p>
          <ul className="flex flex-col gap-1.5">
            {needsPresenceAction && (
              <li>
                <Link href="/presence" className={linkCls}>
                  <CircleDot className="h-3.5 w-3.5 text-primary" />
                  Confirmez votre présence au weekend
                </Link>
              </li>
            )}
            {needsMealAction && (
              <li>
                <Link href="/repas" className={linkCls}>
                  <CircleDot className="h-3.5 w-3.5 text-warn" />
                  Indiquez votre présence aux repas
                </Link>
              </li>
            )}
            {needsPayment && (
              <li>
                <Link href="/paiement" className={linkCls}>
                  <CircleDot className="h-3.5 w-3.5 text-warn" />
                  Validez votre participation ({totalToPay} €)
                </Link>
              </li>
            )}
            {needsConferenceAction && (
              <li>
                <Link href="/conferences" className={linkCls}>
                  <CircleDot className="h-3.5 w-3.5 text-talk" />
                  Proposez votre conférence
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
