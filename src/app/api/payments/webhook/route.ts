import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyWebhook } from "@/lib/paypal"

export const dynamic = "force-dynamic"

interface PaypalWebhookEvent {
  event_type: string
  resource: {
    id?: string
    status?: string
    custom_id?: string
    supplementary_data?: { related_ids?: { order_id?: string } }
    amount?: { value: string; currency_code: string }
    purchase_units?: Array<{ custom_id?: string }>
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  let isValid = false
  try {
    isValid = await verifyWebhook(request.headers, rawBody)
  } catch (e) {
    console.error("🚨 Erreur vérif webhook PayPal:", e)
    return NextResponse.json({ error: "Signature non vérifiée" }, { status: 400 })
  }
  if (!isValid) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 })
  }

  const event = JSON.parse(rawBody) as PaypalWebhookEvent

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const customId = event.resource.custom_id
      ?? event.resource.purchase_units?.[0]?.custom_id
    const orderId = event.resource.supplementary_data?.related_ids?.order_id
    if (customId) {
      const [userId, editionId] = customId.split(":")
      const amountCents = event.resource.amount
        ? Math.round(parseFloat(event.resource.amount.value) * 100)
        : undefined
      if (userId && editionId) {
        await prisma.editionParticipation.update({
          where: { userId_editionId: { userId, editionId } },
          data: {
            hasPaid: true,
            paymentStatus: "succeeded",
            ...(amountCents !== undefined ? { paidAmount: amountCents } : {}),
          },
        })
        if (orderId) {
          await prisma.paymentIntent.updateMany({
            where: { providerId: orderId },
            data: { status: "succeeded" },
          })
        }
      }
    }
  }

  if (event.event_type === "PAYMENT.CAPTURE.DENIED" || event.event_type === "CHECKOUT.ORDER.VOIDED") {
    const orderId = event.resource.supplementary_data?.related_ids?.order_id ?? event.resource.id
    if (orderId) {
      await prisma.editionParticipation.updateMany({
        where: { paymentProviderId: orderId },
        data: { paymentStatus: "failed" },
      })
      await prisma.paymentIntent.updateMany({
        where: { providerId: orderId },
        data: { status: "failed" },
      })
    }
  }

  return NextResponse.json({ received: true })
}
