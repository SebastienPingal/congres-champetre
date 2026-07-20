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
  Monitor,
  Sun,
  Moon,
  ChevronDown,
  ScrollText,
  type LucideIcon,
} from "lucide-react"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useThemeMode } from "@/hooks/use-theme-mode"
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
  DialogClose,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { IntentionLetterModal } from "@/features/onboarding/intention-letter-modal"

export type SectionKey = "programme" | "presence" | "repas" | "conferences" | "paiement"

type NavItem = { key: SectionKey; href: string; label: string; icon: LucideIcon }

export const NAV_ITEMS: NavItem[] = [
  { key: "programme",   href: "/programme",   label: "Programme",   icon: CalendarDays },
  { key: "presence",    href: "/presence",    label: "Présence",    icon: UserCheck },
  { key: "repas",       href: "/repas",       label: "Repas",       icon: UtensilsCrossed },
  { key: "conferences", href: "/conferences", label: "Conférences", icon: Mic },
  { key: "paiement",    href: "/paiement",    label: "Paiement",    icon: CreditCard },
]

export const WHATSAPP_URL = "https://chat.whatsapp.com/DJSVxLFkb7J6svyoBsenQu?mode=gi_t"

function getInitials(name?: string | null) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map(p => p[0]?.toUpperCase() ?? "").join("") || "?"
}

function AdminBar() {
  return (
    <div
      className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-1 text-[12px] font-sans overflow-x-auto"
      style={{ background: "#2b2a27", color: "#cfcbbf" }}
    >
      <span
        className="font-bold uppercase tracking-wider text-[10px] rounded-sm px-1.5 py-0.5 text-white shrink-0"
        style={{ background: "#d34a3b", letterSpacing: "0.08em" }}
      >
        Admin
      </span>
      <span className="opacity-60 hidden sm:inline shrink-0">Outils internes —</span>
      <nav className="flex gap-3 sm:gap-4 shrink-0">
        <Link href="/admin"        className="no-underline whitespace-nowrap" style={{ color: "#e8e4d6" }}>Administration</Link>
        <Link href="/admin/users"  className="no-underline whitespace-nowrap" style={{ color: "#e8e4d6" }}>Utilisateurs</Link>
        <Link href="/admin/emails" className="no-underline whitespace-nowrap" style={{ color: "#e8e4d6" }}>Email global</Link>
      </nav>
    </div>
  )
}

function NavLinks({ pathname, onNavigate }: { pathname: string | null; onNavigate?: () => void }) {
  return (
    <>
      {NAV_ITEMS.map(item => {
        const Icon = item.icon
        const active = pathname === item.href || pathname?.startsWith(item.href + "/")
        const link = (
          <Link
            key={item.key}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-2 rounded-lg no-underline whitespace-nowrap font-sans text-[13.5px]",
              active ? "font-semibold" : "font-medium",
            )}
            style={{
              color: active ? "var(--green)" : "var(--ink-2)",
              background: active ? "var(--green-soft)" : "transparent",
            }}
          >
            <Icon width={15} height={15} />
            {item.label}
          </Link>
        )
        return link
      })}
    </>
  )
}

const THEME_LABELS = [
  { value: "system", label: "Système", icon: Monitor },
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
] as const

