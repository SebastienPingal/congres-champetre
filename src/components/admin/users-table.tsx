"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

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
    <div className="w-full">
      <Table>
        <TableCaption>Liste des utilisateurs</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Parle ?</TableHead>
            <TableHead>Participe</TableHead>
            <TableHead>Jours</TableHead>
            <TableHead>Dort sur place</TableHead>
            <TableHead>Inscription</TableHead>
            <TableHead>Maj</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
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
              <TableCell>{u.wantsToSpeak ? "Oui" : "Non"}</TableCell>
              <TableCell>{u.isAttending ? "Oui" : "Non"}</TableCell>
              <TableCell>
                {u.attendanceDays === "NONE" && "—"}
                {u.attendanceDays === "DAY1" && "Jour 1"}
                {u.attendanceDays === "DAY2" && "Jour 2"}
                {u.attendanceDays === "BOTH" && "Les deux"}
              </TableCell>
              <TableCell>{u.sleepsOnSite ? "Oui" : "Non"}</TableCell>
              <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>{new Date(u.updatedAt).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}


