import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 })
  }

  const stripe = getStripe()

  let event
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 })
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object
    const { userId, editionId } = intent.metadata

    if (userId && editionId) {
      await prisma.editionParticipation.update({
        where: { userId_editionId: { userId, editionId } },
        data: {
          hasPaid: true,
          stripePaymentStatus: "succeeded",
          paidAmount: intent.amount,
        },
      })

      await prisma.paymentIntent.updateMany({
        where: { stripeId: intent.id },
        data: { status: "succeeded" },
      })
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object
    const { userId, editionId } = intent.metadata

    if (userId && editionId) {
      await prisma.editionParticipation.update({
        where: { userId_editionId: { userId, editionId } },
        data: { stripePaymentStatus: "failed" },
      })

      await prisma.paymentIntent.updateMany({
        where: { stripeId: intent.id },
        data: { status: "failed" },
      })
    }
  }

  return NextResponse.json({ received: true })
}
