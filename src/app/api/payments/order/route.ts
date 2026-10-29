import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createOrder } from "@/lib/paypal"
import { getActiveEdition, NoActiveEditionError } from "@/lib/edition"
import { applyPaypalFees } from "@/lib/paypal-fees"
import { MAX_SUPPORT_AMOUNT, parseSupportAmount } from "@/lib/support"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "🔒 Non authentifié" }, { status: 401 })
    }

    // Le body est facultatif : seul le soutien libre vient du client, le
    // montant des repas reste recalculé en base.
    const body = (await request.json().catch(() => ({}))) as { supportAmount?: unknown }
    const supportAmount = parseSupportAmount(body.supportAmount)
    if (supportAmount === null) {
      return NextResponse.json(
        { error: `Le soutien doit être un nombre entier d'euros entre 0 et ${MAX_SUPPORT_AMOUNT} €` },
        { status: 400 }
      )
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
    if (totalEuros === 0) {
      return NextResponse.json({ error: "Aucun repas payant sélectionné" }, { status: 400 })
    }

    // Les frais PayPal ne portent que sur les repas : le soutien est ajouté tel quel.
    const totalWithFees = applyPaypalFees(totalEuros) + supportAmount
    const amountCents = Math.round(totalWithFees * 100)

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
        supportAmount,
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
