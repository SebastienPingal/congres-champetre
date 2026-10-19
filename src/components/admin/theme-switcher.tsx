"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEditions } from "@/hooks/use-editions"
import { queryKeys } from "@/lib/query-keys"
import { THEMES, THEME_IDS, type ThemeId, getTheme } from "@/lib/themes"

export function ThemeSwitcher() {
  const router = useRouter()
  const qc = useQueryClient()
  const { data: editions = [] } = useEditions()
  const active = editions.find((e) => e.isActive)
  const currentTheme = getTheme(active?.theme).id
  const [pending, setPending] = useState<ThemeId | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!active) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Thème de l&apos;application</CardTitle>
          <CardDescription>Active une édition pour pouvoir choisir son thème.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const apply = async (theme: ThemeId) => {
    if (theme === currentTheme) return
    setPending(theme)
    setError(null)
    // Optimistic: flip the html data-theme immediately for instant feedback
    const html = document.documentElement
    const prev = html.getAttribute("data-theme")
    html.setAttribute("data-theme", theme)
    try {
      const res = await fetch(`/api/editions/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Erreur")
      qc.invalidateQueries({ queryKey: queryKeys.editions })
      router.refresh()
    } catch (e) {
      if (prev) html.setAttribute("data-theme", prev)
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setPending(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thème de l&apos;application</CardTitle>
        <CardDescription>
          Choisis l&apos;atmosphère visuelle appliquée à tout le site, pour tous les visiteurs.
          Chaque thème a une variante claire et une sombre : chacun voit celle de son mode (menu du compte).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-3">
          {THEME_IDS.map((id) => {
            const t = THEMES[id]
            const isActive = currentTheme === id
            const isPending = pending === id
            return (
              <button
                key={id}
                onClick={() => apply(id)}
                disabled={pending !== null}
                className={`flex flex-col gap-2 rounded-lg border bg-surface p-2 text-left transition-shadow disabled:opacity-60 ${
                  isActive ? "ring-2 ring-primary" : "hover:shadow-md"
                }`}
              >
                <div className="grid grid-cols-2 gap-1.5">
                  {[t.light, t.dark].map((v) => (
                    <div
                      key={v.name}
                      className="flex flex-col gap-2 rounded-md border p-2"
                      style={{ background: v.bg, color: v.ink, borderColor: v.line }}
                    >
                      <div className="flex gap-1">
                        <span className="h-3.5 w-3.5 rounded-sm" style={{ background: v.green }} />
                        <span className="h-3.5 w-3.5 rounded-sm" style={{ background: v.talk }} />
                        <span className="h-3.5 w-3.5 rounded-sm" style={{ background: v.meal }} />
                        <span className="h-3.5 w-3.5 rounded-sm border" style={{ background: v.paper, borderColor: v.line }} />
                      </div>
                      <span className="font-mono text-[9px] uppercase tracking-wider opacity-80">{v.name}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between px-1">
                  <span className="font-semibold text-sm">{t.label}</span>
                  {isActive && <span className="text-[10px] uppercase tracking-wider opacity-70">Actif</span>}
                  {isPending && <span className="text-[10px] uppercase tracking-wider opacity-70">…</span>}
                </div>
              </button>
            )
          })}
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Le thème est lié à l&apos;édition active ({active.name}). Changer d&apos;édition active peut changer le thème affiché.
        </p>
        <div>
          <Button variant="outline" size="sm" onClick={() => router.refresh()}>
            Rafraîchir
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
