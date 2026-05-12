import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveEdition, NoActiveEditionError } from "@/lib/edition"

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
    if (error instanceof NoActiveEditionError) {
      return NextResponse.json({ error: "Aucune édition active" }, { status: 503 })
    }
    console.error("🚨 Erreur lors de la récupération des créneaux:", error)
    return NextResponse.json(
      { error: "❌ Erreur lors de la récupération des créneaux" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { title, startTime, endTime, kind, description, price, showInRegistration, editionId: bodyEditionId } = await request.json()

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

    let targetEditionId: string
    if (bodyEditionId && typeof bodyEditionId === "string") {
      const edition = await prisma.edition.findUnique({ where: { id: bodyEditionId } })
      if (!edition) {
        return NextResponse.json({ error: "Édition introuvable" }, { status: 400 })
      }
      targetEditionId = bodyEditionId
    } else {
      const activeEdition = await getActiveEdition()
      targetEditionId = activeEdition.id
    }

    const timeSlot = await prisma.timeSlot.create({
      data: {
        title,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        editionId: targetEditionId,
        ...(kind ? { kind } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(price !== undefined ? { price: price !== null ? Number(price) : null } : {}),
        ...(typeof showInRegistration === 'boolean' ? { showInRegistration } : {}),
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
    if (error instanceof NoActiveEditionError) {
      return NextResponse.json({ error: "Aucune édition active" }, { status: 503 })
    }
    console.error("🚨 Erreur lors de la création du créneau:", error)
    return NextResponse.json(
      { error: "❌ Erreur lors de la création du créneau" },
      { status: 500 }
    )
  }
}
