"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"

const NAV_ITEMS = [
  { id: "concept", label: "Le concept" },
  { id: "theme", label: "Le thème" },
  { id: "deroule", label: "Déroulé" },
  { id: "pratique", label: "Pratique" },
]

function ChevIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

export function LandingHeader({ edition }: { edition: string }) {
  const [open, setOpen] = useState(false)

  return (
    <header
      className="sticky top-0 z-10 border-b"
      style={{ background: "var(--paper)", borderColor: "var(--line)", backdropFilter: "saturate(1.1)" }}
    >
      <div className="mx-auto flex items-center gap-2 sm:gap-5 px-3 sm:px-7 py-3 sm:py-3.5" style={{ maxWidth: 1280 }}>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Ouvrir le menu"
              className="sm:hidden shrink-0"
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
                Congrès Champêtre · Édition&nbsp;{edition}
              </div>
              <SheetTitle className="font-display italic text-[20px]" style={{ color: "var(--ink)" }}>
                Contes &amp; Légendes
              </SheetTitle>
            </SheetHeader>
            <Separator />
            <nav className="flex flex-col gap-1 p-3 overflow-y-auto flex-1">
              {NAV_ITEMS.map((it) => (
                <SheetClose asChild key={it.id}>
                  <a
                    href={`#${it.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg no-underline font-sans text-[14px] font-medium"
                    style={{ color: "var(--ink-2)" }}
                  >
                    {it.label}
                  </a>
                </SheetClose>
              ))}
              <Separator className="my-2" />
              <SheetClose asChild>
                <Link
                  href="/auth/signin"
                  className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg no-underline font-sans text-[14px] font-semibold"
                  style={{ background: "var(--ink)", color: "var(--paper)" }}
                >
                  S&apos;inscrire
                  <ChevIcon size={14} />
                </Link>
              </SheetClose>
            </nav>
          </SheetContent>
        </Sheet>

        <a href="#" className="block leading-[1.05] no-underline shrink-0 min-w-0" style={{ color: "inherit" }}>
          <div
            className="font-mono uppercase mb-1 truncate"
            style={{ letterSpacing: "0.22em", color: "var(--ink-3)" }}
          >
            <span className="text-[9px] sm:text-[10px]">Congrès Champêtre · Édition&nbsp;{edition}</span>
          </div>
          <div
            className="font-display italic text-[18px] sm:text-[22px] truncate"
            style={{ fontWeight: 600, letterSpacing: "-0.015em", color: "var(--ink)" }}
          >
            Contes &amp; Légendes
          </div>
        </a>

        <div className="flex-1" />

        <nav className="hidden sm:flex gap-1">
          {NAV_ITEMS.map((it) => (
            <a
              key={it.id}
              href={`#${it.id}`}
              className="px-3 py-2 rounded-lg no-underline font-sans text-[13.5px]"
              style={{ color: "var(--ink-2)" }}
            >
              {it.label}
            </a>
          ))}
        </nav>

        <ThemeToggle className="shrink-0" />

        <Link
          href="/auth/signin"
          className="hidden sm:inline-flex items-center gap-2 rounded-[10px] px-4 py-2.5 no-underline font-sans font-semibold text-[13px] shrink-0 whitespace-nowrap"
          style={{ background: "var(--ink)", color: "var(--paper)" }}
        >
          S&apos;inscrire
          <ChevIcon size={14} />
        </Link>
      </div>
    </header>
  )
}
