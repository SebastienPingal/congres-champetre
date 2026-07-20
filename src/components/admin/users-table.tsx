"use client"

import { useEffect, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Check, X, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAdminUsers, type AdminUserRow, type AdminUsersPayload } from "@/hooks/use-admin-users"
import { queryKeys } from "@/lib/query-keys"
import type { AttendanceDays } from "@/types"

const attendanceOrder: Record<AttendanceDays, number> = {
  NONE: 0,
  DAY1: 1,
  DAY2: 2,
  BOTH: 3,
  UNKNOWN: 4,
}

export function UsersTable() {
  const qc = useQueryClient()
  const { data, isLoading, error: queryError } = useAdminUsers()
  const users = useMemo(() => data?.users ?? [], [data])
  const mealSlots = useMemo(() => data?.mealSlots ?? [], [data])
  const loading = isLoading
  const [error, setError] = useState<string | null>(queryError ? "Impossible de charger les utilisateurs" : null)
  const STORAGE_KEY = "admin-users-filters"

  const patchCachedUsers = (updater: (rows: AdminUserRow[]) => AdminUserRow[]) => {
    qc.setQueryData<AdminUsersPayload>(queryKeys.adminUsers, (prev) =>
      prev ? { ...prev, users: updater(prev.users) } : prev,
    )
  }

  const loadFilters = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch { /* ignore */ }
    return null
  }

  const saved = loadFilters()
  const [searchQuery, setSearchQuery] = useState(saved?.searchQuery ?? "")
  const [filterParticipation, setFilterParticipation] = useState<"ALL" | "YES" | "NO">(saved?.filterParticipation ?? "ALL")
  const [filterSleep, setFilterSleep] = useState<"ALL" | "YES" | "NO">(saved?.filterSleep ?? "ALL")
  const [filterPaid, setFilterPaid] = useState<"ALL" | "YES" | "NO">(saved?.filterPaid ?? "ALL")
  const [filterCash, setFilterCash] = useState<"ALL" | "YES" | "NO">(saved?.filterCash ?? "ALL")
  const [filterDays, setFilterDays] = useState<"ALL" | AttendanceDays>(saved?.filterDays ?? "ALL")
  const [sortKey, setSortKey] = useState<keyof AdminUserRow | "">(saved?.sortKey ?? "")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(saved?.sortDirection ?? "asc")
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        searchQuery, filterParticipation, filterSleep, filterPaid, filterCash, filterDays, sortKey, sortDirection,
      }))
    } catch { /* ignore */ }
  }, [searchQuery, filterParticipation, filterSleep, filterPaid, filterCash, filterDays, sortKey, sortDirection])

  const resetFilters = () => {
    setSearchQuery("")
    setFilterParticipation("ALL")
    setFilterSleep("ALL")
    setFilterDays("ALL")
    setFilterPaid("ALL")
    setFilterCash("ALL")
  }

  const handleDeleteParticipation = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: deleteTarget.id }),
      })
      if (!res.ok) throw new Error("Delete failed")
      patchCachedUsers(prev => prev.map(u =>
        u.id === deleteTarget.id
          ? { ...u, isAttending: null, attendanceDays: "NONE" as AttendanceDays, sleepsOnSite: null, hasPaid: false, willPayInCash: false, mealStatuses: {}, mealTotal: 0 }
          : u
      ))
    } catch {
      setError("Erreur lors de la suppression")
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const filteredAndSortedUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    let result = users.filter(u => {
      const matchesQuery = normalizedQuery.length === 0 ||
        (u.name?.toLowerCase().includes(normalizedQuery) ?? false) ||
        u.email.toLowerCase().includes(normalizedQuery)

      const matchesParticipation = filterParticipation === "ALL" || (filterParticipation === "YES" ? u.isAttending === true : u.isAttending !== true)
      const matchesSleep = filterSleep === "ALL" || (filterSleep === "YES" ? u.sleepsOnSite === true : u.sleepsOnSite !== true)
      const matchesDays = filterDays === "ALL" || u.attendanceDays === filterDays
      const matchesPaid = filterPaid === "ALL" || (filterPaid === "YES" ? u.hasPaid : !u.hasPaid)
      const matchesCash = filterCash === "ALL" || (filterCash === "YES" ? u.willPayInCash : !u.willPayInCash)

      return matchesQuery && matchesParticipation && matchesSleep && matchesDays && matchesPaid && matchesCash
    })

    if (sortKey) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortKey]
        const bVal = b[sortKey]

        let cmp = 0
        if (sortKey === "createdAt" || sortKey === "updatedAt") {
          cmp = new Date(aVal as string).getTime() - new Date(bVal as string).getTime()
        } else if (sortKey === "attendanceDays") {
          cmp = attendanceOrder[aVal as AttendanceDays] - attendanceOrder[bVal as AttendanceDays]
        } else if (typeof aVal === "boolean" && typeof bVal === "boolean") {
          cmp = Number(aVal) - Number(bVal)
        } else {
          cmp = String(aVal ?? "").localeCompare(String(bVal ?? ""))
        }

        return sortDirection === "asc" ? cmp : -cmp
      })
    }

    return result
  }, [users, searchQuery, filterParticipation, filterSleep, filterPaid, filterCash, filterDays, sortKey, sortDirection])

  const applySort = (key: keyof AdminUserRow) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  const SortHeader = ({ label, column }: { label: string, column: keyof AdminUserRow }) => (
    <button
      type="button"
      onClick={() => applySort(column)}
      className="text-left w-full flex items-center gap-1"
    >
      <span>{label}</span>
      {sortKey === column ? (
        <span aria-hidden>{sortDirection === "asc" ? "▲" : "▼"}</span>
      ) : (
        <span className="opacity-40" aria-hidden>↕</span>
      )}
    </button>
  )

  const mealCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const slot of mealSlots) {
      counts[slot.id] = filteredAndSortedUsers.filter(u => u.mealStatuses[slot.id] === "PRESENT").length
    }
    return counts
  }, [mealSlots, filteredAndSortedUsers])

  const budgetTotal = useMemo(() => {
    return filteredAndSortedUsers.reduce((sum, u) => sum + u.mealTotal, 0)
  }, [filteredAndSortedUsers])

  const toggleMealStatus = async (userId: string, slotId: string, currentStatus: string | undefined) => {
    // Cycle: undefined → PRESENT → ABSENT → undefined
    let nextStatus: "PRESENT" | "ABSENT" | null
    if (!currentStatus) {
      nextStatus = "PRESENT"
    } else if (currentStatus === "PRESENT") {
      nextStatus = "ABSENT"
    } else {
      nextStatus = null
    }

    // Optimistic update
    patchCachedUsers(prev => prev.map(u => {
      if (u.id !== userId) return u
      const newStatuses = { ...u.mealStatuses }
      if (nextStatus === null) {
        delete newStatuses[slotId]
      } else {
        newStatuses[slotId] = nextStatus
      }
      // Recalculate meal total
      let newTotal = 0
      for (const s of mealSlots) {
        if (newStatuses[s.id] === "PRESENT") {
          newTotal += s.price ?? 0
        }
      }
      return { ...u, mealStatuses: newStatuses, mealTotal: newTotal }
    }))

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, mealStatusUpdate: { timeSlotId: slotId, status: nextStatus } }),
      })
      if (!res.ok) throw new Error("Update failed")
    } catch {
      // Revert on failure
      patchCachedUsers(prev => prev.map(u => {
        if (u.id !== userId) return u
        const newStatuses = { ...u.mealStatuses }
        if (currentStatus) {
          newStatuses[slotId] = currentStatus
        } else {
          delete newStatuses[slotId]
        }
        let newTotal = 0
        for (const s of mealSlots) {
          if (newStatuses[s.id] === "PRESENT") {
            newTotal += s.price ?? 0
          }
        }
        return { ...u, mealStatuses: newStatuses, mealTotal: newTotal }
      }))
    }
  }

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">⏳ Chargement des utilisateurs…</div>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">🚨 {error}</div>
    )
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Filtres */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="search">Recherche</Label>
          <Input
            id="search"
            placeholder="Nom ou email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="participation">Participe</Label>
          <select
            id="participation"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={filterParticipation}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterParticipation(e.target.value as ("ALL" | "YES" | "NO"))}
          >
            <option value="ALL">Tous</option>
            <option value="YES">Oui</option>
            <option value="NO">Non</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="sleep">Dort sur place</Label>
          <select
            id="sleep"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={filterSleep}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterSleep(e.target.value as ("ALL" | "YES" | "NO"))}
          >
            <option value="ALL">Tous</option>
            <option value="YES">Oui</option>
            <option value="NO">Non</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="paid">A payé</Label>
          <select
            id="paid"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={filterPaid}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterPaid(e.target.value as ("ALL" | "YES" | "NO"))}
          >
            <option value="ALL">Tous</option>
            <option value="YES">Oui</option>
            <option value="NO">Non</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="cash">Paiera en cash</Label>
          <select
            id="cash"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={filterCash}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterCash(e.target.value as ("ALL" | "YES" | "NO"))}
          >
            <option value="ALL">Tous</option>
            <option value="YES">Oui</option>
            <option value="NO">Non</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="days">Jours</Label>
          <select
            id="days"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={filterDays}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterDays(e.target.value as ("ALL" | AttendanceDays))}
          >
            <option value="ALL">Tous</option>
            <option value="NONE">—</option>
            <option value="DAY1">Jour 1</option>
            <option value="DAY2">Jour 2</option>
            <option value="BOTH">Les deux</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={resetFilters}>♻️ Réinitialiser</Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFilterPaid("NO")
              setFilterCash("ALL")
            }}
          >
            Non payés
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFilterCash("YES")
            }}
          >
            Cash
          </Button>
        </div>
      </div>

      <Table>
        <TableCaption>Liste des utilisateurs</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead><SortHeader label="Nom" column="name" /></TableHead>
            <TableHead><SortHeader label="Email" column="email" /></TableHead>
            <TableHead><SortHeader label="Parle ?" column="wantsToSpeak" /></TableHead>
            <TableHead><SortHeader label="Participe" column="isAttending" /></TableHead>
            <TableHead><SortHeader label="Jours" column="attendanceDays" /></TableHead>
            <TableHead><SortHeader label="Dort" column="sleepsOnSite" /></TableHead>
            <TableHead><SortHeader label="Payé" column="hasPaid" /></TableHead>
            <TableHead><SortHeader label="Cash" column="willPayInCash" /></TableHead>
            {mealSlots.map((slot) => (
              <TableHead key={slot.id} className="text-center px-2 max-w-[80px]">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-xs leading-tight">{slot.title}</span>
                  <span className="text-xs text-muted-foreground font-normal">{mealCounts[slot.id]}</span>
                </div>
              </TableHead>
            ))}
            <TableHead><SortHeader label="Total" column="mealTotal" /></TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedUsers.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.name ?? "—"}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>
                {u.wantsToSpeak === true ? (
                  <Badge className="bg-warn-bg text-warn">Oui</Badge>
                ) : u.wantsToSpeak === false ? (
                  <Badge variant="outline">Non</Badge>
                ) : (
                  <Badge className="bg-muted text-muted-foreground">?</Badge>
                )}
              </TableCell>
              <TableCell>
                {u.isAttending === true ? (
                  <Badge className="bg-green-soft text-primary">Oui</Badge>
                ) : u.isAttending === false ? (
                  <Badge className="bg-muted text-foreground">Non</Badge>
                ) : (
                  <Badge className="bg-muted text-muted-foreground">?</Badge>
                )}
              </TableCell>
              <TableCell>
                {u.attendanceDays === "NONE" && (
                  <Badge variant="outline">—</Badge>
                )}
                {u.attendanceDays === "DAY1" && (
                  <Badge className="bg-talk-soft text-talk">Jour 1</Badge>
                )}
                {u.attendanceDays === "DAY2" && (
                  <Badge className="bg-warn-bg text-warn">Jour 2</Badge>
                )}
                {u.attendanceDays === "BOTH" && (
                  <Badge className="bg-green-soft text-primary">Les deux</Badge>
                )}
                {u.attendanceDays === "UNKNOWN" && (
                  <Badge className="bg-muted text-muted-foreground">?</Badge>
                )}
              </TableCell>
              <TableCell>
                {u.sleepsOnSite === true ? (
                  <Badge className="bg-talk-soft text-talk">Oui</Badge>
                ) : u.sleepsOnSite === false ? (
                  <Badge variant="outline">Non</Badge>
                ) : (
                  <Badge className="bg-muted text-muted-foreground">?</Badge>
                )}
              </TableCell>
              <TableCell className={u.isAttending === true && !u.hasPaid ? "bg-destructive/30" : undefined}>
                <div className="flex items-center gap-2">
                  <Checkbox
                    aria-label="A payé"
                    checked={u.hasPaid}
                    onCheckedChange={async (value) => {
                      if (typeof value !== "boolean") return
                      const next = value
                      patchCachedUsers(prev => prev.map(x => x.id === u.id ? { ...x, hasPaid: next } : x))
                      try {
                        const res = await fetch("/api/admin/users", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId: u.id, hasPaid: next })
                        })
                        if (!res.ok) throw new Error("Update failed")
                      } catch {
                        patchCachedUsers(prev => prev.map(x => x.id === u.id ? { ...x, hasPaid: !next } : x))
                      }
                    }}
                  />
                </div>
              </TableCell>
              <TableCell className={u.willPayInCash ? "bg-warn-border" : undefined}>
                <div className="flex items-center gap-2">
                  <Checkbox
                    aria-label="Paiera en cash"
                    checked={u.willPayInCash}
                    onCheckedChange={async (value) => {
                      if (typeof value !== "boolean") return
                      const next = value
                      patchCachedUsers(prev => prev.map(x => x.id === u.id ? { ...x, willPayInCash: next } : x))
                      try {
                        const res = await fetch("/api/admin/users", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId: u.id, willPayInCash: next })
                        })
                        if (!res.ok) throw new Error("Update failed")
                      } catch {
                        patchCachedUsers(prev => prev.map(x => x.id === u.id ? { ...x, willPayInCash: !next } : x))
                      }
                    }}
                  />
                </div>
              </TableCell>
              {mealSlots.map((slot) => {
                const status = u.mealStatuses[slot.id]
                return (
                  <TableCell key={slot.id} className="text-center px-2">
                    <button
                      type="button"
                      className="w-full flex justify-center items-center cursor-pointer hover:bg-muted rounded p-1 transition-colors"
                      title={status === "PRESENT" ? "Présent → Absent" : status === "ABSENT" ? "Absent → Non renseigné" : "Non renseigné → Présent"}
                      onClick={() => toggleMealStatus(u.id, slot.id, status)}
                    >
                      {status === "PRESENT" ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : status === "ABSENT" ? (
                        <X className="h-4 w-4 text-destructive" />
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </button>
                  </TableCell>
                )
              })}
              <TableCell>
                {u.mealTotal > 0 ? (
                  <span className="text-sm font-medium">{u.mealTotal} €</span>
                ) : (
                  <span className="text-muted-foreground/80">—</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {(u.isAttending !== null
                  || u.sleepsOnSite !== null
                  || u.attendanceDays !== "NONE"
                  || u.hasPaid
                  || u.willPayInCash
                  || Object.keys(u.mealStatuses).length > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteTarget(u)}
                    title="Réinitialiser les réponses (réaffiche l'onboarding)"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-end">
        <div className="rounded-lg border bg-card px-4 py-3 text-sm">
          <span className="text-muted-foreground">Budget total{filteredAndSortedUsers.length !== users.length ? " (filtré)" : ""} :</span>{" "}
          <span className="font-semibold text-lg">{budgetTotal} €</span>
          <span className="text-muted-foreground ml-2">
            ({filteredAndSortedUsers.filter(u => u.mealTotal > 0).length} personnes)
          </span>
        </div>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réinitialiser les réponses</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir réinitialiser les réponses de{" "}
              <strong>{deleteTarget?.name ?? deleteTarget?.email}</strong> ?
              Cette action supprimera sa participation, ses conférences proposées et ses inscriptions aux repas pour cette édition.
              La modale d&apos;onboarding lui sera de nouveau présentée à sa prochaine connexion.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteParticipation} disabled={deleting}>
              {deleting ? "Suppression…" : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
