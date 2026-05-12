import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

// PATCH - Mettre à jour une conférence (assignation de créneau)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user, error } = await requireUser()
    if (error) return error

    const { timeSlotId, title, description } = await request.json()

    // Récupérer la conférence existante
    const existingConference = await prisma.conference.findUnique({
      where: { id },
      include: { speaker: true }
    })

    if (!existingConference) {
      return NextResponse.json(
        { error: "🎤 Conférence non trouvée" },
        { status: 404 }
      )
    }

    // Vérifier que l'utilisateur est le propriétaire OU admin
    const isOwner = existingConference.speakerId === user.id
    const isAdmin = user.role === "ADMIN"
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "⚠️ Accès refusé" },
        { status: 403 }
      )
    }

    const updateData: Prisma.ConferenceUpdateInput = {}

    // Si on change le titre ou la description
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description

    // Si on change le créneau
    if (timeSlotId !== undefined) {
      if (timeSlotId) {
        // Vérifier que le nouveau créneau est disponible
        const timeSlot = await prisma.timeSlot.findUnique({
          where: { id: timeSlotId },
          include: { conference: true }
        })

        if (!timeSlot) {
          return NextResponse.json(
            { error: "⏰ Créneau non trouvé" },
            { status: 404 }
          )
        }

        // Disponible si type CONFERENCE et (aucune conférence) ou (déjà assigné à cette conférence)
        if (timeSlot.kind !== 'CONFERENCE' || (timeSlot.conference && timeSlot.conference.id !== id)) {
          return NextResponse.json(
            { error: "⚠️ Ce créneau n'est plus disponible" },
            { status: 400 }
          )
        }
        updateData.timeSlot = {
          connect: { id: timeSlotId as string }
        }
      } else {
        updateData.timeSlot = { disconnect: true }
      }
    }

    const conference = await prisma.conference.update({
      where: { id },
      data: updateData,
      include: {
        speaker: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        timeSlot: true
      }
    })

    return NextResponse.json(
      {
        message: "✅ Conférence mise à jour avec succès",
        conference
      }
    )
  } catch (error) {
    console.error("🚨 Erreur lors de la mise à jour de la conférence:", error)
    return NextResponse.json(
      { error: "❌ Erreur lors de la mise à jour de la conférence" },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une conférence
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user, error } = await requireUser()
    if (error) return error

    // Récupérer la conférence existante
    const existingConference = await prisma.conference.findUnique({
      where: { id }
    })

    if (!existingConference) {
      return NextResponse.json(
        { error: "🎤 Conférence non trouvée" },
        { status: 404 }
      )
    }

    // Vérifier que l'utilisateur est le propriétaire OU admin
    const isOwner = existingConference.speakerId === user.id
    const isAdmin = user.role === "ADMIN"
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "⚠️ Accès refusé" },
        { status: 403 }
      )
    }

    await prisma.conference.delete({
      where: { id }
    })

    // ⚠ Couplage : `wantsToSpeak ⇔ conferences.length > 0` pour l'édition active.
    // En pratique l'utilisateur n'a qu'une conférence par édition, donc la suppression
    // ramène wantsToSpeak à false. Voir REFACTOR.md §R8.
    await prisma.user.update({
      where: { id: existingConference.speakerId },
      data: { wantsToSpeak: false }
    })

    return NextResponse.json(
      { message: "✅ Conférence supprimée avec succès" }
    )
  } catch (error) {
    console.error("🚨 Erreur lors de la suppression de la conférence:", error)
    return NextResponse.json(
      { error: "❌ Erreur lors de la suppression de la conférence" },
      { status: 500 }
    )
  }
}