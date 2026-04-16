import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveEdition } from "@/lib/edition"

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

    const activeEdition = await getActiveEdition()

    const mealSlots = await prisma.timeSlot.findMany({
      where: { editionId: activeEdition.id, kind: "MEAL", showInRegistration: true },
      orderBy: { startTime: "asc" },
      select: { id: true, title: true, price: true },
    })

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        wantsToSpeak: true,
        createdAt: true,
        updatedAt: true,
        participations: {
          where: { editionId: activeEdition.id },
          take: 1,
        },
        mealRegistrations: {
          where: { timeSlot: { editionId: activeEdition.id, kind: "MEAL" } },
          select: {
            status: true,
            timeSlot: {
              select: { id: true, title: true, price: true },
            },
          },
        },
      },
    })

    const result = users.map((u) => {
      const p = u.participations[0]
      const mealStatuses: Record<string, string> = {}
      for (const mr of u.mealRegistrations) {
        mealStatuses[mr.timeSlot.id] = mr.status
      }
      const presentMeals = u.mealRegistrations.filter((mr) => mr.status === "PRESENT")
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        wantsToSpeak: u.wantsToSpeak,
        isAttending: p?.isAttending ?? false,
        attendanceDays: p?.attendanceDays ?? "NONE",
        sleepsOnSite: p?.sleepsOnSite ?? false,
        hasPaid: p?.hasPaid ?? false,
        willPayInCash: p?.willPayInCash ?? false,
        mealStatuses,
        mealTotal: presentMeals.reduce((sum, mr) => sum + (mr.timeSlot.price ?? 0), 0),
        createdAt: u.createdAt,
        updatedAt: p?.updatedAt ?? u.updatedAt,
      }
    })

    return NextResponse.json({ mealSlots, users: result })
  } catch (error) {
    console.error("🚨 Erreur lors de la récupération des utilisateurs:", error)
    return NextResponse.json({ error: "❌ Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "🔒 Non authentifié" }, { status: 401 })
    }

    const me = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (me?.role !== "ADMIN") {
      return NextResponse.json({ error: "⚠️ Accès refusé - Admin requis" }, { status: 403 })
    }

    const { userId } = await req.json()
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId manquant" }, { status: 400 })
    }

    const activeEdition = await getActiveEdition()
    const editionId = activeEdition.id

    // Retrieve conferences by this user for this edition to unlink their time slots
    const conferences = await prisma.conference.findMany({
      where: { speakerId: userId, editionId },
      select: { id: true, timeSlotId: true },
    })

    await prisma.$transaction([
      // Delete meal registrations for this edition
      prisma.mealRegistration.deleteMany({
        where: {
          userId,
          timeSlot: { editionId },
        },
      }),
      // Delete conferences proposed by this user for this edition
      prisma.conference.deleteMany({
        where: { speakerId: userId, editionId },
      }),
      // Delete edition participation
      prisma.editionParticipation.deleteMany({
        where: { userId, editionId },
      }),
    ])

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    })

    return NextResponse.json({
      message: `Participation de ${user?.name ?? user?.email} supprimée`,
      deletedConferences: conferences.length,
    })
  } catch (error) {
    console.error("🚨 Erreur lors de la suppression de la participation:", error)
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

    const { userId, hasPaid, willPayInCash, mealStatusUpdate } = body as {
      userId?: string
      hasPaid?: boolean
      willPayInCash?: boolean
      mealStatusUpdate?: { timeSlotId: string; status: "PRESENT" | "ABSENT" | null }
    }

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId manquant" }, { status: 400 })
    }

    const activeEdition = await getActiveEdition()

    // Handle meal status update
    if (mealStatusUpdate) {
      const { timeSlotId, status } = mealStatusUpdate
      if (!timeSlotId) {
        return NextResponse.json({ error: "timeSlotId manquant" }, { status: 400 })
      }

      // Verify the time slot belongs to the active edition and is a MEAL
      const slot = await prisma.timeSlot.findFirst({
        where: { id: timeSlotId, editionId: activeEdition.id, kind: "MEAL" },
      })
      if (!slot) {
        return NextResponse.json({ error: "Créneau repas introuvable" }, { status: 404 })
      }

      if (status === null) {
        // Remove the registration
        await prisma.mealRegistration.deleteMany({
          where: { userId, timeSlotId },
        })
      } else {
        await prisma.mealRegistration.upsert({
          where: { userId_timeSlotId: { userId, timeSlotId } },
          create: { userId, timeSlotId, status },
          update: { status },
        })
      }

      return NextResponse.json({ ok: true })
    }

    // Handle participation field updates
    const data: Record<string, boolean> = {}
    if (typeof hasPaid === "boolean") data.hasPaid = hasPaid
    if (typeof willPayInCash === "boolean") data.willPayInCash = willPayInCash

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 })
    }

    const updated = await prisma.editionParticipation.upsert({
      where: {
        userId_editionId: {
          userId,
          editionId: activeEdition.id,
        },
      },
      create: {
        userId,
        editionId: activeEdition.id,
        ...data,
      },
      update: data,
      select: {
        id: true,
        hasPaid: true,
        willPayInCash: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("🚨 Erreur lors de la mise à jour de l'utilisateur:", error)
    return NextResponse.json({ error: "❌ Erreur serveur" }, { status: 500 })
  }
}
