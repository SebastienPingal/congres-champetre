"use client"

import { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { useQueryClient } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle2, CreditCard, Lock, ShieldCheck } from "lucide-react"
import { useMeals } from "@/hooks/use-meals"
import { queryKeys } from "@/lib/query-keys"
import type { UserProfile } from "@/types"

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsProcessing(true)
    setError(null)

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/paiement`,
      },
      redirect: "if_required",
    })

    if (submitError) {
      setError(submitError.message ?? "Erreur lors du paiement")
      setIsProcessing(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={!stripe || isProcessing} className="w-full">
        {isProcessing ? "Traitement..." : "Confirmer le paiement"}
      </Button>
      <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
        <ShieldCheck className="h-3 w-3" />
        Paiement sécurisé par Stripe
      </p>
    </form>
  )
}

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
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [deferred, setDeferred] = useState(false)
  const qc = useQueryClient()

  const payableMeals = meals.filter((m) => m.status === "PRESENT" && m.price != null)
  const total = payableMeals.reduce((sum, m) => sum + (m.price ?? 0), 0)
  const hasPaid = user.hasPaid
  const locked = user.edition.isRegistrationClosed
  const stripeConfigured = !!stripePromise

  if (total === 0 && !hasPaid) return null

  const handleOpenPayment = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const res = await fetch("/api/payments/intent", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setErrorMessage(data.error ?? "Erreur lors de la création du paiement")
        return
      }
      if (data.clientSecret) {
        setClientSecret(data.clientSecret)
        setIsDialogOpen(true)
      }
    } catch {
      setErrorMessage("Erreur réseau, réessayez")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentSuccess = () => {
    setIsDialogOpen(false)
    setClientSecret(null)
    qc.invalidateQueries({ queryKey: queryKeys.userProfile })
  }

  if (hasPaid) {
    return (
      <section id="section-validation" className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-muted-foreground">Merci pour votre règlement ! Votre place est réservée, à très vite au congrès.</p>
          <Badge variant="outline" className="border-primary/40 text-primary">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {total > 0 ? `${total} € payés` : "Validée"}
          </Badge>
        </div>
      </section>
    )
  }

  const deadline = user.edition.registrationDeadline
    ? formatDeadline(user.edition.registrationDeadline)
    : null

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

      <div className="rounded-lg border bg-white/60">
        <ul className="divide-y">
          {payableMeals.map((m) => (
            <li key={m.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-foreground/90">{m.title}</span>
              <span className="font-medium">{m.price} €</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t px-4 py-3">
          <span className="text-sm font-medium">Total</span>
          <span className="text-lg font-semibold">{total} €</span>
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

      {!stripeConfigured ? (
        <p className="text-sm text-muted-foreground">
          Le paiement en ligne n&apos;est pas configuré sur cet environnement.
        </p>
      ) : (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            type="button"
            onClick={handleOpenPayment}
            disabled={isLoading || total === 0}
            className="flex-1"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {isLoading ? "Préparation..." : `Payer maintenant — ${total} €`}
          </Button>
          {!deferred && !locked && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeferred(true)}
              className="text-muted-foreground"
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Paiement — {total} €</DialogTitle>
          </DialogHeader>
          {clientSecret && stripePromise && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm onSuccess={handlePaymentSuccess} />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
