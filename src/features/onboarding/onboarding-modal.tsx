"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { queryKeys } from "@/lib/query-keys"
import { useUserProfile, useUpdateProfile } from "@/hooks/use-user-profile"
import { useMeals } from "@/hooks/use-meals"
import { AttendingStep } from "./steps/attending-step"
import { DaysStep } from "./steps/days-step"
import { SleepingStep } from "./steps/sleeping-step"
import { SpeakingStep } from "./steps/speaking-step"
import { MealsStep } from "./steps/meals-step"
import type { AttendanceDays, MealStatus } from "@/types"

type Step = 'attending' | 'days' | 'sleeping' | 'meals' | 'speaking'

interface OnboardingState {
  isAttending: boolean | null
  attendanceDays: AttendanceDays | null
  sleepsOnSite: boolean | null
  wantsToSpeak: boolean | null
}

const STEP_LABELS: Record<Step, string> = {
  attending: 'Venez-vous au weekend ?',
  days: 'Quels jours ?',
  sleeping: 'Hébergement',
  meals: 'Les repas',
  speaking: 'Conférence',
}

async function saveMealSelections(selections: Record<string, MealStatus>) {
  const entries = Object.entries(selections).filter(([, status]) => status !== null)
  await Promise.all(
    entries.map(([timeSlotId, status]) =>
      fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeSlotId, status }),
      })
    )
  )
}

export function OnboardingModal() {
  const { data: user } = useUserProfile()
  const { data: meals = [] } = useMeals()
  const { mutate: updateProfile } = useUpdateProfile()
  const qc = useQueryClient()

  const [currentStep, setCurrentStep] = useState<Step>('attending')
  const [answers, setAnswers] = useState<OnboardingState>({
    isAttending: null,
    attendanceDays: null,
    sleepsOnSite: null,
    wantsToSpeak: null,
  })
  const [isSavingMeals, setIsSavingMeals] = useState(false)

  const { mutate: completeOnboarding, isPending: isCompleting } = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Erreur onboarding")
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.userProfile })
      qc.invalidateQueries({ queryKey: queryKeys.meals })
    },
  })

  if (!user || user.onboardingCompletedAt !== null) return null

  // Only show meals step if user is attending AND there are meals available
  const hasMeals = meals.length > 0
  const visibleSteps: Step[] = [
    'attending',
    ...(answers.isAttending
      ? ['days' as Step, 'sleeping' as Step, ...(hasMeals ? ['meals' as Step] : [])]
      : []),
    'speaking',
  ]

  const currentIndex = visibleSteps.indexOf(currentStep)
  const totalSteps = visibleSteps.length
  const isSubmitting = isCompleting || isSavingMeals

  const finalComplete = (updatedAnswers: OnboardingState) => {
    completeOnboarding({
      isAttending: updatedAnswers.isAttending ?? false,
      attendanceDays: updatedAnswers.attendanceDays ?? 'NONE',
      sleepsOnSite: updatedAnswers.sleepsOnSite ?? false,
      wantsToSpeak: updatedAnswers.wantsToSpeak ?? false,
    })
  }

  const handleAttending = (value: 'yes' | 'no' | 'unknown') => {
    const isAttending = value === 'yes'
    const attendanceDays: AttendanceDays = isAttending ? 'BOTH' : 'NONE'
    const updated: OnboardingState = { ...answers, isAttending, attendanceDays }
    setAnswers(updated)

    if (value === 'unknown') {
      const skipped: OnboardingState = { isAttending: false, attendanceDays: 'NONE', sleepsOnSite: false, wantsToSpeak: null }
      setAnswers(skipped)
      setCurrentStep('speaking')
    } else if (isAttending) {
      updateProfile({ isAttending: true, attendanceDays: 'BOTH' })
      setCurrentStep('days')
    } else {
      updateProfile({ isAttending: false, attendanceDays: 'NONE', sleepsOnSite: false })
      setCurrentStep('speaking')
    }
  }

  const handleDays = (value: AttendanceDays) => {
    const updated: OnboardingState = { ...answers, attendanceDays: value }
    setAnswers(updated)
    updateProfile({ attendanceDays: value })
    setCurrentStep('sleeping')
  }

  const handleSleeping = (value: boolean | null) => {
    const sleepsOnSite = value ?? false
    const updated: OnboardingState = { ...answers, sleepsOnSite }
    setAnswers(updated)
    updateProfile({ sleepsOnSite })
    setCurrentStep(hasMeals ? 'meals' : 'speaking')
  }

  const handleMeals = async (selections: Record<string, MealStatus>) => {
    setIsSavingMeals(true)
    try {
      await saveMealSelections(selections)
    } finally {
      setIsSavingMeals(false)
    }
    setCurrentStep('speaking')
  }

  const handleSpeaking = (value: boolean | null) => {
    const wantsToSpeak = value ?? false
    const updated: OnboardingState = { ...answers, wantsToSpeak }
    setAnswers(updated)
    finalComplete(updated)
  }

  const handleLater = () => {
    completeOnboarding({
      isAttending: answers.isAttending ?? false,
      attendanceDays: answers.attendanceDays ?? 'NONE',
      sleepsOnSite: answers.sleepsOnSite ?? false,
      wantsToSpeak: answers.wantsToSpeak ?? false,
    })
  }

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Bienvenue au Congrès Champêtre !
          </DialogTitle>
        </DialogHeader>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-2">
          {visibleSteps.map((step, i) => (
            <div
              key={step}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= currentIndex ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center mb-4">
          Étape {currentIndex + 1} sur {totalSteps} — {STEP_LABELS[currentStep]}
        </p>

        <h2 className="text-lg font-semibold text-center mb-2">
          {STEP_LABELS[currentStep]}
        </h2>

        {currentStep === 'attending' && (
          <AttendingStep onAnswer={handleAttending} isSubmitting={isSubmitting} />
        )}
        {currentStep === 'days' && (
          <DaysStep onAnswer={handleDays} isSubmitting={isSubmitting} />
        )}
        {currentStep === 'sleeping' && (
          <SleepingStep onAnswer={handleSleeping} isSubmitting={isSubmitting} />
        )}
        {currentStep === 'meals' && (
          <MealsStep meals={meals} onAnswer={handleMeals} isSubmitting={isSubmitting} />
        )}
        {currentStep === 'speaking' && (
          <SpeakingStep onAnswer={handleSpeaking} isSubmitting={isSubmitting} />
        )}

        <button
          type="button"
          className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 text-center w-full transition-colors"
          onClick={handleLater}
          disabled={isSubmitting}
        >
          Répondre plus tard
        </button>
      </DialogContent>
    </Dialog>
  )
}
