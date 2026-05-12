import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveEdition, NoActiveEditionError } from "@/lib/edition"
import { buildParticipationUpdate, upsertParticipation } from "@/lib/participation"

export async function GET() {
  try {
    const { user: sessionUser, error } = await requireUser()
    if (error) return error

    const activeEdition = await getActiveEdition()

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
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
      wantsToSpeak: user.wantsToSpeak ?? null,
      createdAt: user.createdAt,
      conferences: user.conferences,
      isAttending: participation?.isAttending ?? null,
      attendanceDays: participation?.attendanceDays ?? "NONE",
      sleepsOnSite: participation?.sleepsOnSite ?? null,
      willPayInCash: participation?.willPayInCash ?? false,
      hasPaid: participation?.hasPaid ?? false,
      onboardingCompletedAt: participation?.onboardingCompletedAt ?? null,
      edition: {
        id: activeEdition.id,
        name: activeEdition.name,
        startDate: activeEdition.startDate,
        endDate: activeEdition.endDate,
        participantCount,
      },
    })
  } catch (error) {
    if (error instanceof NoActiveEditionError) {
      return NextResponse.json({ error: "Aucune édition active" }, { status: 503 })
    }
    console.error("🚨 Erreur lors de la récupération du profil:", error)
    return NextResponse.json(
      { error: "❌ Erreur lors de la récupération du profil" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user: sessionUser, error } = await requireUser()
    if (error) return error

    const body = await request.json()
    const activeEdition = await getActiveEdition()

    // ⚠ Couplage explicite : `wantsToSpeak ⇔ conferences.length > 0`.
    // Passer `wantsToSpeak=false` supprime toutes les conférences de l'utilisateur pour
    // l'édition active. Pendant Conference create/delete, l'inverse est maintenu côté
    // `/api/conferences/*`. Voir REFACTOR.md §R8.
    if (typeof body.wantsToSpeak === "boolean" || body.wantsToSpeak === null) {
      if (body.wantsToSpeak === false) {
        await prisma.conference.deleteMany({
          where: { speakerId: sessionUser.id, editionId: activeEdition.id },
        })
      }
      await prisma.user.update({
        where: { id: sessionUser.id },
        data: { wantsToSpeak: body.wantsToSpeak },
      })
    }

    const participationResult = await buildParticipationUpdate(
      sessionUser.id,
      activeEdition.id,
      body,
    )

    if (participationResult && "error" in participationResult) {
      return NextResponse.json(
        { error: participationResult.error },
        { status: participationResult.status },
      )
    }

    if (participationResult) {
      await upsertParticipation(sessionUser.id, activeEdition.id, participationResult.data)
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
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
        wantsToSpeak: user?.wantsToSpeak ?? null,
        conferences: user?.conferences,
        isAttending: participation?.isAttending ?? null,
        attendanceDays: participation?.attendanceDays ?? "NONE",
        sleepsOnSite: participation?.sleepsOnSite ?? null,
        willPayInCash: participation?.willPayInCash ?? false,
        hasPaid: participation?.hasPaid ?? false,
        onboardingCompletedAt: participation?.onboardingCompletedAt ?? null,
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
    if (error instanceof NoActiveEditionError) {
      return NextResponse.json({ error: "Aucune édition active" }, { status: 503 })
    }
    console.error("🚨 Erreur lors de la mise à jour du profil:", error)
    return NextResponse.json(
      { error: "❌ Erreur lors de la mise à jour du profil" },
      { status: 500 }
    )
  }
}
