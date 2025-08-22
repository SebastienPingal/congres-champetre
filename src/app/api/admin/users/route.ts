import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "🔒 Non authentifié" }, { status: 401 })
    }

    const me = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (me?.role !== "ADMIN") {
      return NextResponse.json({ error: "⚠️ Accès refusé - Admin requis" }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        wantsToSpeak: true,
        isAttending: true,
        attendanceDays: true,
        sleepsOnSite: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("🚨 Erreur lors de la récupération des utilisateurs:", error)
    return NextResponse.json({ error: "❌ Erreur serveur" }, { status: 500 })
  }
}



