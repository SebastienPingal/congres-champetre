"use client"

import { Button } from "@/components/ui/button"
import { IntentionLetterContent } from "../intention-letter"

interface IntentionStepProps {
  onContinue: () => void
  isSubmitting: boolean
}

export function IntentionStep({ onContinue, isSubmitting }: IntentionStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <IntentionLetterContent />
      <Button
        className="w-full h-14 text-base"
        onClick={onContinue}
        disabled={isSubmitting}
      >
        C&apos;est parti, on y va ! 🌿
      </Button>
    </div>
  )
}
