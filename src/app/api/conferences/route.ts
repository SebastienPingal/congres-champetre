import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveEdition, NoActiveEditionError } from "@/lib/edition"

export async function GET() {
  try {
    const activeEdition = await getActiveEdition()

    const conferences = await prisma.conference.findMany({
      where: { editionId: activeEdition.id },
      include: {
        speaker: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        timeSlot: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(conferences)
  } catch (error) {
    if (error instanceof NoActiveEditionError) {
      return NextResponse.json({ error: "Aucune édition active" }, { status: 503 })
    }
    console.error("🚨 Erreur lors de la récupération des conférences:", error)
    return NextResponse.json(
      { error: "❌ Erreur lors de la récupération des conférences" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireUser()
    if (error) return error

    const { title, description, timeSlotId, speakerId } = await request.json()

    if (!title) {
      return NextResponse.json(
        { error: "📝 Le titre est requis" },
        { status: 400 }
      )
    }

    const activeEdition = await getActiveEdition()

    const isAdmin = user.role === "ADMIN"

    if (!isAdmin && speakerId && speakerId !== user.id) {
      return NextResponse.json(
        { error: "⚠️ Vous ne pouvez créer que votre propre conférence" },
        { status: 403 }
      )
    }

    const targetSpeakerId = isAdmin && speakerId ? speakerId : user.id

    if (isAdmin && speakerId) {
      const speaker = await prisma.user.findUnique({
        where: { id: speakerId },
        select: { id: true },
      })

      if (!speaker) {
        return NextResponse.json(
          { error: "👤 Conférencier introuvable" },
          { status: 404 }
        )
      }
    }

    const existingConference = await prisma.conference.findFirst({
      where: {
        speakerId: targetSpeakerId,
        editionId: activeEdition.id,
      },
    })

    if (existingConference) {
      return NextResponse.json(
        { error: "🎤 Vous avez déjà proposé une conférence pour cette édition" },
        { status: 400 }
      )
    }

    if (timeSlotId) {
      const timeSlot = await prisma.timeSlot.findUnique({
        where: { id: timeSlotId },
        include: { conference: true },
      })

      if (!timeSlot) {
        return NextResponse.json(
          { error: "⏰ Créneau non trouvé" },
          { status: 404 }
        )
      }

      if (timeSlot.conference || timeSlot.kind !== "CONFERENCE") {
        return NextResponse.json(
          { error: "⚠️ Ce créneau n'est plus disponible" },
          { status: 400 }
        )
      }
    }

    const conference = await prisma.conference.create({
      data: {
        title,
        description,
        speakerId: targetSpeakerId,
        editionId: activeEdition.id,
        timeSlotId: timeSlotId || null,
      },
      include: {
        speaker: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        timeSlot: true,
      },
    })

    // ⚠ Couplage : `wantsToSpeak ⇔ conferences.length > 0` pour l'édition active.
    // Voir REFACTOR.md §R8 et `/api/user/profile` PATCH (qui supprime les conférences
    // si wantsToSpeak passe à false).
    await prisma.user.update({
      where: { id: targetSpeakerId },
      data: { wantsToSpeak: true },
    })

    return NextResponse.json(
      {
        message: "✅ Conférence créée avec succès",
        conference,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof NoActiveEditionError) {
      return NextResponse.json({ error: "Aucune édition active" }, { status: 503 })
    }
    console.error("🚨 Erreur lors de la création de la conférence:", error)
    return NextResponse.json(
      { error: "❌ Erreur lors de la création de la conférence" },
      { status: 500 }
    )
  }
}
