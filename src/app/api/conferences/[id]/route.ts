import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH - Mettre à jour une conférence (assignation de créneau)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "🔒 Non authentifié" },
        { status: 401 }
      )
    }

    const { timeSlotId, title, description } = await request.json()
    
    // Récupérer la conférence existante
    const existingConference = await prisma.conference.findUnique({
      where: { id: params.id },
      include: { speaker: true }
    })

    if (!existingConference) {
      return NextResponse.json(
        { error: "🎤 Conférence non trouvée" },
        { status: 404 }
      )
    }

    // Vérifier que l'utilisateur est le propriétaire de la conférence
    if (existingConference.speakerId !== session.user.id) {
      return NextResponse.json(
        { error: "⚠️ Vous ne pouvez modifier que vos propres conférences" },
        { status: 403 }
      )
    }

    let updateData: any = {}

    // Si on change le titre ou la description
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description

    // Si on change le créneau
    if (timeSlotId !== undefined) {
      if (timeSlotId) {
        // Vérifier que le nouveau créneau est disponible
        const timeSlot = await prisma.timeSlot.findUnique({
          where: { id: timeSlotId },
          include: { conferences: true }
        })

        if (!timeSlot) {
          return NextResponse.json(
            { error: "⏰ Créneau non trouvé" },
            { status: 404 }
          )
        }

        if (!timeSlot.isAvailable || (timeSlot.conferences.length > 0 && timeSlot.conferences[0].id !== params.id)) {
          return NextResponse.json(
            { error: "⚠️ Ce créneau n'est plus disponible" },
            { status: 400 }
          )
        }
      }
      
      updateData.timeSlotId = timeSlotId
    }

    const conference = await prisma.conference.update({
      where: { id: params.id },
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
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "🔒 Non authentifié" },
        { status: 401 }
      )
    }

    // Récupérer la conférence existante
    const existingConference = await prisma.conference.findUnique({
      where: { id: params.id }
    })

    if (!existingConference) {
      return NextResponse.json(
        { error: "🎤 Conférence non trouvée" },
        { status: 404 }
      )
    }

    // Vérifier que l'utilisateur est le propriétaire de la conférence
    if (existingConference.speakerId !== session.user.id) {
      return NextResponse.json(
        { error: "⚠️ Vous ne pouvez supprimer que vos propres conférences" },
        { status: 403 }
      )
    }

    await prisma.conference.delete({
      where: { id: params.id }
    })

    // Mettre à jour le statut wantsToSpeak de l'utilisateur
    await prisma.user.update({
      where: { id: session.user.id },
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