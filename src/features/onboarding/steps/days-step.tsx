"use client"

import { Button } from "@/components/ui/button"
import type { AttendanceDays } from "@/types"

interface DaysStepProps {
  onAnswer: (value: AttendanceDays) => void
  isSubmitting: boolean
}

export function DaysStep({ onAnswer, isSubmitting }: DaysStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-center">Quels jours serez-vous là ?</p>
      <div className="flex flex-col gap-3">
        <Button
          className="w-full h-14 text-base"
          onClick={() => onAnswer('BOTH')}
          disabled={isSubmitting}
        >
          Les deux jours
        </Button>
        <Button
          variant="outline"
          className="w-full h-14 text-base"
          onClick={() => onAnswer('DAY1')}
          disabled={isSubmitting}
        >
          Seulement le samedi
        </Button>
        <Button
          variant="outline"
          className="w-full h-14 text-base"
          onClick={() => onAnswer('DAY2')}
          disabled={isSubmitting}
        >
          Seulement le dimanche
        </Button>
        <Button
          variant="ghost"
          className="w-full h-12 text-sm text-muted-foreground"
          onClick={() => onAnswer('UNKNOWN')}
          disabled={isSubmitting}
        >
          Je ne sais pas encore
        </Button>
      </div>
    </div>
  )
}
