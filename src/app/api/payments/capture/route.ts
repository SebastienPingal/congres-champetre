import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { captureOrder } from "@/lib/paypal"
import { getActiveEdition, NoActiveEditionError } from "@/lib/edition"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "🔒 Non authentifié" }, { status: 401 })
    }

    const { orderId } = (await request.json()) as { orderId?: string }
    if (!orderId) {
      return NextResponse.json({ error: "orderId manquant" }, { status: 400 })
    }

    const activeEdition = await getActiveEdition()

    const participation = await prisma.editionParticipation.findUnique({
      where: { userId_editionId: { userId: session.user.id, editionId: activeEdition.id } },
    })

    if (!participation || participation.paymentProviderId !== orderId) {
      return NextResponse.json({ error: "Order inconnu pour cet utilisateur" }, { status: 403 })
    }

    const captured = await captureOrder(orderId)
    const capture = captured.purchase_units?.[0]?.payments?.captures?.[0]
    const succeeded = captured.status === "COMPLETED" && capture?.status === "COMPLETED"

    if (succeeded && capture) {
      const amountCents = Math.round(parseFloat(capture.amount.value) * 100)
      await prisma.editionParticipation.update({
        where: { id: participation.id },
        data: {
          hasPaid: true,
          paymentStatus: "succeeded",
          paidAmount: amountCents,
        },
      })
      await prisma.paymentIntent.updateMany({
        where: { providerId: orderId },
        data: { status: "succeeded" },
      })
      return NextResponse.json({ status: "succeeded", amount: amountCents })
    }

    await prisma.editionParticipation.update({
      where: { id: participation.id },
      data: { paymentStatus: "failed" },
    })
    await prisma.paymentIntent.updateMany({
      where: { providerId: orderId },
      data: { status: "failed" },
    })
    return NextResponse.json({ status: "failed" }, { status: 400 })
  } catch (error) {
    if (error instanceof NoActiveEditionError) {
      return NextResponse.json({ error: "Aucune édition active" }, { status: 503 })
    }
    console.error("🚨 Erreur capture PayPal:", error)
    return NextResponse.json({ error: "❌ Erreur lors de la capture du paiement" }, { status: 500 })
  }
}
