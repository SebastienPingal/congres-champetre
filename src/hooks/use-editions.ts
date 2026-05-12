import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"

export interface EditionListItem {
  id: string
  name: string
  isActive: boolean
  startDate: string | null
  endDate: string | null
  startHour?: number | null
  endHour?: number | null
  _count?: {
    participations: number
    conferences: number
    timeSlots: number
  }
}

export function useEditions() {
  return useQuery<EditionListItem[]>({
    queryKey: queryKeys.editions,
    queryFn: async () => {
      const res = await fetch("/api/editions")
      if (!res.ok) throw new Error("Impossible de charger les éditions")
      return res.json()
    },
  })
}
