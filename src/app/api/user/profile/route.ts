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

    const { wantsToSpeak } = await request.json()

    if (typeof wantsToSpeak !== 'boolean') {
      return NextResponse.json(
        { error: "📝 Le statut doit être un booléen" },
        { status: 400 }
      )
    }

    // Si l'utilisateur ne veut plus faire de conférence, supprimer ses conférences
    if (!wantsToSpeak) {
      await prisma.conference.deleteMany({
        where: { speakerId: session.user.id }
      })
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { wantsToSpeak },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        wantsToSpeak: true,
        conferences: {
          include: {
            timeSlot: true
          }
        }
      }
    })

    return NextResponse.json(
      {
        message: wantsToSpeak
          ? "✅ Vous êtes maintenant inscrit comme conférencier"
          : "✅ Vous n'êtes plus inscrit comme conférencier",
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