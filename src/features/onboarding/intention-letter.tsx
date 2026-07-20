import { cn } from "@/lib/utils"

/**
 * Contenu de la lettre d'intention — nos valeurs, l'esprit du weekend.
 * Réutilisé par la première étape de l'onboarding (`steps/intention-step.tsx`)
 * et par la modale (`intention-letter-modal.tsx`).
 */
export function IntentionLetterContent({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 text-left leading-relaxed", className)}>
      <p className="font-medium" style={{ color: "var(--ink)" }}>
        Chers amis,
      </p>

      <p className="text-muted-foreground">
        Le Congrès Champêtre est un moment que nous souhaitons placer sous le
        signe de la rencontre, du partage et de la découverte mutuelle.
      </p>

      <p className="text-muted-foreground">
        Nous souhaitons proposer un espace d’échange où chacun peut vivre
        l’opportunité de montrer un petit bout de son monde intérieur, en nous
        partageant un sujet d’intérêt, et autour duquel nous pourrons ensuite
        réfléchir et communier.
      </p>

      <p className="text-muted-foreground">
        Cet enrichissement mutuel qui passe par la présence physique et la
        parole est une pratique qui nous tient à cœur, et que nous voulons
        protéger.
      </p>

      <p className="text-muted-foreground">
        Pour encadrer ces partages, nous souhaitons également administrer avec
        vous une ambiance communautaire, dans la simplicité des partages de
        repas et de moments de célébration, de joie, et de fête.
      </p>

      <p className="text-muted-foreground">
        Pour que chacun puisse profiter pleinement de cette parenthèse, nous
        aimerions vous proposer quelques habitudes qui nous semblent favoriser
        ces moments de convivialité.
      </p>

      <p className="text-muted-foreground">
        Tout d’abord, nous vous invitons, dans la mesure du possible, à vivre ce
        week-end sans écrans. L’idée est de privilégier les échanges avec les
        personnes présentes, de profiter pleinement de l’instant et de faire de
        cette rencontre un temps un peu à part.
      </p>

      <p className="text-muted-foreground">
        Pour faciliter cette démarche, nous mettrons à disposition différents
        supports pour les conférences (fiches plastifiées, ardoises, etc.).
      </p>

      <p className="text-muted-foreground">
        Si vous avez un besoin particulier, n’hésitez surtout pas à nous en
        parler : nous serons heureux de trouver avec vous la solution la plus
        adaptée.
      </p>

      <p className="text-muted-foreground">
        Dans le même esprit, les repas font pleinement partie de l’expérience
        que nous souhaitons partager. Nous avons imaginé un menu commun afin de
        nous retrouver autour de la même table, au même moment, dans un esprit
        de convivialité.
      </p>

      <p className="text-muted-foreground">
        Si vous savez que vous ne pourrez pas participer à l’un des repas, nous
        vous remercions de l’anticiper afin que l’organisation reste la plus
        fluide possible.
      </p>

      <p className="text-muted-foreground">
        Et si cette difficulté est liée à un régime alimentaire, à une contrainte
        de santé ou à une question de budget, surtout, faites-nous signe. Nous
        ferons de notre mieux pour trouver une solution avec vous, afin que
        chacun puisse prendre pleinement part à ces moments de partage.
      </p>

      <p className="font-medium" style={{ color: "var(--ink)" }}>
        La perspective de réitérer l’évènement nous met en joie, nous avons hâte
        de vivre ce week-end avec vous !
      </p>

      <p className="font-medium" style={{ color: "var(--ink)" }}>
        Signé Raphaëlle et Sébastien
      </p>
    </div>
  )
}
