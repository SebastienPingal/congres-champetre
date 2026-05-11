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
    'isAttending' | 'attendanceDays' | 'sleepsOnSite' | 'willPayInCash' | 'wantsToSpeak'
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
      if (!res.ok) throw new Error("Erreur lors de la mise à jour")
      return res.json()
    },
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.userProfile, data.user)
    },
  })
}
