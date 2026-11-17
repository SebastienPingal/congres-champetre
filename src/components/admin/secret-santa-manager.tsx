"use client"

import { useState } from "react"
import { Gift, Mail, PauseCircle, PlayCircle, RefreshCw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Snowflakes } from "@/components/snowflakes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  useAdminSecretSanta,
  useCancelSecretSanta,
  useDrawSecretSanta,
  useNotifySecretSanta,
  useToggleSecretSanta,
} from "@/hooks/use-secret-santa"

type PendingAction = "draw" | "cancel" | "disable" | "notify-invite" | "notify-unrevealed" | "notify-all" | null

const CONFIRM_COPY: Record<Exclude<PendingAction, null>, { title: string; description: string; cta: string }> = {
  draw: {
    title: "Relancer le tirage ?",
    description:
      "Toutes les attributions actuelles seront remplacées, y compris celles déjà découvertes. Pense à prévenir tout le monde ensuite.",
    cta: "Relancer le tirage",
  },
  disable: {
    title: "Désactiver le Secret Santa ?",
    description:
      "L'onglet disparaîtra pour les participants. Leurs réponses (oui / non) sont conservées si tu le réactives.",
    cta: "Désactiver",
  },
  "notify-invite": {
    title: "Inviter les présents à s'inscrire ?",
    description:
      "Un email avec un lien vers la page Secret Santa sera envoyé aux participants présents qui n'ont pas encore répondu.",
    cta: "Envoyer",
  },
  cancel: {
    title: "Annuler le tirage ?",
    description: "Toutes les attributions seront supprimées et les participants ne verront plus leur cadeau.",
    cta: "Annuler le tirage",
  },
  "notify-unrevealed": {
    title: "Relancer ceux qui n'ont pas ouvert leur cadeau ?",
    description: "Un email sans le nom du destinataire sera envoyé, avec un lien vers la page Secret Santa.",
    cta: "Envoyer",
  },
  "notify-all": {
    title: "Prévenir tous les participants ?",
    description: "Un email sans le nom du destinataire sera envoyé à tous les participants du tirage.",
    cta: "Envoyer",
  },
}

