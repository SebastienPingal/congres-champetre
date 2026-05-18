"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { User } from "next-auth"
import {
  CalendarDays,
  UserCheck,
  UtensilsCrossed,
  Mic,
  CreditCard,
  MessageCircle,
  LogOut,
  Menu,
  Shield,
  Users,
  Mail,
  type LucideIcon,
} from "lucide-react"
import { useUserProfile } from "@/hooks/use-user-profile"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export type SectionKey = "programme" | "presence" | "repas" | "conferences" | "paiement"

type NavItem = { key: SectionKey; href: string; label: string; icon: LucideIcon }

export const NAV_ITEMS: NavItem[] = [
  { key: "programme",   href: "/programme",   label: "Programme",   icon: CalendarDays },
  { key: "presence",    href: "/presence",    label: "Présence",    icon: UserCheck },
  { key: "repas",       href: "/repas",       label: "Repas",       icon: UtensilsCrossed },
  { key: "conferences", href: "/conferences", label: "Conférences", icon: Mic },
  { key: "paiement",    href: "/paiement",    label: "Paiement",    icon: CreditCard },
]

const ADMIN_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin",        label: "Administration", icon: Shield },
  { href: "/admin/users",  label: "Utilisateurs",   icon: Users },
  { href: "/admin/emails", label: "Email global",   icon: Mail },
]

const WHATSAPP_URL = "https://chat.whatsapp.com/DJSVxLFkb7J6svyoBsenQu?mode=gi_t"

function getInitials(name?: string | null) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map(p => p[0]?.toUpperCase() ?? "").join("") || "?"
}

export function Navbar() {
  const { data: session } = useSession()
  const { data: profile } = useUserProfile()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)

  if (!session) return null

  const user = session.user as User
  const isAdmin = user.role === "ADMIN"
  const editionName = profile?.edition?.name ?? "Contes & Légendes"
  const userName = user.name ?? "Invité"
  const initials = getInitials(userName)

  return (
    <div className="sticky top-0 z-50">
      <header
        className="border-b"
        style={{ background: "var(--paper)", borderColor: "var(--line)" }}
      >
        <div className="mx-auto flex items-center gap-3 px-3 sm:px-6 py-2.5 sm:py-3.5" style={{ maxWidth: 1400 }}>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Ouvrir le menu"
                className="flex items-center justify-center rounded-[10px] p-2 transition-colors hover:bg-[var(--green-soft)]"
                style={{ border: "1px solid var(--line-2)", color: "var(--ink)" }}
              >
                <Menu width={20} height={20} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 flex flex-col" style={{ background: "var(--paper)" }}>
              <SheetHeader className="px-5 pt-5 pb-3 border-b" style={{ borderColor: "var(--line)" }}>
                <div
                  className="font-mono uppercase"
                  style={{ letterSpacing: "0.22em", color: "var(--ink-3)", fontSize: 10 }}
                >
                  Congrès Champêtre
                </div>
                <SheetTitle className="font-display text-[20px]" style={{ color: "var(--ink)" }}>
                  {editionName}
                </SheetTitle>
              </SheetHeader>

              <nav className="flex flex-col gap-1 p-3 overflow-y-auto flex-1">
                {NAV_ITEMS.map(item => {
                  const Icon = item.icon
                  const active = pathname === item.href || pathname?.startsWith(item.href + "/")
                  return (
                    <SheetClose asChild key={item.key}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg no-underline font-sans text-[14px]",
                          active ? "font-semibold" : "font-medium",
                        )}
                        style={{
                          color: active ? "var(--green)" : "var(--ink-2)",
                          background: active ? "var(--green-soft)" : "transparent",
                        }}
                      >
                        <Icon width={17} height={17} />
                        {item.label}
                      </Link>
                    </SheetClose>
                  )
                })}

                {isAdmin && (
                  <>
                    <div
                      className="mt-4 mb-1 px-3 text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: "var(--ink-3)", letterSpacing: "0.12em" }}
                    >
                      Admin
                    </div>
                    {ADMIN_ITEMS.map(item => {
                      const Icon = item.icon
                      const active = pathname === item.href
                      return (
                        <SheetClose asChild key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-lg no-underline font-sans text-[14px]",
                              active ? "font-semibold" : "font-medium",
                            )}
                            style={{
                              color: active ? "var(--green)" : "var(--ink-2)",
                              background: active ? "var(--green-soft)" : "transparent",
                            }}
                          >
                            <Icon width={17} height={17} />
                            {item.label}
                          </Link>
                        </SheetClose>
                      )
                    })}
                  </>
                )}
              </nav>

              <div className="border-t p-3" style={{ borderColor: "var(--line)" }}>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-white no-underline font-semibold rounded-[10px] px-3 py-2.5 text-[13px]"
                  style={{ background: "#22a463" }}
                >
                  <MessageCircle width={16} height={16} />
                  WhatsApp
                </a>
              </div>
            </SheetContent>
          </Sheet>

          <Link
            href="/programme"
            className="block leading-none no-underline shrink-0 whitespace-nowrap"
            style={{ color: "inherit" }}
          >
            <div
              className="font-mono uppercase mb-1"
              style={{ letterSpacing: "0.22em", color: "var(--ink-3)" }}
            >
              <span className="text-[9px] sm:text-[10px]">Congrès Champêtre</span>
            </div>
            <div
              className="font-display text-[18px] sm:text-[24px]"
              style={{ fontWeight: 600, letterSpacing: "-0.02em", color: "var(--ink)" }}
            >
              {editionName}
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="animate-whatsapp-pulse flex items-center gap-[7px] text-white no-underline font-semibold shrink-0 whitespace-nowrap rounded-[10px] px-2.5 sm:px-3.5 py-[9px] text-[13px] transition-transform hover:scale-105"
              style={{ background: "#22a463" }}
            >
              <MessageCircle width={16} height={16} />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() => setLogoutOpen(true)}
              aria-label="Se déconnecter"
              className="navbar-logout group flex items-center gap-[9px] bg-transparent cursor-pointer shrink-0 whitespace-nowrap rounded-[10px] py-1.5 pl-2.5 pr-2.5 sm:pr-3 text-[13px] font-sans transition-colors"
              style={{ border: "1px solid var(--line-2)", color: "var(--ink)" }}
            >
              <span
                className="navbar-logout__avatar flex items-center justify-center font-bold rounded-full shrink-0 transition-colors"
                style={{
                  width: 26,
                  height: 26,
                  background: "var(--green-soft)",
                  color: "var(--green)",
                  fontSize: 11,
                }}
              >
                <span className="navbar-logout__initials">{initials}</span>
                <LogOut className="navbar-logout__icon" width={14} height={14} />
              </span>
              <span className="hidden sm:flex flex-col items-start leading-[1.15]">
                <span
                  className="navbar-logout__kicker"
                  style={{ fontSize: 10.5, color: "var(--ink-3)" }}
                >
                  Connecté · déconnexion
                </span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{userName}</span>
              </span>
            </button>
          </div>
        </div>
      </header>

      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Se déconnecter ?</DialogTitle>
            <DialogDescription>
              Tu vas être déconnecté de ton compte. Tu pourras te reconnecter à tout moment.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoutOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => signOut()}>
              <LogOut width={15} height={15} />
              Se déconnecter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
