"use client"

import { useState, useEffect } from "react"
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
import { ConferenceStep } from "./steps/conference-step"
import type { AttendanceDays, MealStatus } from "@/types"

type Step = 'attending' | 'days' | 'sleeping' | 'meals' | 'speaking' | 'conference'

interface OnboardingState {
  isAttending: boolean | null
  attendanceDays: AttendanceDays | null
  sleepsOnSite: boolean | null
  wantsToSpeak: boolean | null
}

interface PersistedProgress {
  currentStep: Step
  answers: OnboardingState
}

const STEP_LABELS: Record<Step, string> = {
  attending: 'Venez-vous au weekend ?',
  days: 'Quels jours ?',
  sleeping: 'Hébergement',
  meals: 'Les repas',
  speaking: 'Conférence',
  conference: 'Votre conférence',
}

function storageKey(userId: string) {
  return `onboarding_progress_${userId}`
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
  const [isSavingConference, setIsSavingConference] = useState(false)

  // Restore progress from localStorage once user id is known
  useEffect(() => {
    if (!user?.id) return
    try {
      const raw = localStorage.getItem(storageKey(user.id))
      if (raw) {
        const saved: PersistedProgress = JSON.parse(raw)
        setCurrentStep(saved.currentStep)
        setAnswers(saved.answers)
      }
    } catch {
      // ignore malformed data
    }
  }, [user?.id])

  // Persist progress on every state change
  useEffect(() => {
    if (!user?.id) return
    try {
      const progress: PersistedProgress = { currentStep, answers }
      localStorage.setItem(storageKey(user.id), JSON.stringify(progress))
    } catch {
      // ignore storage errors
    }
  }, [currentStep, answers, user?.id])

  const clearPersistedProgress = () => {
    if (!user?.id) return
    try {
      localStorage.removeItem(storageKey(user.id))
    } catch {
      // ignore
    }
  }

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
      clearPersistedProgress()
      qc.invalidateQueries({ queryKey: queryKeys.userProfile })
      qc.invalidateQueries({ queryKey: queryKeys.meals })
    },
  })

  if (!user || user.onboardingCompletedAt !== null) return null

  // Only show meals step if user is attending AND there are meals available
  const hasMeals = meals.length > 0
  const visibleSteps: Step[] = [
    'attending',
    ...(answers.isAttending === true
      ? ['days' as Step, 'sleeping' as Step, ...(hasMeals ? ['meals' as Step] : [])]
      : []),
    'speaking',
    ...(answers.wantsToSpeak === true ? ['conference' as Step] : []),
  ]

  const currentIndex = visibleSteps.indexOf(currentStep)
  const totalSteps = visibleSteps.length
  const isSubmitting = isCompleting || isSavingMeals || isSavingConference

  const finalComplete = (updatedAnswers: OnboardingState) => {
    completeOnboarding({
      isAttending: updatedAnswers.isAttending,
      attendanceDays: updatedAnswers.attendanceDays ?? 'NONE',
      sleepsOnSite: updatedAnswers.sleepsOnSite,
      wantsToSpeak: updatedAnswers.wantsToSpeak,
    })
  }

  const handleAttending = (value: 'yes' | 'no' | 'unknown') => {
    if (value === 'unknown') {
      const skipped: OnboardingState = { isAttending: null, attendanceDays: 'NONE', sleepsOnSite: null, wantsToSpeak: null }
      setAnswers(skipped)
      updateProfile({ isAttending: null, attendanceDays: 'NONE', sleepsOnSite: null })
      setCurrentStep('speaking')
    } else if (value === 'yes') {
      const updated: OnboardingState = { ...answers, isAttending: true, attendanceDays: 'BOTH' }
      setAnswers(updated)
      updateProfile({ isAttending: true, attendanceDays: 'BOTH' })
      setCurrentStep('days')
    } else {
      const updated: OnboardingState = { ...answers, isAttending: false, attendanceDays: 'NONE', sleepsOnSite: null }
      setAnswers(updated)
      updateProfile({ isAttending: false, attendanceDays: 'NONE', sleepsOnSite: null })
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
    const updated: OnboardingState = { ...answers, sleepsOnSite: value }
    setAnswers(updated)
    updateProfile({ sleepsOnSite: value })
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
    const updated: OnboardingState = { ...answers, wantsToSpeak: value }
    setAnswers(updated)
    if (wantsToSpeak) {
      setCurrentStep('conference')
    } else {
      finalComplete(updated)
    }
  }

  const handleConference = async (data: { title: string; description: string }) => {
    setIsSavingConference(true)
    try {
      await fetch("/api/conferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: data.title, description: data.description || null }),
      })
    } finally {
      setIsSavingConference(false)
    }
    finalComplete({ ...answers, wantsToSpeak: true })
  }

  const handleSkipConference = () => {
    finalComplete({ ...answers, wantsToSpeak: true })
  }

  const handleLater = () => {
    completeOnboarding({
      isAttending: answers.isAttending,
      attendanceDays: answers.attendanceDays ?? 'NONE',
      sleepsOnSite: answers.sleepsOnSite,
      wantsToSpeak: answers.wantsToSpeak,
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
        {currentStep === 'conference' && (
          <ConferenceStep
            onSubmit={handleConference}
            onSkip={handleSkipConference}
            isSubmitting={isSubmitting}
          />
        )}

        <p className="text-xs text-gray-400 text-center mt-3">
          Ces choix pourront être modifiés facilement depuis votre tableau de bord.
        </p>

        <button
          type="button"
          className="mt-1 text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 text-center w-full transition-colors"
          onClick={handleLater}
          disabled={isSubmitting}
        >
          Répondre plus tard
        </button>
      </DialogContent>
    </Dialog>
  )
}
