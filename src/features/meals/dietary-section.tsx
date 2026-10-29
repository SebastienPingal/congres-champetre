"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { DietaryFields, type DietaryValue } from "@/components/dietary-fields"
import { useUpdateProfile } from "@/hooks/use-user-profile"
import type { UserProfile } from "@/types"

interface DietarySectionProps {
  user: UserProfile
}

function toValue(user: UserProfile): DietaryValue {
  return { restrictions: user.dietaryRestrictions, notes: user.dietaryNotes ?? "" }
}

/** Encart « Régime alimentaire » sous la liste des repas. Porté par le User, jamais verrouillé. */
export function DietarySection({ user }: DietarySectionProps) {
  const { mutate: updateProfile, isPending, isError } = useUpdateProfile()
  const [value, setValue] = useState<DietaryValue>(() => toValue(user))

  // Resynchronise si le profil change ailleurs (ex. onboarding).
  useEffect(() => {
    setValue(toValue(user))
  }, [user.dietaryRestrictions, user.dietaryNotes]) // eslint-disable-line react-hooks/exhaustive-deps

  const saved = toValue(user)
  const isDirty =
    value.notes.trim() !== saved.notes ||
    value.restrictions.length !== saved.restrictions.length ||
    value.restrictions.some((r) => !saved.restrictions.includes(r))

  const handleSave = () => {
    updateProfile({ dietaryRestrictions: value.restrictions, dietaryNotes: value.notes.trim() || null })
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-surface p-4">
      <div className="flex flex-col gap-1">
        <h4 className="font-medium">Régime alimentaire</h4>
        <p className="text-sm text-muted-foreground">
          Important pour qu&apos;on prévoie de quoi bien vous nourrir : cochez ce qui vous concerne.
        </p>
      </div>
      <DietaryFields value={value} onChange={setValue} disabled={isPending} />
      <div className="flex items-center justify-end gap-3">
        {isError && <span className="text-sm text-destructive">Erreur lors de l&apos;enregistrement</span>}
        <Button type="button" size="sm" onClick={handleSave} disabled={!isDirty || isPending}>
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </div>
  )
}
