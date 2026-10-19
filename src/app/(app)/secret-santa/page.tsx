"use client"

import { Gift } from "lucide-react"
import { PageShell } from "@/components/page-shell"
import { SecretSantaSection } from "@/features/secret-santa/secret-santa-section"

export default function SecretSantaPage() {
  return (
    <PageShell title="Secret Santa" icon={Gift}>
      {() => <SecretSantaSection />}
    </PageShell>
  )
}
