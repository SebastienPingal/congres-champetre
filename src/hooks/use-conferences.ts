import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"

export function useCreateConference() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      title: string
      description: string | null
      timeSlotId: string | null
    }) => {
      const res = await fetch("/api/conferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur lors de la création")
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.userProfile })
      qc.invalidateQueries({ queryKey: queryKeys.timeslots })
    },
  })
}

export function useUpdateConference() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string
      title: string
      description: string | null
      timeSlotId?: string | null
    }) => {
      const res = await fetch(`/api/conferences/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur lors de la mise à jour")
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.userProfile })
      qc.invalidateQueries({ queryKey: queryKeys.timeslots })
    },
  })
}

export function useDeleteConference() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/conferences/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Suppression impossible")
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.userProfile })
      qc.invalidateQueries({ queryKey: queryKeys.timeslots })
    },
  })
}
