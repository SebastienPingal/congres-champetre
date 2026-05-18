"use client"

import { Navbar } from "@/components/navbar"
import { OnboardingModal } from "@/features/onboarding/onboarding-modal"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--paper)" }}>
      <Navbar />
      <OnboardingModal />
      {children}
    </div>
  )
}
