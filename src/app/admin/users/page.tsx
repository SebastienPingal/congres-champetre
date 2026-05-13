"use client"

import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { UsersTable } from "@/components/admin/users-table"

export default function AdminUsersPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Utilisateurs
          </h1>
          <p className="text-muted-foreground">
            Liste des inscrits et leurs informations
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <UsersTable />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
