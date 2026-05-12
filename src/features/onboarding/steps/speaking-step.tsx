"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface SpeakingStepProps {
  onAnswer: (value: boolean | null) => void
  isSubmitting: boolean
}

export function SpeakingStep({ onAnswer, isSubmitting }: SpeakingStepProps) {
  const [selected, setSelected] = useState<boolean | null | undefined>(undefined)

  const handle = (value: boolean | null) => {
    setSelected(value)
    onAnswer(value)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-gray-600 text-center">
        Souhaitez-vous proposer une conférence ?
      </p>
      <div className="flex flex-col gap-3">
        <Button
          className="w-full h-14 text-base"
          onClick={() => handle(true)}
          disabled={isSubmitting}
        >
          Oui, j&apos;aimerais présenter quelque chose
        </Button>
        <Button
          variant="outline"
          className="w-full h-14 text-base"
          onClick={() => handle(false)}
          disabled={isSubmitting}
        >
          {isSubmitting && selected === false ? "Chargement..." : "Non, je viendrai juste écouter"}
        </Button>
        <Button
          variant="ghost"
          className="w-full h-12 text-sm text-gray-500"
          onClick={() => handle(null)}
          disabled={isSubmitting}
        >
          {isSubmitting && selected === null ? "Chargement..." : "Je ne sais pas encore"}
        </Button>
      </div>
    </div>
  )
}
