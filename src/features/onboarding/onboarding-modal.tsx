"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { queryKeys } from "@/lib/query-keys"
import { useUserProfile, useUpdateProfile } from "@/hooks/use-user-profile"
import { AttendingStep } from "./steps/attending-step"
import { DaysStep } from "./steps/days-step"
import { SleepingStep } from "./steps/sleeping-step"
import { SpeakingStep } from "./steps/speaking-step"
import type { AttendanceDays } from "@/types"

type Step = 'attending' | 'days' | 'sleeping' | 'speaking'

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
  speaking: 'Conférence',
}

export function OnboardingModal() {
  const { data: user } = useUserProfile()
  const { mutate: updateProfile } = useUpdateProfile()
  const qc = useQueryClient()

  const [currentStep, setCurrentStep] = useState<Step>('attending')
  const [answers, setAnswers] = useState<OnboardingState>({
    isAttending: null,
    attendanceDays: null,
    sleepsOnSite: null,
    wantsToSpeak: null,
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
    },
  })

  if (!user || user.onboardingCompletedAt !== null) return null

  const visibleSteps: Step[] = ['attending', ...(answers.isAttending ? ['days' as Step, 'sleeping' as Step] : []), 'speaking']
  const currentIndex = visibleSteps.indexOf(currentStep)
  const totalSteps = visibleSteps.length

  const saveAndAdvance = (updatedAnswers: OnboardingState, nextStep: Step | null) => {
    const patch: Record<string, unknown> = {}
    if (updatedAnswers.isAttending !== null) patch.isAttending = updatedAnswers.isAttending
    if (updatedAnswers.attendanceDays !== null) patch.attendanceDays = updatedAnswers.attendanceDays
    if (updatedAnswers.sleepsOnSite !== null) patch.sleepsOnSite = updatedAnswers.sleepsOnSite
    if (updatedAnswers.wantsToSpeak !== null) patch.wantsToSpeak = updatedAnswers.wantsToSpeak

    if (nextStep === null) {
      completeOnboarding(patch)
    } else {
      if (Object.keys(patch).length > 0) {
        updateProfile(patch as Parameters<typeof updateProfile>[0])
      }
      setCurrentStep(nextStep)
    }
  }

  const handleAttending = (value: 'yes' | 'no' | 'unknown') => {
    const isAttending = value === 'yes'
    const attendanceDays: AttendanceDays = isAttending ? 'BOTH' : 'NONE'
    const updated: OnboardingState = { ...answers, isAttending, attendanceDays }
    setAnswers(updated)

    if (value === 'unknown') {
      const finalAnswers: OnboardingState = { isAttending: false, attendanceDays: 'NONE', sleepsOnSite: false, wantsToSpeak: null }
      setAnswers(finalAnswers)
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
    saveAndAdvance(updated, 'speaking')
  }

  const handleSpeaking = (value: boolean | null) => {
    const wantsToSpeak = value ?? false
    const updated: OnboardingState = { ...answers, wantsToSpeak }
    setAnswers(updated)
    saveAndAdvance(updated, null)
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
        className="sm:max-w-md"
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
          <AttendingStep onAnswer={handleAttending} isSubmitting={isCompleting} />
        )}
        {currentStep === 'days' && (
          <DaysStep onAnswer={handleDays} isSubmitting={isCompleting} />
        )}
        {currentStep === 'sleeping' && (
          <SleepingStep onAnswer={handleSleeping} isSubmitting={isCompleting} />
        )}
        {currentStep === 'speaking' && (
          <SpeakingStep onAnswer={handleSpeaking} isSubmitting={isCompleting} />
        )}

        <button
          type="button"
          className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 text-center w-full transition-colors"
          onClick={handleLater}
          disabled={isCompleting}
        >
          Répondre plus tard
        </button>
      </DialogContent>
    </Dialog>
  )
}
