"use client"

import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { ProgramSection } from "@/features/program/program-section"
import type { MealSlot, TimeSlot, UserProfile } from "@/types"

// ── Fake data ───────────────────────────────────────────────────────

const FAKE_EDITION_YEAR = 2026
const SAT = `${FAKE_EDITION_YEAR}-07-04`
const SUN = `${FAKE_EDITION_YEAR}-07-05`

const iso = (day: string, hm: string) => `${day}T${hm}:00.000Z`

const fakeTimeSlots: TimeSlot[] = [
  { id: "s1", title: "Repas du samedi midi", kind: "MEAL",
    startTime: iso(SAT, "10:00"), endTime: iso(SAT, "12:00") },
  { id: "s2", title: "Conférence", kind: "CONFERENCE",
    startTime: iso(SAT, "12:00"), endTime: iso(SAT, "13:00"),
    conference: {
      id: "c1", title: "Mélusine, la monstrueuse merveilleuse",
      speaker: { id: "u1", name: "Michael Bailly", email: "mb@example.com" },
    } },
  { id: "s3", title: "Conférence", kind: "CONFERENCE",
    startTime: iso(SAT, "14:00"), endTime: iso(SAT, "15:00"),
    conference: {
      id: "c2",
      title: "On parle de Psychiatrie : faut-il stériliser les borderlines ? Les psychotiques sont-ils soignables ?",
      speaker: { id: "u2", name: "Romain Ghio", email: "rg@example.com" },
    } },
  { id: "s4", title: "Conférence", kind: "CONFERENCE",
    startTime: iso(SAT, "16:00"), endTime: iso(SAT, "17:00"),
    conference: {
      id: "c3", title: "Les sciences comme base pour définir nos valeurs",
      speaker: { id: "u3", name: "J. C.", email: "jc@example.com" },
    } },
  { id: "s5", title: "Repas du samedi soir", kind: "MEAL",
    startTime: iso(SAT, "18:00"), endTime: iso(SAT, "20:00") },

  { id: "d1", title: "Brunch du dimanche", kind: "MEAL",
    startTime: iso(SUN, "06:00"), endTime: iso(SUN, "08:00") },
  { id: "d2", title: "Conférence", kind: "CONFERENCE",
    startTime: iso(SUN, "08:00"), endTime: iso(SUN, "09:00"),
    conference: {
      id: "c4", title: "L'art nouveau",
      speaker: { id: "u4", name: "Raphaëlle Balthazar", email: "rb@example.com" },
    } },
  { id: "d3", title: "Conférence", kind: "CONFERENCE",
    startTime: iso(SUN, "10:00"), endTime: iso(SUN, "11:00"),
    conference: {
      id: "c5", title: "À quel point le cerveau est-il malléable ?",
      speaker: { id: "u5", name: "Eva", email: "eva@example.com" },
    } },
  { id: "d4", title: "Déjeuner du dimanche", kind: "MEAL",
    startTime: iso(SUN, "11:00"), endTime: iso(SUN, "13:00") },
  { id: "d5", title: "Dimanche Première de l'aprèm", kind: "OTHER",
    startTime: iso(SUN, "13:00"), endTime: iso(SUN, "14:00") },
  { id: "d6", title: "Dimanche Deuxième de l'aprèm", kind: "OTHER",
    startTime: iso(SUN, "15:00"), endTime: iso(SUN, "16:00") },
]

const fakeUser: UserProfile = {
  id: "preview-user",
  name: "Sébastien Pingal",
  email: "preview@example.com",
  role: "ADMIN",
  wantsToSpeak: true,
  isAttending: true,
  attendanceDays: "BOTH",
  sleepsOnSite: true,
  willPayInCash: false,
  hasPaid: false,
  paidAmount: null,
  onboardingCompletedAt: new Date().toISOString(),
  conferences: [],
  edition: {
    id: "preview-edition",
    name: "Édition 2026",
    startDate: iso(SAT, "00:00"),
    endDate: iso(SUN, "23:59"),
    participantCount: 1,
    registrationDeadline: null,
    isRegistrationClosed: false,
  },
}

const fakeMeals: MealSlot[] = [
  { id: "s1", title: "Repas du samedi midi", description: null, price: 5,
    startTime: iso(SAT, "10:00"), endTime: iso(SAT, "12:00"), status: "PRESENT" },
  { id: "s5", title: "Repas du samedi soir", description: null, price: 0,
    startTime: iso(SAT, "18:00"), endTime: iso(SAT, "20:00"), status: null },
  { id: "d1", title: "Brunch du dimanche", description: null, price: 0,
    startTime: iso(SUN, "06:00"), endTime: iso(SUN, "08:00"), status: null },
]

// ── Page ────────────────────────────────────────────────────────────

export default function ProgrammePreviewPage() {
  const qc = useQueryClient()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    qc.setQueryData(queryKeys.timeslots, fakeTimeSlots)
    setReady(true)
  }, [qc])

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-4 text-xs text-warn bg-warn-bg border border-warn-border rounded-lg px-3 py-2 inline-block">
          Aperçu statique avec fausses données — route non listée dans la nav.
        </div>
        {ready && (
          <ProgramSection
            user={fakeUser}
            meals={fakeMeals}
            onNavigate={(t) => alert(`Naviguer vers : ${t}`)}
          />
        )}
      </div>
    </div>
  )
}
