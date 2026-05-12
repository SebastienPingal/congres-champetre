"use client"

import { Button } from "@/components/ui/button"
import { ConferenceForm } from "@/components/conference-form"

interface ConferenceStepProps {
  onCreated: () => void
  onSkip: () => void
}

export function ConferenceStep({ onCreated, onSkip }: ConferenceStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-gray-600 text-center text-sm">
        Donnez-nous quelques infos sur votre conférence. Vous pourrez les compléter ou modifier plus tard.
      </p>
      <ConferenceForm onConferenceCreated={onCreated} withCard={false} />
      <Button
        type="button"
        variant="ghost"
        className="w-full h-10 text-sm text-gray-500"
        onClick={onSkip}
      >
        Remplir plus tard
      </Button>
    </div>
  )
}
