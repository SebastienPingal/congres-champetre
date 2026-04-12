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
          ? { where: { userId: session.user.id }, select: { id: true, status: true } }
          : false,
      },
    })

    const result = mealSlots.map((slot) => {
      const registrations = slot.mealRegistrations as { id: string; status: string }[] | undefined
      const registration = registrations?.[0] ?? null
      return {
        id: slot.id,
        title: slot.title,
        description: slot.description,
        price: slot.price,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: registration?.status ?? null,
      }
    })

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

    const { timeSlotId, status } = await request.json()

    if (!timeSlotId || typeof timeSlotId !== "string") {
      return NextResponse.json(
        { error: "timeSlotId requis" },
        { status: 400 }
      )
    }

    if (status !== "PRESENT" && status !== "ABSENT") {
      return NextResponse.json(
        { error: "status doit être PRESENT ou ABSENT" },
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

    await prisma.mealRegistration.upsert({
      where: {
        userId_timeSlotId: {
          userId: session.user.id,
          timeSlotId,
        },
      },
      create: {
        userId: session.user.id,
        timeSlotId,
        status,
      },
      update: {
        status,
      },
    })

    return NextResponse.json({ status })
  } catch (error) {
    console.error("Erreur lors de l'inscription au repas:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'inscription au repas" },
      { status: 500 }
    )
  }
}
