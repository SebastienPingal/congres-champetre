# src/features

Feature-sliced folder. Each subfolder owns one domain: components, helpers, and anything specific to that feature.

| Folder | Domain |
|---|---|
| `participation/` | Presence RSVP, attendance days, sleeping on-site, edition info card, alert banner |
| `meals/` | Meal registration toggles (PRESENT/ABSENT), payment mode selector, Stripe card payment |
| `conferences/` | Conference proposal form, edit form, delete button, speaker toggle section |
| `onboarding/` | First-visit step-by-step modal (4 questions, "je ne sais pas encore" on each) |
| `program/` | Weekend schedule display (read-only, grouped by day) |

**Dependency rule:** Feature components import from `src/hooks/` but NOT from other features. Shared UI goes in `src/components/ui/`.

**Layout du dashboard :** les `<X>Section` racine sont des blocs **plats** (`<section className="flex flex-col gap-X">`) — pas de `Card` enveloppante. Le titre de la section est rendu par le dashboard (icône + nom au-dessus). Chaque section commence typiquement par une ligne `description (gauche) + badge de statut (droite)`. Les listes internes (repas, conférences, programme) utilisent `divide-y rounded-lg border bg-white/60` plutôt que des cartes encapsulées.

Each feature folder has its own `CLAUDE.md` with specifics.
