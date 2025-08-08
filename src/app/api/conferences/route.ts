import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Récupérer toutes les conférences
export async function GET() {
  try {
    const conferences = await prisma.conference.findMany({
      include: {
        speaker: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        timeSlot: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(conferences)
  } catch (error) {
    console.error("🚨 Erreur lors de la récupération des conférences:", error)
    return NextResponse.json(
      { error: "❌ Erreur lors de la récupération des conférences" },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle conférence
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "🔒 Non authentifié" },
        { status: 401 }
      )
    }

    const { title, description, timeSlotId } = await request.json()

    if (!title) {
      return NextResponse.json(
        { error: "📝 Le titre est requis" },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur a déjà une conférence
    const existingConference = await prisma.conference.findFirst({
      where: {
        speakerId: session.user.id
      }
    })

    if (existingConference) {
      return NextResponse.json(
        { error: "🎤 Vous avez déjà proposé une conférence" },
        { status: 400 }
      )
    }

    // Si un créneau est spécifié, vérifier qu'il est disponible
    if (timeSlotId) {
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

      if (!timeSlot.isAvailable || timeSlot.conference || timeSlot.kind !== 'CONFERENCE') {
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
        speakerId: session.user.id,
        timeSlotId: timeSlotId || null,
      },
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

    // Mettre à jour le statut wantsToSpeak de l'utilisateur
    await prisma.user.update({
      where: { id: session.user.id },
      data: { wantsToSpeak: true }
    })

    return NextResponse.json(
      { 
        message: "✅ Conférence créée avec succès",
        conference 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("🚨 Erreur lors de la création de la conférence:", error)
    return NextResponse.json(
      { error: "❌ Erreur lors de la création de la conférence" },
      { status: 500 }
    )
  }
}