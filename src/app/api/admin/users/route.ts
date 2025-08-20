import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Admin users list with participation and conference info
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

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        isAttending: true,
        attendanceDays: true,
        sleepsOnSite: true,
        wantsToSpeak: true,
        role: true,
        conferences: {
          select: { id: true, title: true }
        }
      }
    })

    const result = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      isAttending: u.isAttending,
      attendanceDays: u.attendanceDays,
      sleepsOnSite: u.sleepsOnSite,
      wantsToSpeak: u.wantsToSpeak,
      isSpeaker: u.conferences.length > 0,
      conferencesCount: u.conferences.length,
      conferenceTitles: u.conferences.map(c => c.title)
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("🚨 Erreur lors de la récupération des utilisateurs:", error)
    return NextResponse.json(
      { error: "❌ Erreur lors de la récupération des utilisateurs" },
      { status: 500 }
    )
  }
}


