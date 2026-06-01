"use client"

import { useState } from "react"
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"
import { useQueryClient } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Lock, ShieldCheck } from "lucide-react"
import { useMeals } from "@/hooks/use-meals"
import { queryKeys } from "@/lib/query-keys"
import { applyPaypalFees } from "@/lib/paypal-fees"
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
  const qc = useQueryClient()

  const payableMeals = meals.filter((m) => m.status === "PRESENT" && m.price != null)
  const total = payableMeals.reduce((sum, m) => sum + (m.price ?? 0), 0)
  const totalWithFees = applyPaypalFees(total)
  const fees = Math.round((totalWithFees - total) * 100) / 100
  const hasPaid = user.hasPaid
  const paidEuros = user.paidAmount != null ? user.paidAmount / 100 : totalWithFees
  const locked = user.edition.isRegistrationClosed
  const paypalConfigured = !!paypalClientId

  if (total === 0 && !hasPaid) return null

  if (hasPaid) {
    return (
      <section id="section-validation" className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-muted-foreground">Merci pour votre règlement ! Votre place est réservée, à très vite au congrès.</p>
          <Badge variant="outline" className="border-primary/40 text-primary">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {paidEuros > 0 ? `${paidEuros.toFixed(2)} € payés` : "Validée"}
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
    const res = await fetch("/api/payments/order", { method: "POST" })
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
        <div className="flex items-center justify-between border-t px-4 py-3">
          <span className="text-sm font-medium">Total à régler</span>
          <span className="text-lg font-semibold">{totalWithFees.toFixed(2)} €</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground max-w-prose">
        PayPal prélève des frais de traitement sur chaque paiement. Ces frais sont
        ajoutés au montant des repas afin que l&apos;intégralité de votre participation
        revienne à l&apos;organisation.
      </p>

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
