import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveEdition, NoActiveEditionError } from "@/lib/edition"
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

    if (typeof body.isAttending === "boolean" || body.isAttending === null) {
      participationData.isAttending = body.isAttending
      if (body.isAttending === false) {
        participationData.attendanceDays = "NONE"
        participationData.sleepsOnSite = null
      } else if (body.isAttending === null) {
        participationData.attendanceDays = "NONE"
        participationData.sleepsOnSite = null
      }
    }

    if (typeof body.attendanceDays === "string") {
      const allowed = ["NONE", "DAY1", "DAY2", "BOTH", "UNKNOWN"]
      if (allowed.includes(body.attendanceDays)) {
        participationData.attendanceDays = body.attendanceDays
        if (body.attendanceDays !== "NONE" && body.attendanceDays !== "UNKNOWN") {
          participationData.isAttending = true
        }
      }
    }

    if (typeof body.sleepsOnSite === "boolean" || body.sleepsOnSite === null) {
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
        isAttending: (participationData.isAttending as boolean | null) ?? null,
        attendanceDays: (participationData.attendanceDays as AttendanceDays) ?? "NONE",
        sleepsOnSite: (participationData.sleepsOnSite as boolean | null) ?? null,
        onboardingCompletedAt: participationData.onboardingCompletedAt as Date,
      },
      update: participationData,
    })

    if (typeof body.wantsToSpeak === "boolean" || body.wantsToSpeak === null) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { wantsToSpeak: body.wantsToSpeak },
      })
    }

    return NextResponse.json({ message: "✅ Onboarding complété" })
  } catch (error) {
    if (error instanceof NoActiveEditionError) {
      return NextResponse.json({ error: "Aucune édition active" }, { status: 503 })
    }
    console.error("🚨 Erreur onboarding:", error)
    return NextResponse.json({ error: "❌ Erreur lors de l'onboarding" }, { status: 500 })
  }
}
