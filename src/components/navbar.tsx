"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu"
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet"
import Link from "next/link"
import type { User } from "next-auth"
import { MenuIcon } from "lucide-react"

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
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/dashboard" className="text-sm">
                    Accueil
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              {(session.user as User).role === "ADMIN" && (
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/admin" className="text-sm">
                      Administration
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Ouvrir le menu">
                  <MenuIcon />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85%] max-w-sm">
                <div className="flex h-full flex-col justify-between">
                  <div className="flex flex-col gap-6">
                    <Link href="/dashboard" className="text-lg font-semibold text-green-800">
                      Congrès Champêtre
                    </Link>
                    <div className="flex flex-col gap-4">
                      <Link href="/dashboard" className="text-base hover:text-green-600 transition-colors">
                        Accueil
                      </Link>
                      {(session.user as User).role === "ADMIN" && (
                        <Link href="/admin" className="text-base hover:text-green-600 transition-colors">
                          Administration
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
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
                    <Button variant="outline" onClick={() => signOut()} className="text-sm">
                      Déconnexion
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
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