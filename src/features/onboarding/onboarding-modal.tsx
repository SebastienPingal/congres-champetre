"use client"

import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { queryKeys } from "@/lib/query-keys"
import { useUserProfile, useUpdateProfile } from "@/hooks/use-user-profile"
import { useMeals } from "@/hooks/use-meals"
import { IntentionStep } from "./steps/intention-step"
import { AttendingStep } from "./steps/attending-step"
import { DaysStep } from "./steps/days-step"
import { SleepingStep } from "./steps/sleeping-step"
import { SpeakingStep } from "./steps/speaking-step"
import { MealsStep } from "./steps/meals-step"
import { ConferenceStep } from "./steps/conference-step"
import type { AttendanceDays, MealStatus } from "@/types"

type Step = 'intention' | 'attending' | 'days' | 'sleeping' | 'meals' | 'speaking' | 'conference'

interface OnboardingState {
  isAttending: boolean | null
  attendanceDays: AttendanceDays | null
  sleepsOnSite: boolean | null
  wantsToSpeak: boolean | null
}

const STEP_LABELS: Record<Step, string> = {
  intention: 'Lettre d\'intention',
  attending: 'Venez-vous au weekend ?',
  days: 'Quels jours ?',
  sleeping: 'Hébergement',
  meals: 'Les repas',
  speaking: 'Conférence',
  conference: 'Votre conférence',
}

export function OnboardingModal() {
  const { data: user } = useUserProfile()
  const { data: meals = [] } = useMeals()
  const { mutate: updateProfile } = useUpdateProfile()
  const qc = useQueryClient()

  const [currentStep, setCurrentStep] = useState<Step>('intention')
  const [answersInitialized, setAnswersInitialized] = useState(false)
  const [answers, setAnswers] = useState<OnboardingState>({
    isAttending: null,
    attendanceDays: null,
    sleepsOnSite: null,
    wantsToSpeak: null,
  })

  useEffect(() => {
    if (user && !answersInitialized) {
      setAnswers({
        isAttending: user.isAttending,
        attendanceDays: user.isAttending ? user.attendanceDays : null,
        sleepsOnSite: user.sleepsOnSite,
        wantsToSpeak: user.wantsToSpeak,
      })
      setAnswersInitialized(true)
    }
  }, [user, answersInitialized])

  const { mutateAsync: saveMeals, isPending: isSavingMeals } = useMutation({
    mutationFn: async (selections: Record<string, MealStatus>) => {
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
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.meals })
    },
  })

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

  // On affiche l'onboarding tant que la personne n'a pas indiqué si elle vient
  // (isAttending === null), même si elle a déjà « répondu plus tard » lors d'une
  // édition précédente. Une fois l'onboarding complété ET la présence renseignée,
  // la modale disparaît. (Reste masquée si les inscriptions sont fermées.)
  if (!user || user.edition.isRegistrationClosed) return null
  if (user.onboardingCompletedAt !== null && user.isAttending !== null) return null

  // Only show meals step if user is attending AND there are meals available
  const hasMeals = meals.length > 0
  const visibleSteps: Step[] = [
    'intention',
    'attending',
    ...(answers.isAttending === true
      ? ['days' as Step, 'sleeping' as Step, ...(hasMeals ? ['meals' as Step] : [])]
      : []),
    'speaking',
    ...(answers.wantsToSpeak === true ? ['conference' as Step] : []),
  ]

  const currentIndex = visibleSteps.indexOf(currentStep)
  const totalSteps = visibleSteps.length
  const isSubmitting = isCompleting || isSavingMeals

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
    await saveMeals(selections)
    setCurrentStep('speaking')
  }

  const handleSpeaking = (value: boolean | null) => {
    const updated: OnboardingState = { ...answers, wantsToSpeak: value }
    setAnswers(updated)
    if (value === true) {
      setCurrentStep('conference')
    } else {
      finalComplete(updated)
    }
  }

  // Called after conference creation (via ConferenceForm) or when user skips the step
  const handleConferenceDone = () => {
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
        className={`flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 ${currentStep === 'intention' ? 'sm:max-w-lg' : 'sm:max-w-md'}`}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* En-tête figé */}
        <div className="shrink-0 border-b px-6 pt-6 pb-3" style={{ borderColor: "var(--line)" }}>
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Bienvenue au Congrès Champêtre !
            </DialogTitle>
          </DialogHeader>

          {/* Progress bar */}
          <div className="flex gap-1.5 mt-3 mb-2">
            {visibleSteps.map((step, i) => (
              <div
                key={step}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= currentIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground/80 text-center mb-2">
            Étape {currentIndex + 1} sur {totalSteps} — {STEP_LABELS[currentStep]}
          </p>

          <h2 className="text-lg font-semibold text-center">
            {STEP_LABELS[currentStep]}
          </h2>
        </div>

        {/* Contenu défilant */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          {currentStep === 'intention' && <IntentionStep />}
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
            <ConferenceStep onCreated={handleConferenceDone} onSkip={handleConferenceDone} isCompleting={isCompleting} />
          )}
        </div>

        {/* Pied figé */}
        <div className="shrink-0 border-t px-6 pt-3 pb-6" style={{ borderColor: "var(--line)" }}>
          {currentStep === 'intention' ? (
            <Button
              className="w-full h-14 text-base"
              onClick={() => setCurrentStep('attending')}
              disabled={isSubmitting}
            >
              Continuer
            </Button>
          ) : (
            <>
              <p className="text-xs text-muted-foreground/80 text-center">
                Ces choix pourront être modifiés facilement depuis votre tableau de bord.
              </p>

              <button
                type="button"
                className="mt-1 text-xs text-muted-foreground/80 hover:text-muted-foreground underline underline-offset-2 text-center w-full transition-colors"
                onClick={handleLater}
                disabled={isSubmitting}
              >
                Répondre plus tard
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
