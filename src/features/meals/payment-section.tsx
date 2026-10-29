"use client"

import { useRef, useState } from "react"
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"
import { useQueryClient } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, HeartHandshake, Lock, ShieldCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useMeals } from "@/hooks/use-meals"
import { queryKeys } from "@/lib/query-keys"
import { applyPaypalFees } from "@/lib/paypal-fees"
import { isParticipationValidated } from "@/lib/participation-status"
import { MAX_SUPPORT_AMOUNT, SUPPORT_PRESETS } from "@/lib/support"
import { cn } from "@/lib/utils"
import type { UserProfile } from "@/types"

const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID

function formatDeadline(deadlineIso: string): { label: string; daysLeft: number } {
  const deadline = new Date(deadlineIso)
  const now = new Date()
  const msPerDay = 1000 * 60 * 60 * 24
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / msPerDay)
  const label = deadline.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
  return { label, daysLeft }
}

interface PaymentSectionProps {
  user: UserProfile
}

export function PaymentSection({ user }: PaymentSectionProps) {
  const { data: meals = [] } = useMeals()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [deferred, setDeferred] = useState(false)
  // Soutien libre : un des montants proposés, ou un montant saisi (« autre »).
  const [supportPreset, setSupportPreset] = useState<number | null>(0)
  const [customSupport, setCustomSupport] = useState("")
  const qc = useQueryClient()

  const payableMeals = meals.filter((m) => m.status === "PRESENT" && m.price != null)
  const total = payableMeals.reduce((sum, m) => sum + (m.price ?? 0), 0)
  const totalWithFees = applyPaypalFees(total)
  const fees = Math.round((totalWithFees - total) * 100) / 100
  const supportAmount = supportPreset ?? Math.min(Number(customSupport) || 0, MAX_SUPPORT_AMOUNT)
  const grandTotal = totalWithFees + supportAmount
  // `createOrder` est figé par le bouton PayPal à son montage : on lit le
  // soutien courant via une ref pour ne jamais envoyer une valeur périmée.
  const supportRef = useRef(supportAmount)
  supportRef.current = supportAmount
  const hasPaid = user.hasPaid
  const paidEuros = user.paidAmount != null ? user.paidAmount / 100 : totalWithFees
  const locked = user.edition.isRegistrationClosed
  const paypalConfigured = !!paypalClientId

  // Ne rien devoir vaut validation : le participant n'a aucune action à faire.
  const validated = isParticipationValidated({
    isAttending: user.isAttending,
    hasPaid,
    amountDue: total,
  })

  // Cas résiduel : rien à régler mais présence non confirmée → aucun bloc à afficher.
  if (total === 0 && !hasPaid && !validated) return null

  if (validated) {
    return (
      <section id="section-validation" className="flex flex-col gap-3">
        <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-green/50 bg-green/10 px-6 py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green/15">
            <CheckCircle2 className="h-8 w-8 text-green" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold text-green">Votre place est réservée&nbsp;!</p>
            <p className="text-sm text-foreground/80 max-w-prose">
              {hasPaid
                ? user.supportAmount
                  ? `Merci pour votre règlement et pour votre soutien de ${user.supportAmount} € au congrès, à très vite !`
                  : "Merci pour votre règlement, à très vite au congrès."
                : "Vous n’avez aucun repas payant à régler : votre participation est validée. À très vite au congrès."}
            </p>
          </div>
          <Badge variant="outline" className="border-green/50 bg-green/10 text-green text-sm px-3 py-1">
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            {hasPaid
              ? paidEuros > 0 ? `${paidEuros.toFixed(2)} € payés` : "Paiement validé"
              : "Rien à régler"}
          </Badge>
        </div>
      </section>
    )
  }

  const deadline = user.edition.registrationDeadline
    ? formatDeadline(user.edition.registrationDeadline)
    : null

  const createOrder = async () => {
    setErrorMessage(null)
    const res = await fetch("/api/payments/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supportAmount: supportRef.current }),
    })
    const data = await res.json()
    if (!res.ok) {
      setErrorMessage(data.error ?? "Erreur lors de la création du paiement")
      throw new Error(data.error ?? "create order failed")
    }
    return data.orderId as string
  }

  const onApprove = async (data: { orderID: string }) => {
    setErrorMessage(null)
    const res = await fetch("/api/payments/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: data.orderID }),
    })
    const json = await res.json()
    if (!res.ok || json.status !== "succeeded") {
      setErrorMessage(json.error ?? "Le paiement n'a pas pu être confirmé")
      return
    }
    qc.invalidateQueries({ queryKey: queryKeys.userProfile })
  }

  return (
    <section id="section-validation" className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div>
          {locked ? (
            <Badge variant="outline" className="border-destructive/40 text-destructive">
              <Lock className="h-3 w-3 mr-1" />Inscriptions fermées
            </Badge>
          ) : (
            <Badge variant="outline" className="border-warn-border text-warn">Non validée</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground max-w-prose">
          Réglez votre participation aux repas pour confirmer votre place. Tant que le paiement n&apos;est pas reçu, votre inscription reste provisoire.
        </p>
      </div>

      <div className="rounded-lg border bg-surface">
        <ul className="divide-y">
          {payableMeals.map((m) => (
            <li key={m.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-foreground/90">{m.title}</span>
              <span className="font-medium">{m.price} €</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">Sous-total repas</span>
          <span className="text-muted-foreground">{total.toFixed(2)} €</span>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">Frais PayPal</span>
          <span className="text-muted-foreground">+{fees.toFixed(2)} €</span>
        </div>
        {supportAmount > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">Soutien au congrès</span>
            <span className="text-muted-foreground">+{supportAmount} €</span>
          </div>
        )}
        <div className="flex items-center justify-between border-t px-4 py-3">
          <span className="text-sm font-medium">Total à régler</span>
          <span className="text-lg font-semibold">{grandTotal.toFixed(2)} €</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground max-w-prose">
        PayPal prélève des frais de traitement sur chaque paiement. Ces frais sont
        ajoutés au montant des repas afin que l&apos;intégralité de votre participation
        revienne à l&apos;organisation.
      </p>

      <div className="flex flex-col gap-3 rounded-lg border bg-surface px-4 py-4">
        <div className="flex items-center gap-2">
          <HeartHandshake className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">Soutenir le congrès <span className="font-normal text-muted-foreground">(facultatif)</span></p>
        </div>
        <p className="text-xs text-muted-foreground max-w-prose">
          Le prix des repas ne couvre pas tous les frais du congrès (location, matériel,
          intendance…) : une partie reste à la charge de l&apos;organisation. Si vous le
          pouvez, vous pouvez ajouter un petit montant pour y participer. Il n&apos;y a
          aucun bénéfice : chaque euro est intégralement réinvesti dans le congrès.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {SUPPORT_PRESETS.map((amount) => (
            <Button
              key={amount}
              type="button"
              size="sm"
              variant={supportPreset === amount ? "default" : "outline"}
              onClick={() => {
                setSupportPreset(amount)
                setCustomSupport("")
              }}
            >
              {amount === 0 ? "Aucun" : `+${amount} €`}
            </Button>
          ))}
          <div className="flex items-center gap-1.5">
            <Input
              type="text"
              inputMode="numeric"
              placeholder="Autre"
              aria-label="Autre montant de soutien, en euros"
              value={customSupport}
              onFocus={() => setSupportPreset(null)}
              onChange={(e) => {
                // Euros entiers uniquement, plafonnés.
                const digits = e.target.value.replace(/\D/g, "").slice(0, 3)
                setSupportPreset(null)
                setCustomSupport(digits === "" ? "" : String(Math.min(Number(digits), MAX_SUPPORT_AMOUNT)))
              }}
              className={cn("h-8 w-20", supportPreset === null && "border-primary")}
            />
            <span className="text-sm text-muted-foreground">€</span>
          </div>
        </div>
      </div>

      {deadline && !locked && (
        <p className="text-xs text-muted-foreground">
          Les inscriptions ferment le <span className="font-medium text-foreground">{deadline.label}</span>
          {deadline.daysLeft > 0 && (
            <> — il vous reste <span className="font-medium text-foreground">{deadline.daysLeft} jour{deadline.daysLeft > 1 ? "s" : ""}</span> pour confirmer.</>
          )}
        </p>
      )}

      {locked && (
        <p className="text-sm text-destructive">
          Les inscriptions sont closes. Contactez l&apos;organisateur si vous souhaitez tout de même participer.
        </p>
      )}

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      {!paypalConfigured ? (
        <p className="text-sm text-muted-foreground">
          Le paiement en ligne n&apos;est pas configuré sur cet environnement.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <PayPalScriptProvider options={{ clientId: paypalClientId!, currency: "EUR", intent: "capture" }}>
            <PayPalButtons
              style={{ layout: "vertical", label: "pay" }}
              createOrder={createOrder}
              onApprove={onApprove}
              onError={(err) => setErrorMessage(err instanceof Error ? err.message : "Erreur PayPal")}
              onCancel={() => setErrorMessage("Paiement annulé")}
            />
          </PayPalScriptProvider>
          <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Paiement sécurisé par PayPal — carte bancaire acceptée sans compte
          </p>
          {!deferred && !locked && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeferred(true)}
              className="text-muted-foreground self-center"
            >
              Payer plus tard
            </Button>
          )}
        </div>
      )}

      {deferred && !locked && (
        <p className="text-xs text-muted-foreground">
          Vous pourrez revenir payer à tout moment depuis cet écran avant la fermeture des inscriptions.
        </p>
      )}
    </section>
  )
}
