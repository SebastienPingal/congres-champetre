"use client"

import { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle2, CreditCard } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

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
        {isProcessing ? "Traitement..." : "Payer"}
      </Button>
    </form>
  )
}

interface MealPaymentBlockProps {
  total: number
  hasPaid: boolean
  willPayInCash: boolean
}

export function MealPaymentBlock({ total, hasPaid, willPayInCash }: MealPaymentBlockProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const qc = useQueryClient()

  if (hasPaid) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3">
        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-800">Paiement reçu</p>
          <p className="text-xs text-green-600">Merci pour votre règlement !</p>
        </div>
        <Badge className="ml-auto bg-green-100 text-green-800 border-green-300" variant="outline">
          {total} €
        </Badge>
      </div>
    )
  }

  if (willPayInCash || !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return null
  }

  const handleOpenPayment = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/payments/intent", { method: "POST" })
      const data = await res.json()
      if (data.clientSecret) {
        setClientSecret(data.clientSecret)
        setIsDialogOpen(true)
      }
    } catch {
      // silent — user can retry
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentSuccess = () => {
    setIsDialogOpen(false)
    setClientSecret(null)
    qc.invalidateQueries({ queryKey: queryKeys.userProfile })
  }

  return (
    <>
      <Button
        type="button"
        onClick={handleOpenPayment}
        disabled={isLoading}
        className="w-full"
      >
        <CreditCard className="h-4 w-4 mr-2" />
        {isLoading ? "Préparation..." : `Payer par carte — ${total} €`}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Paiement — {total} €</DialogTitle>
          </DialogHeader>
          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm onSuccess={handlePaymentSuccess} />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
