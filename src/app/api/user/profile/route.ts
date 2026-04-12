import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveEdition } from "@/lib/edition"
import type { AttendanceDays } from "@prisma/client"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "🔒 Non authentifié" },
        { status: 401 }
      )
    }

    const activeEdition = await getActiveEdition()

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        wantsToSpeak: true,
        createdAt: true,
        conferences: {
          where: { editionId: activeEdition.id },
          include: { timeSlot: true },
        },
        participations: {
          where: { editionId: activeEdition.id },
          take: 1,
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "👤 Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    const participation = user.participations[0]

    const participantCount = await prisma.editionParticipation.count({
      where: { editionId: activeEdition.id, isAttending: true },
    })

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      wantsToSpeak: user.wantsToSpeak,
      createdAt: user.createdAt,
      conferences: user.conferences,
      isAttending: participation?.isAttending ?? false,
      attendanceDays: participation?.attendanceDays ?? "NONE",
      sleepsOnSite: participation?.sleepsOnSite ?? false,
      willPayInCash: participation?.willPayInCash ?? false,
      edition: {
        id: activeEdition.id,
        name: activeEdition.name,
        startDate: activeEdition.startDate,
        endDate: activeEdition.endDate,
        participantCount,
      },
    })
  } catch (error) {
    console.error("🚨 Erreur lors de la récupération du profil:", error)
    return NextResponse.json(
      { error: "❌ Erreur lors de la récupération du profil" },
      { status: 500 }
    )
  }
}

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
    const activeEdition = await getActiveEdition()

    const userUpdateData: Record<string, unknown> = {}
    if (typeof body.wantsToSpeak === "boolean") {
      userUpdateData.wantsToSpeak = body.wantsToSpeak
      if (body.wantsToSpeak === false) {
        await prisma.conference.deleteMany({
          where: { speakerId: session.user.id, editionId: activeEdition.id },
        })
      }
    }

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: userUpdateData,
      })
    }

    const participationData: Record<string, unknown> = {}
    let needsParticipationUpdate = false

    if (typeof body.isAttending === "boolean") {
      participationData.isAttending = body.isAttending
      needsParticipationUpdate = true
      if (body.isAttending === false) {
        participationData.attendanceDays = "NONE"
        participationData.sleepsOnSite = false
      }
    }

    if (typeof body.attendanceDays === "string") {
      const allowed = ["NONE", "DAY1", "DAY2", "BOTH"]
      if (!allowed.includes(body.attendanceDays)) {
        return NextResponse.json(
          { error: "📝 Valeur attendanceDays invalide" },
          { status: 400 }
        )
      }
      participationData.attendanceDays = body.attendanceDays
      needsParticipationUpdate = true
      if (body.attendanceDays !== "NONE") {
        participationData.isAttending = true
      }
    }

    if (typeof body.sleepsOnSite === "boolean") {
      participationData.sleepsOnSite = body.sleepsOnSite
      needsParticipationUpdate = true
    }

    if (typeof body.willPayInCash === "boolean") {
      participationData.willPayInCash = body.willPayInCash
      needsParticipationUpdate = true
    }

    if (needsParticipationUpdate) {
      const existing = await prisma.editionParticipation.findUnique({
        where: {
          userId_editionId: {
            userId: session.user.id,
            editionId: activeEdition.id,
          },
        },
      })

      const finalIsAttending =
        typeof participationData.isAttending === "boolean"
          ? (participationData.isAttending as boolean)
          : (existing?.isAttending ?? false)

      if (body.sleepsOnSite === true && !finalIsAttending) {
        return NextResponse.json(
          { error: "📝 Impossible de dormir sur place si non présent" },
          { status: 400 }
        )
      }

      if (body.isAttending === true && !existing) {
        participationData.attendanceDays =
          participationData.attendanceDays ?? "BOTH"
      }

      await prisma.editionParticipation.upsert({
        where: {
          userId_editionId: {
            userId: session.user.id,
            editionId: activeEdition.id,
          },
        },
        create: {
          userId: session.user.id,
          editionId: activeEdition.id,
          isAttending: (participationData.isAttending as boolean) ?? false,
          attendanceDays:
            (participationData.attendanceDays as AttendanceDays) ?? "NONE",
          sleepsOnSite: (participationData.sleepsOnSite as boolean) ?? false,
        },
        update: participationData,
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        wantsToSpeak: true,
        conferences: {
          where: { editionId: activeEdition.id },
          include: { timeSlot: true },
        },
        participations: {
          where: { editionId: activeEdition.id },
          take: 1,
        },
      },
    })

    const participation = user?.participations[0]

    const participantCount = await prisma.editionParticipation.count({
      where: { editionId: activeEdition.id, isAttending: true },
    })

    return NextResponse.json({
      message: "✅ Profil mis à jour",
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        role: user?.role,
        wantsToSpeak: user?.wantsToSpeak,
        conferences: user?.conferences,
        isAttending: participation?.isAttending ?? false,
        attendanceDays: participation?.attendanceDays ?? "NONE",
        sleepsOnSite: participation?.sleepsOnSite ?? false,
        willPayInCash: participation?.willPayInCash ?? false,
        edition: {
          id: activeEdition.id,
          name: activeEdition.name,
          startDate: activeEdition.startDate,
          endDate: activeEdition.endDate,
          participantCount,
        },
      },
    })
  } catch (error) {
    console.error("🚨 Erreur lors de la mise à jour du profil:", error)
    return NextResponse.json(
      { error: "❌ Erreur lors de la mise à jour du profil" },
      { status: 500 }
    )
  }
}
