import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Admin stats: total users and attendees
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "🔒 Non authentifié" },
        { status: 401 }
      )
    }

    const me = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (me?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "⚠️ Accès refusé - Admin requis" },
        { status: 403 }
      )
    }

    const [totalUsers, attendingUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isAttending: true } }),
    ])

    return NextResponse.json({
      totalUsers,
      attendingUsers,
      attendingRate: totalUsers === 0 ? 0 : Math.round((attendingUsers / totalUsers) * 100),
    })
  } catch (error) {
    console.error("🚨 Erreur lors de la récupération des stats admin:", error)
    return NextResponse.json(
      { error: "❌ Erreur lors de la récupération des statistiques" },
      { status: 500 }
    )
  }
}


