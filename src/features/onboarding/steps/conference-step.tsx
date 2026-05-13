"use client"

import { Button } from "@/components/ui/button"
import { ConferenceForm } from "@/features/conferences/conference-form"

interface ConferenceStepProps {
  onCreated: () => void
  onSkip: () => void
  isCompleting: boolean
}

export function ConferenceStep({ onCreated, onSkip, isCompleting }: ConferenceStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-center text-sm">
        Donnez-nous quelques infos sur votre conférence. Vous pourrez les compléter ou modifier plus tard.
      </p>
      <ConferenceForm onConferenceCreated={onCreated} withCard={false} />
      <Button
        type="button"
        variant="ghost"
        className="w-full h-10 text-sm text-muted-foreground"
        onClick={onSkip}
        disabled={isCompleting}
      >
        {isCompleting ? "Chargement..." : "Remplir plus tard"}
      </Button>
    </div>
  )
}
