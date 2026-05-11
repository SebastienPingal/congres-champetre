# features/program

Read-only weekend schedule display.

| File | Component | Purpose |
|---|---|---|
| `program-section.tsx` | `ProgramSection` | Grouped-by-day schedule (max 2 days), color-coded by slot kind |

**Data:** `useTimeSlots()` from `src/hooks/use-time-slots.ts`. The same query is also used by the conference forms, so data is shared from cache (no extra fetch).

**Color coding:**
- CONFERENCE → violet
- MEAL → amber
- BREAK → sky blue
- OTHER → gray

**Slot display:** Conference slots show title + speaker name. Meal slots show time only. Other slots show title.