export function Navbar() {
  const { data: session } = useSession()
  const { data: profile } = useUserProfile()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const { mode, setMode } = useThemeMode()

  if (!session) return null

  const user = session.user as User
  const isAdmin = user.role === "ADMIN"
  const editionName = profile?.edition?.name ?? "Contes & Légendes"
  const userName = user.name ?? "Invité"
  const initials = getInitials(userName)

  return (
    <div className="sticky top-0 z-50">
      {isAdmin && <AdminBar />}

      <header
        className="border-b"
        style={{ background: "var(--paper)", borderColor: "var(--line)" }}
      >
        <div className="mx-auto flex flex-wrap items-center gap-x-3 gap-y-2 sm:gap-5 px-3 sm:px-6 py-2.5 sm:py-3.5" style={{ maxWidth: 1400 }}>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Ouvrir le menu"
                className="sm:hidden"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 flex flex-col" style={{ background: "var(--paper)" }}>
              <SheetHeader className="px-5 pt-5 pb-3">
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
              <Separator />
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
              </nav>
            </SheetContent>
          </Sheet>

          <div className="shrink-0 flex flex-col leading-none">
            <Link
              href="/programme"
              className="block no-underline whitespace-nowrap"
              style={{ color: "inherit" }}
            >
              <div
                className="font-mono uppercase mb-1"
                style={{
                  letterSpacing: "0.22em",
                  color: "var(--ink-3)",
                }}
              >
                <span className="text-[9px] sm:text-[10px]">Congrès Champêtre</span>
              </div>
              <div
                className="font-display text-[18px] sm:text-[24px]"
                style={{
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: "var(--ink)",
                }}
              >
                {editionName}
              </div>
            </Link>

            <IntentionLetterModal>
              <button
                type="button"
                className="mt-1 flex items-center gap-1 bg-transparent cursor-pointer whitespace-nowrap font-sans text-[11px] sm:text-[12px] no-underline transition-colors hover:opacity-80 w-fit"
                style={{ color: "var(--green)" }}
              >
                <ScrollText width={12} height={12} className="shrink-0" />
                Lettre d&apos;intention
              </button>
            </IntentionLetterModal>
          </div>

          <nav className="hidden sm:flex gap-0.5 flex-1 ml-2">
            <NavLinks pathname={pathname} />
          </nav>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="animate-whatsapp-pulse ml-auto sm:ml-0 flex items-center gap-[7px] text-white no-underline font-sans font-semibold shrink-0 whitespace-nowrap rounded-[10px] px-2.5 sm:px-3.5 py-[9px] text-[13px] transition-transform hover:scale-105"
            style={{ background: "#22a463" }}
          >
            <MessageCircle width={16} height={16} />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Menu du compte"
                className="group flex items-center gap-[9px] bg-transparent cursor-pointer shrink-0 whitespace-nowrap rounded-[10px] py-1.5 pl-2.5 pr-2 sm:pr-2.5 text-[13px] font-sans transition-colors hover:bg-[var(--green-soft)]"
                style={{
                  border: "1px solid var(--line-2)",
                  color: "var(--ink)",
                }}
              >
                <span
                  className="flex items-center justify-center font-bold rounded-full shrink-0"
                  style={{
                    width: 26,
                    height: 26,
                    background: "var(--green-soft)",
                    color: "var(--green)",
                    fontSize: 11,
                  }}
                >
                  {initials}
                </span>
                <span className="hidden sm:flex flex-col items-start leading-[1.15]">
                  <span style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
                    Connecté
                  </span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{userName}</span>
                </span>
                <ChevronDown
                  width={14}
                  height={14}
                  className="shrink-0 transition-transform group-data-[state=open]:rotate-180"
                  style={{ color: "var(--ink-3)" }}
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="text-[11px] font-normal text-muted-foreground">Connecté en tant que</span>
                <span className="truncate">{userName}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">
                Apparence
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
                {THEME_LABELS.map(({ value, label, icon: Icon }) => (
                  <DropdownMenuRadioItem key={value} value={value}>
                    <Icon width={15} height={15} className="mr-2" />
                    {label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirmLogout(true)}>
                <LogOut width={15} height={15} className="mr-2" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={confirmLogout} onOpenChange={setConfirmLogout}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Se déconnecter ?</DialogTitle>
                <DialogDescription>
                  Tu vas être déconnecté de ton compte. Tu pourras te reconnecter à tout moment.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Annuler</Button>
                </DialogClose>
                <Button onClick={() => signOut()}>
                  <LogOut />
                  Se déconnecter
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>
    </div>
  )
}