export function SecretSantaManager() {
  const { data: status, isLoading } = useAdminSecretSanta()
  const draw = useDrawSecretSanta()
  const cancel = useCancelSecretSanta()
  const notify = useNotifySecretSanta()
  const toggle = useToggleSecretSanta()
  const [pending, setPending] = useState<PendingAction>(null)
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; text: string } | null>(null)

  const enabled = status?.enabled ?? false
  const hasDraw = (status?.total ?? 0) > 0
  const canDraw = enabled && (status?.optedInCount ?? 0) >= (status?.minParticipants ?? 3)
  const unrevealed = (status?.total ?? 0) - (status?.revealed ?? 0)
  const busy = draw.isPending || cancel.isPending || notify.isPending || toggle.isPending

  const run = async (action: Exclude<PendingAction, null>) => {
    setFeedback(null)
    try {
      if (action === "draw") {
        const res = await draw.mutateAsync()
        setFeedback({ type: "ok", text: `🎁 Tirage effectué pour ${res.total} participants` })
      } else if (action === "cancel") {
        await cancel.mutateAsync()
        setFeedback({ type: "ok", text: "Tirage annulé" })
      } else if (action === "disable") {
        await toggle.mutateAsync(false)
        setFeedback({ type: "ok", text: "Secret Santa désactivé" })
      } else {
        const target = action === "notify-all" ? "all" : action === "notify-invite" ? "invite" : "unrevealed"
        const res = await notify.mutateAsync(target)
        setFeedback({
          type: res.failed > 0 ? "error" : "ok",
          text: `📧 ${res.sent}/${res.total} emails envoyés${res.failed > 0 ? ` — ${res.failed} échec(s)` : ""}`,
        })
      }
    } catch (e) {
      setFeedback({ type: "error", text: e instanceof Error ? e.message : "Erreur" })
    } finally {
      setPending(null)
    }
  }

  // Le premier tirage n'écrase rien : pas besoin de confirmation.
  const onDrawClick = () => (hasDraw ? setPending("draw") : run("draw"))

  const enable = async () => {
    setFeedback(null)
    try {
      await toggle.mutateAsync(true)
      setFeedback({ type: "ok", text: "🎄 Secret Santa activé : les participants peuvent s'inscrire" })
    } catch (e) {
      setFeedback({ type: "error", text: e instanceof Error ? e.message : "Erreur" })
    }
  }

  return (
    <Card className="ss-festive">
      <Snowflakes />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" style={{ color: "var(--red)" }} />
          Secret Santa
        </CardTitle>
        <CardDescription>
          Active le Secret Santa pour que les participants indiquent s&apos;ils veulent y participer, puis tire au
          sort, parmi les volontaires présents, à qui chacun offre un cadeau. Les attributions restent secrètes,
          même pour les admins.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading || !status ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {!enabled ? (
                <Badge variant="outline" className="text-muted-foreground">Désactivé</Badge>
              ) : hasDraw ? (
                <>
                  <Badge>Tirage effectué</Badge>
                  <span className="text-muted-foreground">
                    {status.total} participants · {status.revealed} cadeau(x) ouvert(s)
                  </span>
                  {unrevealed > 0 && <Badge variant="outline" className="ss-badge-red">{unrevealed} en attente</Badge>}
                </>
              ) : (
                <>
                  <Badge variant="outline" className="border-green/40 text-green">Inscriptions ouvertes</Badge>
                  <span className="text-muted-foreground">
                    {status.optedInCount} volontaire(s) · {status.declinedCount} non · {status.awaitingAnswerCount} sans
                    réponse (sur {status.attendingCount} présents)
                  </span>
                </>
              )}
            </div>

            {hasDraw && (status.missingCount > 0 || status.staleCount > 0) && (
              <p className="text-sm rounded-md border border-warn-border bg-warn-bg text-warn px-3 py-2">
                ⚠️ Le tirage n&apos;est plus à jour :
                {status.missingCount > 0 && ` ${status.missingCount} volontaire(s) présent(s) n'y figure(nt) pas`}
                {status.missingCount > 0 && status.staleCount > 0 && " et"}
                {status.staleCount > 0 && ` ${status.staleCount} participant(s) ne vien(nen)t plus`}
                . Relance le tirage pour l&apos;actualiser.
              </p>
            )}

            {enabled && !canDraw && (
              <p className="text-sm text-muted-foreground">
                Il faut au moins {status.minParticipants} volontaires présents pour lancer le tirage.
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {!enabled ? (
                <Button onClick={enable} disabled={busy}>
                  <PlayCircle />
                  Activer le Secret Santa
                </Button>
              ) : (
                <>
                  <Button onClick={onDrawClick} disabled={!canDraw || busy}>
                    {hasDraw ? <RefreshCw /> : <Gift />}
                    {hasDraw ? "Relancer le tirage" : `Lancer le tirage (${status.optedInCount})`}
                  </Button>
                  {!hasDraw && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setPending("notify-invite")}
                        disabled={busy || status.awaitingAnswerCount === 0}
                      >
                        <Mail />
                        Inviter les présents à s&apos;inscrire ({status.awaitingAnswerCount})
                      </Button>
                      <Button variant="ghost" onClick={() => setPending("disable")} disabled={busy}>
                        <PauseCircle />
                        Désactiver
                      </Button>
                    </>
                  )}
                </>
              )}
              {hasDraw && (
                <>
                  <Button variant="outline" onClick={() => setPending("notify-unrevealed")} disabled={busy || unrevealed === 0}>
                    <Mail />
                    Relancer les non-ouverts ({unrevealed})
                  </Button>
                  <Button variant="outline" onClick={() => setPending("notify-all")} disabled={busy}>
                    <Mail />
                    Prévenir tout le monde ({status.total})
                  </Button>
                  <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setPending("cancel")} disabled={busy}>
                    <Trash2 />
                    Annuler le tirage
                  </Button>
                </>
              )}
            </div>

            {hasDraw && (
              <p className="text-xs text-muted-foreground">
                Les inscriptions sont verrouillées depuis le tirage. Pour désactiver le Secret Santa, annule d&apos;abord le tirage.
              </p>
            )}

            {feedback && (
              <p className={feedback.type === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
                {feedback.text}
              </p>
            )}
          </>
        )}
      </CardContent>

      <Dialog open={pending !== null} onOpenChange={(open) => !open && !busy && setPending(null)}>
        {pending && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{CONFIRM_COPY[pending].title}</DialogTitle>
              <DialogDescription>{CONFIRM_COPY[pending].description}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={busy}>Retour</Button>
              </DialogClose>
              <Button
                variant={pending === "cancel" || pending === "draw" || pending === "disable" ? "destructive" : "default"}
                onClick={() => run(pending)}
                disabled={busy}
              >
                {CONFIRM_COPY[pending].cta}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </Card>
  )
}
