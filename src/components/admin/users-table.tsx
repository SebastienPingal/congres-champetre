"use client"

import { useEffect, useMemo, useState } from "react"
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

type AttendanceDays = "NONE" | "DAY1" | "DAY2" | "BOTH"

interface MealSlot {
  id: string
  title: string
  price: number | null
}

interface AdminUserRow {
  id: string
  name: string | null
  email: string
  role: "USER" | "ADMIN"
  wantsToSpeak: boolean
  isAttending: boolean
  attendanceDays: AttendanceDays
  sleepsOnSite: boolean
  hasPaid: boolean
  willPayInCash: boolean
  mealStatuses: Record<string, string>
  mealTotal: number
  createdAt: string
  updatedAt: string
}

const attendanceOrder: Record<AttendanceDays, number> = {
  NONE: 0,
  DAY1: 1,
  DAY2: 2,
  BOTH: 3,
}

export function UsersTable() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [mealSlots, setMealSlots] = useState<MealSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const STORAGE_KEY = "admin-users-filters"

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
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/admin/users")
        if (!res.ok) throw new Error("Failed to fetch users")
        const data = await res.json()
        setUsers(data.users)
        setMealSlots(data.mealSlots)
      } catch {
        setError("Impossible de charger les utilisateurs")
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

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
      setUsers(prev => prev.map(u =>
        u.id === deleteTarget.id
          ? { ...u, isAttending: false, attendanceDays: "NONE" as AttendanceDays, sleepsOnSite: false, hasPaid: false, willPayInCash: false, mealStatuses: {}, mealTotal: 0 }
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

      const matchesParticipation = filterParticipation === "ALL" || (filterParticipation === "YES" ? u.isAttending : !u.isAttending)
      const matchesSleep = filterSleep === "ALL" || (filterSleep === "YES" ? u.sleepsOnSite : !u.sleepsOnSite)
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

  if (loading) {
    return (
      <div className="text-sm text-gray-600">⏳ Chargement des utilisateurs…</div>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">🚨 {error}</div>
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
                {u.wantsToSpeak ? (
                  <Badge className="bg-amber-100 text-amber-700">Oui</Badge>
                ) : (
                  <Badge variant="outline">Non</Badge>
                )}
              </TableCell>
              <TableCell>
                {u.isAttending ? (
                  <Badge className="bg-emerald-100 text-emerald-700">Oui</Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-700">Non</Badge>
                )}
              </TableCell>
              <TableCell>
                {u.attendanceDays === "NONE" && (
                  <Badge variant="outline">—</Badge>
                )}
                {u.attendanceDays === "DAY1" && (
                  <Badge className="bg-sky-100 text-sky-700">Jour 1</Badge>
                )}
                {u.attendanceDays === "DAY2" && (
                  <Badge className="bg-amber-100 text-amber-700">Jour 2</Badge>
                )}
                {u.attendanceDays === "BOTH" && (
                  <Badge className="bg-emerald-100 text-emerald-700">Les deux</Badge>
                )}
              </TableCell>
              <TableCell>
                {u.sleepsOnSite ? (
                  <Badge className="bg-purple-100 text-purple-700">Oui</Badge>
                ) : (
                  <Badge variant="outline">Non</Badge>
                )}
              </TableCell>
              <TableCell className={u.isAttending && !u.hasPaid ? "bg-red-200" : undefined}>
                <div className="flex items-center gap-2">
                  <Checkbox
                    aria-label="A payé"
                    checked={u.hasPaid}
                    onCheckedChange={async (value) => {
                      if (typeof value !== "boolean") return
                      const next = value
                      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, hasPaid: next } : x))
                      try {
                        const res = await fetch("/api/admin/users", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId: u.id, hasPaid: next })
                        })
                        if (!res.ok) throw new Error("Update failed")
                      } catch {
                        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, hasPaid: !next } : x))
                      }
                    }}
                  />
                </div>
              </TableCell>
              <TableCell className={u.willPayInCash ? "bg-amber-200" : undefined}>
                <div className="flex items-center gap-2">
                  <Checkbox
                    aria-label="Paiera en cash"
                    checked={u.willPayInCash}
                    onCheckedChange={async (value) => {
                      if (typeof value !== "boolean") return
                      const next = value
                      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, willPayInCash: next } : x))
                      try {
                        const res = await fetch("/api/admin/users", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId: u.id, willPayInCash: next })
                        })
                        if (!res.ok) throw new Error("Update failed")
                      } catch {
                        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, willPayInCash: !next } : x))
                      }
                    }}
                  />
                </div>
              </TableCell>
              {mealSlots.map((slot) => {
                const status = u.mealStatuses[slot.id]
                return (
                  <TableCell key={slot.id} className="text-center px-2">
                    {status === "PRESENT" ? (
                      <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                    ) : status === "ABSENT" ? (
                      <X className="h-4 w-4 text-red-400 mx-auto" />
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </TableCell>
                )
              })}
              <TableCell>
                {u.mealTotal > 0 ? (
                  <span className="text-sm font-medium">{u.mealTotal} €</span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {u.isAttending && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setDeleteTarget(u)}
                    title="Supprimer la participation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la participation</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer la participation de{" "}
              <strong>{deleteTarget?.name ?? deleteTarget?.email}</strong> ?
              Cette action supprimera également ses conférences proposées et ses inscriptions aux repas pour cette édition.
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
