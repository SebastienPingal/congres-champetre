import { IntentionLetterContent } from "@/features/onboarding/intention-letter"

export const metadata = {
  title: "Lettre d'intention — Congrès Champêtre",
}

export default function LettreIntentionPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 lg:py-12">
      <div
        className="rounded-2xl border bg-surface p-6 sm:p-10"
        style={{ borderColor: "var(--line)" }}
      >
        <div
          className="font-mono uppercase mb-2"
          style={{ letterSpacing: "0.22em", color: "var(--ink-3)", fontSize: 10 }}
        >
          Congrès Champêtre
        </div>
        <h1
          className="font-display text-[26px] sm:text-[32px] mb-6"
          style={{ fontWeight: 600, letterSpacing: "-0.02em", color: "var(--ink)" }}
        >
          Lettre d&apos;intention
        </h1>
        <IntentionLetterContent />
      </div>
    </div>
  )
}
