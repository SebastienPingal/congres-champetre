import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveEdition, NoActiveEditionError, getRegistrationDeadline, isRegistrationClosed, RegistrationClosedError } from "@/lib/edition"
import { sanitizeDietaryNotes, sanitizeDietaryRestrictions } from "@/lib/dietary"
import { buildParticipationUpdate, clearMealRegistrations, upsertParticipation } from "@/lib/participation"
import { getSecretSantaOptInError, isSecretSantaDrawn } from "@/lib/secret-santa"
import type { Edition } from "@prisma/client"

async function buildEditionInfo(edition: Edition) {
  const [participantCount, secretSantaDrawn] = await Promise.all([
    prisma.editionParticipation.count({ where: { editionId: edition.id, isAttending: true } }),
    isSecretSantaDrawn(edition.id),
  ])
  return {
    id: edition.id,
    name: edition.name,
    startDate: edition.startDate,
    endDate: edition.endDate,
    participantCount,
    registrationDeadline: getRegistrationDeadline(edition),
    isRegistrationClosed: isRegistrationClosed(edition),
    secretSantaEnabled: edition.secretSantaEnabled,
    secretSantaDrawn,
  }
}

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
        dietaryRestrictions: true,
        dietaryNotes: true,
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

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      wantsToSpeak: user.wantsToSpeak ?? null,
      dietaryRestrictions: user.dietaryRestrictions,
      dietaryNotes: user.dietaryNotes,
      createdAt: user.createdAt,
      conferences: user.conferences,
      isAttending: participation?.isAttending ?? null,
      attendanceDays: participation?.attendanceDays ?? "NONE",
      sleepsOnSite: participation?.sleepsOnSite ?? null,
      willPayInCash: participation?.willPayInCash ?? false,
      hasPaid: participation?.hasPaid ?? false,
      paidAmount: participation?.paidAmount ?? null,
      supportAmount: participation?.supportAmount ?? null,
      wantsSecretSanta: participation?.wantsSecretSanta ?? null,
      onboardingCompletedAt: participation?.onboardingCompletedAt ?? null,
      edition: await buildEditionInfo(activeEdition),
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

    const touchesParticipation =
      "isAttending" in body ||
      "attendanceDays" in body ||
      "sleepsOnSite" in body ||
      "wantsToSpeak" in body
    if (touchesParticipation && isRegistrationClosed(activeEdition)) {
      throw new RegistrationClosedError()
    }

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

    // Régime alimentaire : porté par le User, hors participation — reste
    // modifiable après la fermeture des inscriptions (utile aux organisateurs).
    if ("dietaryRestrictions" in body || "dietaryNotes" in body) {
      await prisma.user.update({
        where: { id: sessionUser.id },
        data: {
          ...("dietaryRestrictions" in body && {
            dietaryRestrictions: sanitizeDietaryRestrictions(body.dietaryRestrictions),
          }),
          ...("dietaryNotes" in body && { dietaryNotes: sanitizeDietaryNotes(body.dietaryNotes) }),
        },
      })
    }

    // Inscription au Secret Santa : hors fermeture des inscriptions, mais
    // verrouillée tant que l'admin ne l'a pas ouvert et dès que le tirage a eu lieu.
    if ("wantsSecretSanta" in body) {
      if (typeof body.wantsSecretSanta !== "boolean" && body.wantsSecretSanta !== null) {
        return NextResponse.json({ error: "📝 Valeur wantsSecretSanta invalide" }, { status: 400 })
      }
      const secretSantaError = await getSecretSantaOptInError(activeEdition)
      if (secretSantaError) {
        return NextResponse.json({ error: secretSantaError }, { status: 409 })
      }
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
      // Ne plus venir efface les repas cochés : un non-participant ne peut pas
      // rester inscrit à un repas (et ne doit donc plus rien).
      if (participationResult.data.isAttending === false) {
        await clearMealRegistrations(sessionUser.id, activeEdition.id)
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        wantsToSpeak: true,
        dietaryRestrictions: true,
        dietaryNotes: true,
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

    return NextResponse.json({
      message: "✅ Profil mis à jour",
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        role: user?.role,
        wantsToSpeak: user?.wantsToSpeak ?? null,
        dietaryRestrictions: user?.dietaryRestrictions ?? [],
        dietaryNotes: user?.dietaryNotes ?? null,
        conferences: user?.conferences,
        isAttending: participation?.isAttending ?? null,
        attendanceDays: participation?.attendanceDays ?? "NONE",
        sleepsOnSite: participation?.sleepsOnSite ?? null,
        willPayInCash: participation?.willPayInCash ?? false,
        hasPaid: participation?.hasPaid ?? false,
        paidAmount: participation?.paidAmount ?? null,
        supportAmount: participation?.supportAmount ?? null,
        wantsSecretSanta: participation?.wantsSecretSanta ?? null,
        onboardingCompletedAt: participation?.onboardingCompletedAt ?? null,
        edition: await buildEditionInfo(activeEdition),
      },
    })
  } catch (error) {
    if (error instanceof NoActiveEditionError) {
      return NextResponse.json({ error: "Aucune édition active" }, { status: 503 })
    }
    if (error instanceof RegistrationClosedError) {
      return NextResponse.json({ error: "🔒 Les inscriptions sont fermées" }, { status: 409 })
    }
    console.error("🚨 Erreur lors de la mise à jour du profil:", error)
    return NextResponse.json(
      { error: "❌ Erreur lors de la mise à jour du profil" },
      { status: 500 }
    )
  }
}
