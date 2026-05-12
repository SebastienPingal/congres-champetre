import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const editions = await prisma.edition.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            participations: { where: { isAttending: true } },
            conferences: true,
            timeSlots: true,
          },
        },
      },
    })

    return NextResponse.json(editions)
  } catch (error) {
    console.error("🚨 Erreur lors de la récupération des éditions:", error)
    return NextResponse.json(
      { error: "❌ Erreur lors de la récupération des éditions" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { name, startDate, endDate } = await request.json()

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "📝 Le nom est requis" }, { status: 400 })
    }

    const edition = await prisma.edition.create({
      data: {
        name: name.trim(),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    })

    return NextResponse.json(
      { message: "✅ Édition créée avec succès", edition },
      { status: 201 }
    )
  } catch (error) {
    console.error("🚨 Erreur lors de la création de l'édition:", error)
    return NextResponse.json(
      { error: "❌ Erreur lors de la création de l'édition" },
      { status: 500 }
    )
  }
}
