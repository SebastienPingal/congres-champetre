"use client"

import { Mic } from "lucide-react"
import { PageShell } from "@/components/page-shell"
import { ConferencesSection } from "@/features/conferences/conferences-section"

export default function ConferencesPage() {
  return (
    <PageShell title="Conférences" icon={Mic}>
      {({ user }) => {
        if (!user.isAttending) {
          return (
            <p className="text-sm text-muted-foreground">
              Confirmez d&apos;abord votre présence pour proposer une conférence.
            </p>
          )
        }
        return <ConferencesSection user={user} />
      }}
    </PageShell>
  )
}
