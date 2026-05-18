"use client"

import { UserCheck } from "lucide-react"
import { PageShell } from "@/components/page-shell"
import { PresenceSection } from "@/features/participation/presence-section"

export default function PresencePage() {
  return (
    <PageShell title="Présence" icon={UserCheck}>
      {({ user }) => <PresenceSection user={user} />}
    </PageShell>
  )
}
