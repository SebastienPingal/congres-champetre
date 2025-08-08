import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Récupérer le profil utilisateur
export async function GET() {
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
        conferences: {
          include: {
            timeSlot: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "👤 Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("🚨 Erreur lors de la récupération du profil:", error)
    return NextResponse.json(
      { error: "❌ Erreur lors de la récupération du profil" },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour le statut "veut faire une conférence"
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "🔒 Non authentifié" },
        { status: 401 }
      )
    }

    const body = await request.json()

    const current = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAttending: true }
    })
    if (!current) {
      return NextResponse.json(
        { error: "👤 Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (typeof body.wantsToSpeak === 'boolean') {
      updateData.wantsToSpeak = body.wantsToSpeak
      if (body.wantsToSpeak === false) {
        await prisma.conference.deleteMany({
          where: { speakerId: session.user.id }
        })
      }
    }

    if (typeof body.isAttending === 'boolean') {
      updateData.isAttending = body.isAttending
      if (body.isAttending === false) {
        updateData.attendanceDays = 'NONE'
        updateData.sleepsOnSite = false
      }
    }

    if (typeof body.attendanceDays === 'string') {
      const allowed = ['NONE', 'DAY1', 'DAY2', 'BOTH']
      if (!allowed.includes(body.attendanceDays)) {
        return NextResponse.json(
          { error: '📝 Valeur attendanceDays invalide' },
          { status: 400 }
        )
      }
      updateData.attendanceDays = body.attendanceDays
      // If user sets any day, he is attending
      if (body.attendanceDays !== 'NONE') updateData.isAttending = true
    }

    // Validate sleepsOnSite against final attending state
    const finalIsAttending =
      typeof updateData.isAttending === 'boolean'
        ? (updateData.isAttending as boolean)
        : current.isAttending

    if (typeof body.sleepsOnSite === 'boolean') {
      if (body.sleepsOnSite && !finalIsAttending) {
        return NextResponse.json(
          { error: '📝 Impossible de dormir sur place si non présent' },
          { status: 400 }
        )
      }
      updateData.sleepsOnSite = body.sleepsOnSite
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        wantsToSpeak: true,
        isAttending: true,
        attendanceDays: true,
        sleepsOnSite: true,
        conferences: {
          include: {
            timeSlot: true
          }
        }
      }
    })

    return NextResponse.json(
      {
        message: '✅ Profil mis à jour',
        user
      }
    )
  } catch (error) {
    console.error("🚨 Erreur lors de la mise à jour du profil:", error)
    return NextResponse.json(
      { error: "❌ Erreur lors de la mise à jour du profil" },
      { status: 500 }
    )
  }
}