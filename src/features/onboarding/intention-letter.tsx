import { cn } from "@/lib/utils"

/**
 * Contenu de la lettre d'intention — nos valeurs, l'esprit du weekend.
 * Réutilisé par la première étape de l'onboarding (`steps/intention-step.tsx`)
 * et par la page dédiée `/lettre-intention`.
 *
 * TODO: remplacer le lorem ipsum par le texte définitif.
 */
export function IntentionLetterContent({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 text-left leading-relaxed", className)}>
      <p className="text-muted-foreground">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris.
      </p>
      <p className="text-muted-foreground">
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
        dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
        proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </p>
      <p className="text-muted-foreground">
        Sed ut perspiciatis unde omnis iste natus error sit voluptatem
        accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab
        illo inventore veritatis et quasi architecto beatae vitae dicta sunt
        explicabo.
      </p>
      <p className="font-medium" style={{ color: "var(--ink)" }}>
        Avec toute notre amitié champêtre,<br />
        L&apos;équipe du Congrès
      </p>
    </div>
  )
}
