# features/program

Read-only weekend schedule display.

| File | Component | Purpose |
|---|---|---|
| `program-section.tsx` | `ProgramSection` | Grouped-by-day schedule (max 2 days), color-coded by slot kind |

**Data:** `useTimeSlots()` from `src/hooks/use-time-slots.ts`. The same query is also used by the conference forms, so data is shared from cache (no extra fetch).

**Layout :** section plate (pas de `Card`). Programme rendu en grille 2 colonnes (un jour par colonne), avec liste `<ul>` plate séparée par bordures.

**Code couleur (puce de 2×2px à gauche, pas de fond plein) :**
- CONFERENCE → violet-400
- MEAL → amber-400
- BREAK → sky-400
- OTHER → gray-300

**Slot display:** Conference slots show title + speaker name. Meal slots show time only. Other slots show title.
