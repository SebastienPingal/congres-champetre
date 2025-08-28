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
        hasPaid: true,
        willPayInCash: true,
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

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "🔒 Non authentifié" }, { status: 401 })
    }

    const me = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (me?.role !== "ADMIN") {
      return NextResponse.json({ error: "⚠️ Accès refusé - Admin requis" }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 })
    }

    const { userId, hasPaid, willPayInCash } = body as {
      userId?: string
      hasPaid?: boolean
      willPayInCash?: boolean
    }

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId manquant" }, { status: 400 })
    }

    const data: Record<string, boolean> = {}
    if (typeof hasPaid === "boolean") data.hasPaid = hasPaid
    if (typeof willPayInCash === "boolean") data.willPayInCash = willPayInCash

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        hasPaid: true,
        willPayInCash: true,
        updatedAt: true,
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("🚨 Erreur lors de la mise à jour de l'utilisateur:", error)
    return NextResponse.json({ error: "❌ Erreur serveur" }, { status: 500 })
  }
}
