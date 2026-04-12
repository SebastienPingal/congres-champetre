import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveEdition } from "@/lib/edition"

export async function GET() {
  try {
    const session = await auth()
    const activeEdition = await getActiveEdition()

    const mealSlots = await prisma.timeSlot.findMany({
      where: { editionId: activeEdition.id, kind: "MEAL" },
      orderBy: { startTime: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        startTime: true,
        endTime: true,
        mealRegistrations: session?.user
          ? { where: { userId: session.user.id }, select: { id: true } }
          : false,
      },
    })

    const result = mealSlots.map((slot) => ({
      id: slot.id,
      title: slot.title,
      description: slot.description,
      price: slot.price,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isRegistered: session?.user
        ? (slot.mealRegistrations as { id: string }[]).length > 0
        : false,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("Erreur lors de la recuperation des repas:", error)
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des repas" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifie" },
        { status: 401 }
      )
    }

    const { timeSlotId } = await request.json()

    if (!timeSlotId || typeof timeSlotId !== "string") {
      return NextResponse.json(
        { error: "timeSlotId requis" },
        { status: 400 }
      )
    }

    const activeEdition = await getActiveEdition()

    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
    })

    if (!timeSlot || timeSlot.editionId !== activeEdition.id || timeSlot.kind !== "MEAL") {
      return NextResponse.json(
        { error: "Creneau repas invalide" },
        { status: 400 }
      )
    }

    // Toggle: if already registered, unregister; otherwise register
    const existing = await prisma.mealRegistration.findUnique({
      where: {
        userId_timeSlotId: {
          userId: session.user.id,
          timeSlotId,
        },
      },
    })

    if (existing) {
      await prisma.mealRegistration.delete({
        where: { id: existing.id },
      })
      return NextResponse.json({ registered: false })
    } else {
      await prisma.mealRegistration.create({
        data: {
          userId: session.user.id,
          timeSlotId,
        },
      })
      return NextResponse.json({ registered: true })
    }
  } catch (error) {
    console.error("Erreur lors de l'inscription au repas:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'inscription au repas" },
      { status: 500 }
    )
  }
}
