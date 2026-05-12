import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveEdition, NoActiveEditionError } from "@/lib/edition"

export async function GET() {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const activeEdition = await getActiveEdition()

    const [totalUsers, attendingUsers] = await Promise.all([
      prisma.user.count(),
      prisma.editionParticipation.count({
        where: {
          editionId: activeEdition.id,
          isAttending: true,
        },
      }),
    ])

    return NextResponse.json({
      totalUsers,
      attendingUsers,
      attendingRate:
        totalUsers === 0
          ? 0
          : Math.round((attendingUsers / totalUsers) * 100),
    })
  } catch (error) {
    if (error instanceof NoActiveEditionError) {
      return NextResponse.json({ error: "Aucune édition active" }, { status: 503 })
    }
    console.error("🚨 Erreur lors de la récupération des stats admin:", error)
    return NextResponse.json(
      { error: "❌ Erreur lors de la récupération des statistiques" },
      { status: 500 }
    )
  }
}
