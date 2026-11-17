import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import type { UserProfile } from "@/types"

async function fetchUserProfile(): Promise<UserProfile> {
  const res = await fetch("/api/user/profile")
  if (!res.ok) throw new Error("Impossible de charger le profil")
  return res.json()
}

export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.userProfile,
    queryFn: fetchUserProfile,
  })
}

type ProfilePatch = Partial<
  Pick<
    UserProfile,
    | 'isAttending'
    | 'attendanceDays'
    | 'sleepsOnSite'
    | 'willPayInCash'
    | 'wantsToSpeak'
    | 'dietaryRestrictions'
    | 'dietaryNotes'
    | 'wantsSecretSanta'
  >
>

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: ProfilePatch) => {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? "Erreur lors de la mise à jour")
      }
      return res.json()
    },
    onSuccess: (data, payload) => {
      qc.setQueryData(queryKeys.userProfile, data.user)
      // Le statut Secret Santa dépend de l'inscription ET de la présence.
      if ("wantsSecretSanta" in payload || "isAttending" in payload) {
        qc.invalidateQueries({ queryKey: queryKeys.secretSanta })
      }
    },
  })
}
