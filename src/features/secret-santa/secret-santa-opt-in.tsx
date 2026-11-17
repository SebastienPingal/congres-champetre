"use client"

import Link from "next/link"
import { CheckCircle2, CircleDot } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Snowflakes } from "@/components/snowflakes"
import { useUpdateProfile } from "@/hooks/use-user-profile"
import type { SecretSantaStatus } from "@/types"

interface SecretSantaOptInProps {
  status: SecretSantaStatus
}

// Inscription au Secret Santa : visible entre l'activation par l'admin et le tirage.
export function SecretSantaOptIn({ status }: SecretSantaOptInProps) {
  const { mutate: updateProfile, isPending, error } = useUpdateProfile()
  const choice = status.wantsSecretSanta

  const answer = (value: boolean) => updateProfile({ wantsSecretSanta: value })

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Les inscriptions sont ouvertes jusqu&apos;au tirage au sort.
        </p>
        {choice === true ? (
          <Badge variant="outline" className="border-green/40 text-green">
            <CheckCircle2 className="h-3 w-3 mr-1" />Inscrit·e
          </Badge>
        ) : choice === false ? (
          <Badge variant="outline" className="text-muted-foreground">Pas cette fois</Badge>
        ) : (
          <Badge variant="outline" className="ss-badge-red">
            <CircleDot className="h-3 w-3 mr-1" />À répondre
          </Badge>
        )}
      </div>

      <div className="ss-festive flex flex-col items-center gap-4 rounded-lg border px-6 py-10 text-center">
        <Snowflakes />
        <span className="text-5xl" aria-hidden>🎁</span>
        <p className="font-display text-2xl" style={{ color: "var(--ink)" }}>
          Participes-tu au Secret Santa ?
        </p>
        <p className="text-sm text-muted-foreground max-w-md">
          Chaque volontaire offre un petit cadeau à une personne tirée au sort parmi les participants
          présents au weekend. Une fois le tirage lancé, tu découvriras ici à qui faire ta surprise.
        </p>

        <div className="flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            variant={choice === true ? "default" : "outline"}
            onClick={() => answer(true)}
            disabled={isPending}
          >
            Oui, je participe !
          </Button>
          <Button
            type="button"
            variant={choice === false ? "default" : "outline"}
            onClick={() => answer(false)}
            disabled={isPending}
          >
            Non merci
          </Button>
        </div>

        {choice === true && status.isAttending !== true && (
          <p className="text-sm rounded-md border border-warn-border bg-warn-bg text-warn px-3 py-2 max-w-md">
            Tu ne seras tiré·e au sort que si tu{" "}
            <Link href="/presence" className="underline underline-offset-2">confirmes ta présence</Link> au weekend.
          </p>
        )}

        {error && <p className="text-sm text-destructive">{error.message}</p>}
      </div>
    </section>
  )
}
