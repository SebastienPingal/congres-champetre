import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveEdition } from "@/lib/edition"

export async function GET() {
  try {
    const activeEdition = await getActiveEdition()

    const timeSlots = await prisma.timeSlot.findMany({
      where: { editionId: activeEdition.id },
      include: {
        conference: {
          include: {
            speaker: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    })

    return NextResponse.json(timeSlots)
  } catch (error) {
    console.error("🚨 Erreur lors de la récupération des créneaux:", error)
    return NextResponse.json(
      { error: "❌ Erreur lors de la récupération des créneaux" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "🔒 Non authentifié" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "⚠️ Accès refusé - Admin requis" },
        { status: 403 }
      )
    }

    const { title, startTime, endTime, kind } = await request.json()

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: "📝 Titre, heure de début et heure de fin sont requis" },
        { status: 400 }
      )
    }

    if (new Date(endTime) <= new Date(startTime)) {
      return NextResponse.json(
        { error: "⏰ L'heure de fin doit être après l'heure de début" },
        { status: 400 }
      )
    }

    const activeEdition = await getActiveEdition()

    const timeSlot = await prisma.timeSlot.create({
      data: {
        title,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        editionId: activeEdition.id,
        ...(kind ? { kind } : {}),
      },
    })

    return NextResponse.json(
      {
        message: "✅ Créneau créé avec succès",
        timeSlot,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("🚨 Erreur lors de la création du créneau:", error)
    return NextResponse.json(
      { error: "❌ Erreur lors de la création du créneau" },
      { status: 500 }
    )
  }
}
