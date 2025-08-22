"use client"

import { useEffect, useMemo, useState } from "react"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

type AttendanceDays = "NONE" | "DAY1" | "DAY2" | "BOTH"

interface AdminUserRow {
  id: string
  name: string | null
  email: string
  role: "USER" | "ADMIN"
  wantsToSpeak: boolean
  isAttending: boolean
  attendanceDays: AttendanceDays
  sleepsOnSite: boolean
  createdAt: string
  updatedAt: string
}

export function UsersTable() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRole, setFilterRole] = useState<"ALL" | "ADMIN" | "USER">("ALL")
  const [filterParticipation, setFilterParticipation] = useState<"ALL" | "YES" | "NO">("ALL")
  const [filterSleep, setFilterSleep] = useState<"ALL" | "YES" | "NO">("ALL")
  const [filterDays, setFilterDays] = useState<"ALL" | AttendanceDays>("ALL")
  const [sortKey, setSortKey] = useState<keyof AdminUserRow | "">("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/admin/users")
        if (!res.ok) throw new Error("Failed to fetch users")
        const data = await res.json()
        setUsers(data)
      } catch (e) {
        setError("Impossible de charger les utilisateurs")
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const resetFilters = () => {
    setSearchQuery("")
    setFilterRole("ALL")
    setFilterParticipation("ALL")
    setFilterSleep("ALL")
    setFilterDays("ALL")
  }

  const attendanceOrder: Record<AttendanceDays, number> = {
    NONE: 0,
    DAY1: 1,
    DAY2: 2,
    BOTH: 3,
  }

  const filteredAndSortedUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    let result = users.filter(u => {
      const matchesQuery = normalizedQuery.length === 0 ||
        (u.name?.toLowerCase().includes(normalizedQuery) ?? false) ||
        u.email.toLowerCase().includes(normalizedQuery)

      const matchesRole = filterRole === "ALL" || u.role === filterRole
      const matchesParticipation = filterParticipation === "ALL" || (filterParticipation === "YES" ? u.isAttending : !u.isAttending)
      const matchesSleep = filterSleep === "ALL" || (filterSleep === "YES" ? u.sleepsOnSite : !u.sleepsOnSite)
      const matchesDays = filterDays === "ALL" || u.attendanceDays === filterDays

      return matchesQuery && matchesRole && matchesParticipation && matchesSleep && matchesDays
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
  }, [users, searchQuery, filterRole, filterParticipation, filterSleep, filterDays, sortKey, sortDirection])

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
          <Label htmlFor="role">Rôle</Label>
          <select
            id="role"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
          >
            <option value="ALL">Tous</option>
            <option value="ADMIN">Admin</option>
            <option value="USER">Utilisateur</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="participation">Participe</Label>
          <select
            id="participation"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={filterParticipation}
            onChange={(e) => setFilterParticipation(e.target.value as any)}
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
            onChange={(e) => setFilterSleep(e.target.value as any)}
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
            onChange={(e) => setFilterDays(e.target.value as any)}
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
        </div>
      </div>

      <Table>
        <TableCaption>Liste des utilisateurs</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead><SortHeader label="Nom" column="name" /></TableHead>
            <TableHead><SortHeader label="Email" column="email" /></TableHead>
            <TableHead><SortHeader label="Rôle" column="role" /></TableHead>
            <TableHead><SortHeader label="Parle ?" column="wantsToSpeak" /></TableHead>
            <TableHead><SortHeader label="Participe" column="isAttending" /></TableHead>
            <TableHead><SortHeader label="Jours" column="attendanceDays" /></TableHead>
            <TableHead><SortHeader label="Dort sur place" column="sleepsOnSite" /></TableHead>
            <TableHead><SortHeader label="Inscription" column="createdAt" /></TableHead>
            <TableHead><SortHeader label="Maj" column="updatedAt" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedUsers.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.name ?? "—"}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>
                {u.role === "ADMIN" ? (
                  <Badge variant="destructive">Admin</Badge>
                ) : (
                  <Badge>Utilisateur</Badge>
                )}
              </TableCell>
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
              <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>{new Date(u.updatedAt).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}



