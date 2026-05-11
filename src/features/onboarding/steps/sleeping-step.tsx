"use client"

import { Button } from "@/components/ui/button"

interface SleepingStepProps {
  onAnswer: (value: boolean | null) => void
  isSubmitting: boolean
}

export function SleepingStep({ onAnswer, isSubmitting }: SleepingStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-gray-600 text-center">Dormirez-vous sur place ?</p>
      <div className="flex flex-col gap-3">
        <Button
          className="w-full h-14 text-base"
          onClick={() => onAnswer(true)}
          disabled={isSubmitting}
        >
          Oui, je dors sur place
        </Button>
        <Button
          variant="outline"
          className="w-full h-14 text-base"
          onClick={() => onAnswer(false)}
          disabled={isSubmitting}
        >
          Non, je rentre chez moi
        </Button>
        <Button
          variant="ghost"
          className="w-full h-12 text-sm text-gray-500"
          onClick={() => onAnswer(null)}
          disabled={isSubmitting}
        >
          Je ne sais pas encore
        </Button>
      </div>
    </div>
  )
}
