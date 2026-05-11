import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStripe } from "@/lib/stripe"
import { getActiveEdition } from "@/lib/edition"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "🔒 Non authentifié" }, { status: 401 })
    }

    const activeEdition = await getActiveEdition()

    // Compute total from PRESENT meal registrations with a price
    const mealRegistrations = await prisma.mealRegistration.findMany({
      where: {
        userId: session.user.id,
        status: "PRESENT",
        timeSlot: {
          editionId: activeEdition.id,
          price: { not: null },
        },
      },
      include: { timeSlot: { select: { price: true } } },
    })

    const totalEuros = mealRegistrations.reduce(
      (sum, r) => sum + (r.timeSlot.price ?? 0),
      0
    )
    const amountCents = Math.round(totalEuros * 100)

    if (amountCents === 0) {
      return NextResponse.json({ error: "Aucun repas payant sélectionné" }, { status: 400 })
    }

    const participation = await prisma.editionParticipation.findUnique({
      where: { userId_editionId: { userId: session.user.id, editionId: activeEdition.id } },
    })

    const stripe = getStripe()

    // Reuse existing intent if it exists and amount matches
    if (participation?.stripePaymentIntentId && participation.stripePaymentStatus === "pending") {
      const existing = await stripe.paymentIntents.retrieve(participation.stripePaymentIntentId)
      if (existing.amount === amountCents && existing.status === "requires_payment_method") {
        return NextResponse.json({ clientSecret: existing.client_secret, amount: totalEuros })
      }
    }

    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "eur",
      metadata: {
        userId: session.user.id,
        editionId: activeEdition.id,
      },
    })

    // Record the intent
    const upsertedParticipation = await prisma.editionParticipation.upsert({
      where: { userId_editionId: { userId: session.user.id, editionId: activeEdition.id } },
      create: {
        userId: session.user.id,
        editionId: activeEdition.id,
        stripePaymentIntentId: intent.id,
        stripePaymentStatus: "pending",
      },
      update: {
        stripePaymentIntentId: intent.id,
        stripePaymentStatus: "pending",
      },
    })

    await prisma.paymentIntent.create({
      data: {
        userId: session.user.id,
        editionId: activeEdition.id,
        participationId: upsertedParticipation.id,
        stripeId: intent.id,
        amount: amountCents,
        currency: "eur",
        status: "pending",
      },
    })

    return NextResponse.json({ clientSecret: intent.client_secret, amount: totalEuros })
  } catch (error) {
    console.error("🚨 Erreur création intent:", error)
    return NextResponse.json({ error: "❌ Erreur lors de la création du paiement" }, { status: 500 })
  }
}
