"use client"

import { Button } from "@/components/ui/button"

interface AttendingStepProps {
  onAnswer: (value: 'yes' | 'no' | 'unknown') => void
  isSubmitting: boolean
}

export function AttendingStep({ onAnswer, isSubmitting }: AttendingStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-center">
        Serez-vous présent(e) au weekend ?
      </p>
      <div className="flex flex-col gap-3">
        <Button
          className="w-full h-14 text-base"
          onClick={() => onAnswer('yes')}
          disabled={isSubmitting}
        >
          Oui, je viens !
        </Button>
        <Button
          variant="outline"
          className="w-full h-14 text-base"
          onClick={() => onAnswer('no')}
          disabled={isSubmitting}
        >
          Non, je ne pourrai pas venir
        </Button>
        <Button
          variant="ghost"
          className="w-full h-12 text-sm text-muted-foreground"
          onClick={() => onAnswer('unknown')}
          disabled={isSubmitting}
        >
          Je ne sais pas encore
        </Button>
      </div>
    </div>
  )
}
