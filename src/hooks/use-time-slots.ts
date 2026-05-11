import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import type { TimeSlot } from "@/types"

export function useTimeSlots() {
  return useQuery<TimeSlot[]>({
    queryKey: queryKeys.timeslots,
    queryFn: async () => {
      const res = await fetch("/api/timeslots")
      if (!res.ok) throw new Error("Impossible de charger les créneaux")
      return res.json()
    },
    staleTime: 60 * 1000,
  })
}
