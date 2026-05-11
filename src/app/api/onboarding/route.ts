import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveEdition } from "@/lib/edition"
import type { AttendanceDays } from "@prisma/client"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "🔒 Non authentifié" }, { status: 401 })
    }

    const body = await request.json()
    const activeEdition = await getActiveEdition()

    const participationData: Record<string, unknown> = {
      onboardingCompletedAt: new Date(),
    }

    if (typeof body.isAttending === "boolean") {
      participationData.isAttending = body.isAttending
      if (!body.isAttending) {
        participationData.attendanceDays = "NONE"
        participationData.sleepsOnSite = false
      }
    }

    if (typeof body.attendanceDays === "string") {
      const allowed = ["NONE", "DAY1", "DAY2", "BOTH"]
      if (allowed.includes(body.attendanceDays)) {
        participationData.attendanceDays = body.attendanceDays
        if (body.attendanceDays !== "NONE") {
          participationData.isAttending = true
        }
      }
    }

    if (typeof body.sleepsOnSite === "boolean") {
      participationData.sleepsOnSite = body.sleepsOnSite
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
        attendanceDays: (participationData.attendanceDays as AttendanceDays) ?? "NONE",
        sleepsOnSite: (participationData.sleepsOnSite as boolean) ?? false,
        onboardingCompletedAt: participationData.onboardingCompletedAt as Date,
      },
      update: participationData,
    })

    if (typeof body.wantsToSpeak === "boolean") {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { wantsToSpeak: body.wantsToSpeak },
      })
    }

    return NextResponse.json({ message: "✅ Onboarding complété" })
  } catch (error) {
    console.error("🚨 Erreur onboarding:", error)
    return NextResponse.json({ error: "❌ Erreur lors de l'onboarding" }, { status: 500 })
  }
}
