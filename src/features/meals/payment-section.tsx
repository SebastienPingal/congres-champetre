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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle2, CreditCard, Lock, ShieldCheck, Sparkles } from "lucide-react"
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
        return_url: `${window.location.origin}/dashboard`,
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
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={!stripe || isProcessing} className="w-full">
        {isProcessing ? "Traitement..." : "Confirmer le paiement"}
      </Button>
      <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
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
      <Card id="section-validation" className="border-l-4 border-l-green-400">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle2 className="h-5 w-5" />
              Participation validée
            </CardTitle>
            <Badge className="bg-green-100 text-green-800 border-green-300" variant="outline">
              {total > 0 ? `${total} € payés` : "✓"}
            </Badge>
          </div>
          <CardDescription>
            Merci pour votre règlement ! Votre place est réservée, à très vite au congrès.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const deadline = user.edition.registrationDeadline
    ? formatDeadline(user.edition.registrationDeadline)
    : null

  const urgent = !deferred && !locked

  return (
    <Card
      id="section-validation"
      className={
        locked
          ? "border-l-4 border-l-red-400"
          : urgent
          ? "animate-border-rotate animate-border-rotate-amber shadow-md"
          : "border-l-4 border-l-amber-300"
      }
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Validez votre participation
          </CardTitle>
          {locked ? (
            <Badge className="bg-red-100 text-red-800 border-red-300" variant="outline">
              <Lock className="h-3 w-3 mr-1" />Inscriptions fermées
            </Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-800 border-amber-300" variant="outline">
              Non validée
            </Badge>
          )}
        </div>
        <CardDescription>
          Réglez votre participation aux repas pour confirmer votre place. Tant que le paiement n&apos;est pas reçu, votre inscription reste provisoire.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="rounded-lg border bg-amber-50/60 p-4">
          <ul className="flex flex-col gap-1.5 text-sm">
            {payableMeals.map((m) => (
              <li key={m.id} className="flex items-center justify-between">
                <span className="text-gray-700">{m.title}</span>
                <span className="font-medium text-gray-900">{m.price} €</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 pt-3 border-t flex items-center justify-between">
            <span className="text-sm font-medium">Total</span>
            <span className="text-lg font-semibold">{total} €</span>
          </div>
        </div>

        {deadline && !locked && (
          <p className="text-xs text-gray-500">
            Les inscriptions ferment le <span className="font-medium">{deadline.label}</span>
            {deadline.daysLeft > 0 && (
              <> — il vous reste <span className="font-medium">{deadline.daysLeft} jour{deadline.daysLeft > 1 ? "s" : ""}</span> pour confirmer.</>
            )}
          </p>
        )}

        {locked && (
          <p className="text-sm text-red-700">
            Les inscriptions sont closes. Contactez l&apos;organisateur si vous souhaitez tout de même participer.
          </p>
        )}

        {errorMessage && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}

        {!stripeConfigured ? (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3">
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
                className="text-gray-600"
              >
                Payer plus tard
              </Button>
            )}
          </div>
        )}

        {deferred && !locked && (
          <p className="text-xs text-gray-500">
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
      </CardContent>
    </Card>
  )
}
