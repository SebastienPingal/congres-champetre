"use client"

import type { ComponentProps } from "react"
import { Button } from "@/components/ui/button"
import { useDeleteConference } from "@/hooks/use-conferences"

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
  const { mutate: deleteConference, isPending } = useDeleteConference()

  const handleClick = () => {
    if (!window.confirm(confirmMessage)) return
    deleteConference(conferenceId, { onSuccess: onDeleted })
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={disabled || isPending}
      size={size}
      variant={variant}
      {...buttonProps}
    >
      {isPending ? "Suppression..." : label}
    </Button>
  )
}
