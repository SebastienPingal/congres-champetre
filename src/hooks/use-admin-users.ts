import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import type { AttendanceDays } from "@/types"

export interface AdminMealSlot {
  id: string
  title: string
  price: number | null
}

export interface AdminUserRow {
  id: string
  name: string | null
  email: string
  role: "USER" | "ADMIN"
  wantsToSpeak: boolean | null
  isAttending: boolean | null
  attendanceDays: AttendanceDays
  sleepsOnSite: boolean | null
  hasPaid: boolean
  willPayInCash: boolean
  mealStatuses: Record<string, string>
  mealTotal: number
  lastLoginAt: string | null
  hasLoggedInSinceEdition: boolean
  createdAt: string
  updatedAt: string
}

export interface AdminUsersPayload {
  users: AdminUserRow[]
  mealSlots: AdminMealSlot[]
}

export function useAdminUsers() {
  return useQuery<AdminUsersPayload>({
    queryKey: queryKeys.adminUsers,
    queryFn: async () => {
      const res = await fetch("/api/admin/users")
      if (!res.ok) throw new Error("Impossible de charger les utilisateurs")
      return res.json()
    },
  })
}
