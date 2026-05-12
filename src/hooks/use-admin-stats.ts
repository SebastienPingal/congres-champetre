import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"

export interface AdminStats {
  totalUsers: number
  attendingUsers: number
  attendingRate: number
}

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: queryKeys.adminStats,
    queryFn: async () => {
      const res = await fetch("/api/admin/stats")
      if (!res.ok) throw new Error("Impossible de charger les statistiques")
      return res.json()
    },
  })
}
