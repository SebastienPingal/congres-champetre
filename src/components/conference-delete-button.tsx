"use client"

import { useState, type ComponentProps } from "react"
import { Button } from "@/components/ui/button"

interface ConferenceDeleteButtonProps extends ComponentProps<typeof Button> {
  conferenceId: string
  onDeleted?: () => void
  confirmMessage?: string
  label?: string
}

export function ConferenceDeleteButton({
  conferenceId,
  onDeleted,
  confirmMessage = "Supprimer cette conférence ?",
  label = "Supprimer",
  disabled,
  size = "sm",
  variant = "destructive",
  ...buttonProps
}: ConferenceDeleteButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    const confirmed = window.confirm(confirmMessage)
    if (!confirmed) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/conferences/${conferenceId}`, { method: "DELETE" })
      const result = await response.json().catch(() => ({}))
      if (response.ok) {
        onDeleted?.()
      } else {
        console.error("🧨 Suppression impossible:", result.error || "Erreur inconnue")
      }
    } catch (error) {
      console.error("🧨 Erreur lors de la suppression:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading}
      size={size}
      variant={variant}
      {...buttonProps}
    >
      {isLoading ? "Suppression..." : label}
    </Button>
  )
}






