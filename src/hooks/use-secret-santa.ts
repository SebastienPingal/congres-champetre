import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import type { SecretSantaStatus, AdminSecretSantaStatus } from "@/types"

async function readError(res: Response, fallback: string): Promise<never> {
  const body = await res.json().catch(() => null)
  throw new Error(body?.error ?? fallback)
}

export function useSecretSanta() {
  return useQuery<SecretSantaStatus>({
    queryKey: queryKeys.secretSanta,
    queryFn: async () => {
      const res = await fetch("/api/secret-santa")
      if (!res.ok) return readError(res, "Impossible de charger le Secret Santa")
      return res.json()
    },
  })
}

export function useRevealSecretSanta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<SecretSantaStatus> => {
      const res = await fetch("/api/secret-santa/reveal", { method: "POST" })
      if (!res.ok) return readError(res, "Impossible d'ouvrir le cadeau")
      return res.json()
    },
    onSuccess: (data) => {
      qc.setQueryData<SecretSantaStatus>(queryKeys.secretSanta, data)
    },
  })
}

export function useAdminSecretSanta() {
  return useQuery<AdminSecretSantaStatus>({
    queryKey: queryKeys.adminSecretSanta,
    queryFn: async () => {
      const res = await fetch("/api/admin/secret-santa")
      if (!res.ok) return readError(res, "Impossible de charger le Secret Santa")
      return res.json()
    },
  })
}

export function useDrawSecretSanta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<AdminSecretSantaStatus> => {
      const res = await fetch("/api/admin/secret-santa", { method: "POST" })
      if (!res.ok) return readError(res, "Erreur lors du tirage")
      return res.json()
    },
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.adminSecretSanta, data)
      qc.invalidateQueries({ queryKey: queryKeys.secretSanta })
    },
  })
}

export function useCancelSecretSanta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<AdminSecretSantaStatus> => {
      const res = await fetch("/api/admin/secret-santa", { method: "DELETE" })
      if (!res.ok) return readError(res, "Erreur lors de l'annulation")
      return res.json()
    },
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.adminSecretSanta, data)
      qc.invalidateQueries({ queryKey: queryKeys.secretSanta })
    },
  })
}

export function useNotifySecretSanta() {
  return useMutation({
    mutationFn: async (target: "unrevealed" | "all"): Promise<{ total: number; sent: number; failed: number }> => {
      const res = await fetch("/api/admin/secret-santa/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      })
      if (!res.ok) return readError(res, "Erreur lors de l'envoi des mails")
      return res.json()
    },
  })
}
