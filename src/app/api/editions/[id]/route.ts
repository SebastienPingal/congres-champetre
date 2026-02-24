import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "🔒 Non authentifié" }, { status: 401 })
    }

    const me = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (me?.role !== "ADMIN") {
      return NextResponse.json({ error: "⚠️ Accès refusé - Admin requis" }, { status: 403 })
    }

    const existing = await prisma.edition.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "📅 Édition non trouvée" }, { status: 404 })
    }

    const { name, startDate, endDate, isActive } = await request.json()

    if (isActive === true) {
      await prisma.$transaction([
        prisma.edition.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        }),
        prisma.edition.update({
          where: { id },
          data: {
            isActive: true,
            ...(name !== undefined ? { name: name.trim() } : {}),
            ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
            ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
          },
        }),
      ])
    } else {
      await prisma.edition.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name: name.trim() } : {}),
          ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
          ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
          ...(isActive === false ? { isActive: false } : {}),
        },
      })
    }

    const updated = await prisma.edition.findUnique({ where: { id } })

    return NextResponse.json({
      message: "✅ Édition mise à jour",
      edition: updated,
    })
  } catch (error) {
    console.error("🚨 Erreur lors de la mise à jour de l'édition:", error)
    return NextResponse.json(
      { error: "❌ Erreur lors de la mise à jour de l'édition" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "🔒 Non authentifié" }, { status: 401 })
    }

    const me = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (me?.role !== "ADMIN") {
      return NextResponse.json({ error: "⚠️ Accès refusé - Admin requis" }, { status: 403 })
    }

    const edition = await prisma.edition.findUnique({ where: { id } })
    if (!edition) {
      return NextResponse.json({ error: "📅 Édition non trouvée" }, { status: 404 })
    }

    if (edition.isActive) {
      return NextResponse.json(
        { error: "⚠️ Impossible de supprimer l'édition active. Activez une autre édition d'abord." },
        { status: 400 }
      )
    }

    await prisma.edition.delete({ where: { id } })

    return NextResponse.json({ message: "🗑️ Édition supprimée" })
  } catch (error) {
    console.error("🚨 Erreur lors de la suppression de l'édition:", error)
    return NextResponse.json(
      { error: "❌ Erreur lors de la suppression de l'édition" },
      { status: 500 }
    )
  }
}
