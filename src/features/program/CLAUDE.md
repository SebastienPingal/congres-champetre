# features/program

Affichage du programme du weekend, façon livret typographique.

| File | Component | Purpose |
|---|---|---|
| `program-section.tsx` | `ProgramSection` | Vue complète : titre, méta, alerte parchemin, deux Jours (Jour 1 / Jour 2), liste des intervenants, footer ornemental |

**Données :**
- `useTimeSlots()` (`src/hooks/use-time-slots.ts`) pour les créneaux
- `user: UserProfile` et `meals: MealSlot[]` passés en prop par le dashboard
- `onNavigate?: (target) => void` : callback utilisé par l'alerte parchemin pour changer d'onglet (`presence | meals | payment | conferences`)

**Layout :** la `ProgramSection` est un **bloc plein** (`bg-card`) qui remplace toute la chrome standard du dashboard (titre + `EditionInfoCard` + `AlertBanner`). Sur ≥ `xl`, les deux Jours s'affichent en diptyque (1fr 1px 1fr) ; en-dessous, ils s'empilent avec un ornement central.

**Tokens couleur (via `globals.css`) :**
- CONFERENCE → `var(--talk)` (`bg-talk-soft`, `text-talk`)
- MEAL → `var(--meal)` (`bg-meal-soft`, `text-meal`)
- OTHER / autre → `var(--ink-3)`

**Typographies :**
- Titres grands formats / numéraux : `var(--font-display)` (Cormorant Garamond)
- Sous-titres, corps des entrées, intervenants : `var(--font-serif)` (Newsreader)
- Eyebrow, heures de fin, footer : `var(--font-mono)` (JetBrains Mono)
