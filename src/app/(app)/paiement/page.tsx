"use client"

import { CreditCard } from "lucide-react"
import { PageShell } from "@/components/page-shell"
import { PaymentSection } from "@/features/meals/payment-section"

export default function PaiementPage() {
  return (
    <PageShell title="Paiement" icon={CreditCard}>
      {({ user }) => {
        if (!user.isAttending || !user.onboardingCompletedAt) {
          return (
            <p className="text-sm text-muted-foreground">
              Complétez d&apos;abord votre présence pour accéder au paiement.
            </p>
          )
        }
        return <PaymentSection user={user} />
      }}
    </PageShell>
  )
}
