"use client"

import { useState } from "react"
import { Gift, Mail, RefreshCw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
} from "@/hooks/use-secret-santa"

type PendingAction = "draw" | "cancel" | "notify-unrevealed" | "notify-all" | null

const CONFIRM_COPY: Record<Exclude<PendingAction, null>, { title: string; description: string; cta: string }> = {
  draw: {
    title: "Relancer le tirage ?",
    description:
      "Toutes les attributions actuelles seront remplacées, y compris celles déjà découvertes. Pense à prévenir tout le monde ensuite.",
    cta: "Relancer le tirage",
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
  const [pending, setPending] = useState<PendingAction>(null)
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; text: string } | null>(null)

  const hasDraw = (status?.total ?? 0) > 0
  const canDraw = (status?.attendingCount ?? 0) >= (status?.minParticipants ?? 3)
  const unrevealed = (status?.total ?? 0) - (status?.revealed ?? 0)
  const busy = draw.isPending || cancel.isPending || notify.isPending

  const run = async (action: Exclude<PendingAction, null>) => {
    setFeedback(null)
    try {
      if (action === "draw") {
        const res = await draw.mutateAsync()
        setFeedback({ type: "ok", text: `🎁 Tirage effectué pour ${res.total} participants` })
      } else if (action === "cancel") {
        await cancel.mutateAsync()
        setFeedback({ type: "ok", text: "Tirage annulé" })
      } else {
        const res = await notify.mutateAsync(action === "notify-all" ? "all" : "unrevealed")
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Secret Santa
        </CardTitle>
        <CardDescription>
          Tire au sort, parmi les participants présents de l&apos;édition active, à qui chacun offre un cadeau.
          Les attributions restent secrètes, même pour les admins.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading || !status ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {hasDraw ? (
                <>
                  <Badge>Tirage effectué</Badge>
                  <span className="text-muted-foreground">
                    {status.total} participants · {status.revealed} cadeau(x) ouvert(s) · {unrevealed} en attente
                  </span>
                </>
              ) : (
                <>
                  <Badge variant="outline">Pas encore de tirage</Badge>
                  <span className="text-muted-foreground">{status.attendingCount} participants présents</span>
                </>
              )}
            </div>

            {hasDraw && (status.missingCount > 0 || status.staleCount > 0) && (
              <p className="text-sm rounded-md border border-warn-border bg-warn-bg text-warn px-3 py-2">
                ⚠️ Le tirage n&apos;est plus à jour :
                {status.missingCount > 0 && ` ${status.missingCount} présent(s) n'y figure(nt) pas`}
                {status.missingCount > 0 && status.staleCount > 0 && " et"}
                {status.staleCount > 0 && ` ${status.staleCount} participant(s) ne vien(nen)t plus`}
                . Relance le tirage pour l&apos;actualiser.
              </p>
            )}

            {!canDraw && (
              <p className="text-sm text-muted-foreground">
                Il faut au moins {status.minParticipants} participants présents pour lancer le tirage.
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button onClick={onDrawClick} disabled={!canDraw || busy}>
                {hasDraw ? <RefreshCw /> : <Gift />}
                {hasDraw ? "Relancer le tirage" : "Lancer le tirage"}
              </Button>
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
                  <Button variant="ghost" onClick={() => setPending("cancel")} disabled={busy}>
                    <Trash2 />
                    Annuler le tirage
                  </Button>
                </>
              )}
            </div>

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
                variant={pending === "cancel" || pending === "draw" ? "destructive" : "default"}
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
