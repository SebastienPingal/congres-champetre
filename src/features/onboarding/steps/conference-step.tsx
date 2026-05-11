"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ConferenceData {
  title: string
  description: string
}

interface ConferenceStepProps {
  onSubmit: (data: ConferenceData) => void
  onSkip: () => void
  isSubmitting: boolean
}

export function ConferenceStep({ onSubmit, onSkip, isSubmitting }: ConferenceStepProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({ title: title.trim(), description: description.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-gray-600 text-center">
        Donnez-nous quelques infos sur votre conférence. Vous pourrez les modifier plus tard.
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="conf-title">Titre <span className="text-red-500">*</span></Label>
        <Input
          id="conf-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex : Introduction à la permaculture"
          disabled={isSubmitting}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="conf-desc">Description <span className="text-gray-400 font-normal">(optionnel)</span></Label>
        <textarea
          id="conf-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Quelques mots sur le contenu de votre conférence…"
          disabled={isSubmitting}
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />
      </div>
      <div className="flex flex-col gap-2 pt-1">
        <Button
          type="submit"
          className="w-full h-12 text-base"
          disabled={isSubmitting || !title.trim()}
        >
          Proposer ma conférence
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full h-10 text-sm text-gray-500"
          onClick={onSkip}
          disabled={isSubmitting}
        >
          Remplir plus tard
        </Button>
      </div>
    </form>
  )
}
