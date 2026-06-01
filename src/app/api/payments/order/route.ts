import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createOrder } from "@/lib/paypal"
import { getActiveEdition, NoActiveEditionError } from "@/lib/edition"
import { applyPaypalFees } from "@/lib/paypal-fees"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "🔒 Non authentifié" }, { status: 401 })
    }

    const activeEdition = await getActiveEdition()

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
    const totalWithFees = applyPaypalFees(totalEuros)
    const amountCents = Math.round(totalWithFees * 100)

    if (amountCents === 0) {
      return NextResponse.json({ error: "Aucun repas payant sélectionné" }, { status: 400 })
    }

    const order = await createOrder(totalWithFees, {
      userId: session.user.id,
      editionId: activeEdition.id,
    })

    const upsertedParticipation = await prisma.editionParticipation.upsert({
      where: { userId_editionId: { userId: session.user.id, editionId: activeEdition.id } },
      create: {
        userId: session.user.id,
        editionId: activeEdition.id,
        paymentProviderId: order.id,
        paymentStatus: "pending",
      },
      update: {
        paymentProviderId: order.id,
        paymentStatus: "pending",
      },
    })

    await prisma.paymentIntent.create({
      data: {
        userId: session.user.id,
        editionId: activeEdition.id,
        participationId: upsertedParticipation.id,
        providerId: order.id,
        amount: amountCents,
        currency: "eur",
        status: "pending",
      },
    })

    return NextResponse.json({ orderId: order.id, amount: totalWithFees })
  } catch (error) {
    if (error instanceof NoActiveEditionError) {
      return NextResponse.json({ error: "Aucune édition active" }, { status: 503 })
    }
    console.error("🚨 Erreur création order PayPal:", error)
    return NextResponse.json({ error: "❌ Erreur lors de la création du paiement" }, { status: 500 })
  }
}
