import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import type { MealSlot } from "@/types"

export function useMeals() {
  return useQuery<MealSlot[]>({
    queryKey: queryKeys.meals,
    queryFn: async () => {
      const res = await fetch("/api/meals")
      if (!res.ok) throw new Error("Impossible de charger les repas")
      return res.json()
    },
  })
}

export function useUpdateMealStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      timeSlotId,
      status,
    }: {
      timeSlotId: string
      status: "PRESENT" | "ABSENT"
    }) => {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeSlotId, status }),
      })
      if (!res.ok) throw new Error("Erreur lors de la mise à jour du repas")
      return res.json()
    },
    onSuccess: (data, variables) => {
      qc.setQueryData<MealSlot[]>(queryKeys.meals, (prev) =>
        prev?.map((m) =>
          m.id === variables.timeSlotId ? { ...m, status: data.status } : m
        ) ?? []
      )
    },
  })
}
