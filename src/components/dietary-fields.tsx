"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DIETARY_NOTES_MAX_LENGTH, DIETARY_OPTIONS, type DietaryRestriction } from "@/lib/dietary"

export interface DietaryValue {
  restrictions: DietaryRestriction[]
  notes: string
}

interface DietaryFieldsProps {
  value: DietaryValue
  onChange: (value: DietaryValue) => void
  disabled?: boolean
}

/**
 * Champs contrôlés du régime alimentaire (cases + « Autre » en texte libre).
 * Partagé entre l'étape repas de l'onboarding et la section Repas du dashboard.
 */
export function DietaryFields({ value, onChange, disabled }: DietaryFieldsProps) {
  const toggle = (restriction: DietaryRestriction, checked: boolean) => {
    const restrictions = checked
      ? [...value.restrictions, restriction]
      : value.restrictions.filter((r) => r !== restriction)
    onChange({ ...value, restrictions })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {DIETARY_OPTIONS.map((option) => {
          const id = `diet-${option.value}`
          return (
            <div key={option.value} className="flex items-center gap-2">
              <Checkbox
                id={id}
                checked={value.restrictions.includes(option.value)}
                onCheckedChange={(checked) => toggle(option.value, checked === true)}
                disabled={disabled}
              />
              <Label htmlFor={id} className="text-sm font-normal">{option.label}</Label>
            </div>
          )
        })}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="diet-notes" className="text-sm">Autre (allergie, intolérance…)</Label>
        <Input
          id="diet-notes"
          value={value.notes}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          maxLength={DIETARY_NOTES_MAX_LENGTH}
          placeholder="Ex. : allergie aux crustacés"
          disabled={disabled}
        />
      </div>
    </div>
  )
}
