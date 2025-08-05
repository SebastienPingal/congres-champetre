"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import type { User } from "next-auth"

export function Navbar() {
  const { data: session } = useSession()

  if (!session) return null

  return (
    <nav className="border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-xl font-bold text-green-800">
            Congrès Champêtre
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm hover:text-green-600 transition-colors">
              Accueil
            </Link>
            {(session.user as User).role === "ADMIN" && (
              <Link href="/admin" className="text-sm hover:text-green-600 transition-colors">
                Administration
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {(session.user as User).name}
            </span>
            {(session.user as User).role === "ADMIN" && (
              <Badge variant="destructive" className="text-xs">
                Admin
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut()}
            className="text-sm"
          >
            Déconnexion
          </Button>
        </div>
      </div>
    </nav>
  )
}