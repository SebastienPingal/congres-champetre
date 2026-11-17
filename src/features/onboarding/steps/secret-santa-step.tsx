"use client"

import { Button } from "@/components/ui/button"

interface SecretSantaStepProps {
  onAnswer: (value: boolean | null) => void
  isSubmitting: boolean
}

export function SecretSantaStep({ onAnswer, isSubmitting }: SecretSantaStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-center">
        Chaque volontaire offre un petit cadeau à une personne tirée au sort parmi les participants
        présents. Voulez-vous participer au Secret Santa ? 🎁
      </p>
      <div className="flex flex-col gap-3">
        <Button
          className="w-full h-14 text-base"
          onClick={() => onAnswer(true)}
          disabled={isSubmitting}
        >
          Oui, je participe !
        </Button>
        <Button
          variant="outline"
          className="w-full h-14 text-base"
          onClick={() => onAnswer(false)}
          disabled={isSubmitting}
        >
          Non merci
        </Button>
        <Button
          variant="ghost"
          className="w-full h-12 text-sm text-muted-foreground"
          onClick={() => onAnswer(null)}
          disabled={isSubmitting}
        >
          Je ne sais pas encore
        </Button>
      </div>
    </div>
  )
}
