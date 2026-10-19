"use client"

import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AppLoader } from "@/components/loaders/app-loader"
import { useRevealSecretSanta, useSecretSanta } from "@/hooks/use-secret-santa"
import { GiftReveal, type GiftPhase } from "./gift-reveal"

// Durée minimale du tremblement avant l'ouverture, même si l'API répond vite.
const SHAKE_MS = 1100

export function SecretSantaSection() {
  const { data, isLoading, error } = useSecretSanta()
  const reveal = useRevealSecretSanta()
  // `null` = pas encore d'interaction : on déduit l'état depuis les données.
  const [phase, setPhase] = useState<GiftPhase | null>(null)
  const [revealError, setRevealError] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <AppLoader />
      </div>
    )
  }

  if (error || !data?.assigned) {
    return (
      <section className="flex flex-col items-center gap-3 rounded-lg border bg-surface px-6 py-12 text-center">
        <span className="text-5xl" aria-hidden>🎁</span>
        <p className="font-display text-2xl" style={{ color: "var(--ink)" }}>
          Le tirage n&apos;a pas encore eu lieu
        </p>
        <p className="text-sm text-muted-foreground max-w-md">
          Dès que les organisateurs auront lancé le Secret Santa, un cadeau t&apos;attendra ici.
          Seuls les participants présents au weekend sont tirés au sort.
        </p>
      </section>
    )
  }

  const alreadyRevealed = Boolean(data.revealedAt)
  const currentPhase: GiftPhase = phase ?? (alreadyRevealed ? "open" : "closed")
  // Déjà ouvert lors d'une visite précédente : pas d'animation au chargement.
  const instant = phase === null && alreadyRevealed

  const open = async () => {
    setRevealError(null)
    setPhase("shaking")
    try {
      const shake = new Promise((r) => setTimeout(r, SHAKE_MS))
      // Pour un « rejouer », le nom est déjà connu : pas d'appel API.
      await Promise.all(alreadyRevealed ? [shake] : [reveal.mutateAsync(), shake])
      setPhase("open")
    } catch (e) {
      setRevealError(e instanceof Error ? e.message : "Impossible d'ouvrir le cadeau")
      setPhase("closed")
    }
  }


  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {currentPhase === "open"
            ? "Prépare-lui une jolie surprise pour le weekend !"
            : "Un cadeau t'attend. Clique dessus pour découvrir à qui tu vas faire une surprise."}
        </p>
        <Badge variant={alreadyRevealed ? "default" : "outline"}>
          {alreadyRevealed ? "Cadeau ouvert" : "À ouvrir"}
        </Badge>
      </div>

      <div className="relative overflow-hidden rounded-lg border bg-surface">
        <GiftReveal
          phase={currentPhase}
          receiverName={data.receiverName ?? null}
          onOpen={open}
          instant={instant}
        />
        {currentPhase === "closed" && (
          <p className="pb-6 text-center font-mono uppercase text-[11px]" style={{ letterSpacing: "0.2em", color: "var(--ink-3)" }}>
            Clique sur le cadeau
          </p>
        )}
      </div>

      {revealError && <p className="text-sm text-destructive">{revealError}</p>}

      {currentPhase === "open" && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setPhase("closed")}>
            <RotateCcw />
            Rejouer l&apos;animation
          </Button>
        </div>
      )}
    </section>
  )
}
