import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Récupérer un créneau par id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id },
      include: {
        conference: {
          include: {
            speaker: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    })

    if (!timeSlot) {
      return NextResponse.json(
        { error: "⏰ Créneau non trouvé" },
        { status: 404 }
      )
    }

    return NextResponse.json(timeSlot)
  } catch (error) {
    console.error("🧨 Erreur lors de la récupération du créneau:", error)
    return NextResponse.json(
      { error: "❌ Erreur lors de la récupération du créneau" },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour un créneau (admin uniquement)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "🔒 Non authentifié" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "⚠️ Accès refusé - Admin requis" },
        { status: 403 }
      )
    }

    const payload = await request.json()
    const { title, startTime, endTime, kind, description, price } = payload as {
      title?: string
      startTime?: string
      endTime?: string
      kind?: 'CONFERENCE' | 'MEAL' | 'BREAK' | 'OTHER'
      description?: string | null
      price?: number | null
    }

    const existing = await prisma.timeSlot.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: "⏰ Créneau non trouvé" },
        { status: 404 }
      )
    }

    const nextStart = startTime ? new Date(startTime) : existing.startTime
    const nextEnd = endTime ? new Date(endTime) : existing.endTime

    if (nextEnd <= nextStart) {
      return NextResponse.json(
        { error: "⏰ L'heure de fin doit être après l'heure de début" },
        { status: 400 }
      )
    }

    const updated = await prisma.timeSlot.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(startTime !== undefined ? { startTime: nextStart } : {}),
        ...(endTime !== undefined ? { endTime: nextEnd } : {}),
        ...(kind !== undefined ? { kind } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(price !== undefined ? { price: price !== null ? Number(price) : null } : {}),
      },
      include: {
        conference: {
          include: {
            speaker: { select: { id: true, name: true, email: true } }
          }
        }
      }
    })

    return NextResponse.json({
      message: "✅ Créneau mis à jour avec succès",
      timeSlot: updated
    })
  } catch (error) {
    console.error("🧨 Erreur lors de la mise à jour du créneau:", error)
    return NextResponse.json(
      { error: "❌ Erreur lors de la mise à jour du créneau" },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un créneau (admin uniquement)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "🔒 Non authentifié" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "⚠️ Accès refusé - Admin requis" },
        { status: 403 }
      )
    }

    const withRelations = await prisma.timeSlot.findUnique({
      where: { id },
      include: { conference: true }
    })

    if (!withRelations) {
      return NextResponse.json(
        { error: "⏰ Créneau non trouvé" },
        { status: 404 }
      )
    }

    if (withRelations.conference) {
      return NextResponse.json(
        { error: "🎤 Ce créneau est déjà assigné à une conférence" },
        { status: 400 }
      )
    }

    await prisma.timeSlot.delete({ where: { id } })

    return NextResponse.json({ message: "🗑️ Créneau supprimé" })
  } catch (error) {
    console.error("🧨 Erreur lors de la suppression du créneau:", error)
    return NextResponse.json(
      { error: "❌ Erreur lors de la suppression du créneau" },
      { status: 500 }
    )
  }
}


