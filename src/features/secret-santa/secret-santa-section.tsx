"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { AppLoader } from "@/components/loaders/app-loader"
import { Snowflakes } from "@/components/snowflakes"
import { useRevealSecretSanta, useSecretSanta } from "@/hooks/use-secret-santa"
import { GiftReveal, type GiftPhase } from "./gift-reveal"
import { SecretSantaOptIn } from "./secret-santa-opt-in"

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

  // Inscriptions ouvertes : la personne dit si elle participe.
  if (data && !data.assigned && data.enabled && !data.drawn) {
    return <SecretSantaOptIn status={data} />
  }

  if (error || !data?.assigned) {
    const excluded = Boolean(data?.drawn)
    return (
      <section className="ss-festive flex flex-col items-center gap-3 rounded-lg border px-6 py-12 text-center">
        <Snowflakes />
        <span className="text-5xl" aria-hidden>🎁</span>
        <p className="font-display text-2xl" style={{ color: "var(--ink)" }}>
          {excluded ? "Le tirage a eu lieu" : "Le Secret Santa n'est pas encore ouvert"}
        </p>
        <p className="text-sm text-muted-foreground max-w-md">
          {excluded ? (
            <>
              Tu ne fais pas partie du tirage : seuls les volontaires présents au weekend ont été tirés au sort.
              Si c&apos;est une erreur, <Link href="/presence" className="underline underline-offset-2">vérifie ta présence</Link> et
              préviens les organisateurs.
            </>
          ) : (
            <>
              Dès que les organisateurs l&apos;auront ouvert, tu pourras t&apos;y inscrire ici.
              Seuls les volontaires présents au weekend sont tirés au sort.
            </>
          )}
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
        <Badge variant={alreadyRevealed ? "default" : "outline"} className={alreadyRevealed ? undefined : "ss-badge-red"}>
          {alreadyRevealed ? "Cadeau ouvert" : "À ouvrir"}
        </Badge>
      </div>

      <div className="ss-festive rounded-lg border">
        <Snowflakes />
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
    </section>
  )
}
