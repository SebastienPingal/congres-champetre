# features/conferences

Components for conference proposal management.

| File | Component | Purpose |
|---|---|---|
| `conferences-section.tsx` | `ConferencesSection` | Bloc plat : tri-state « proposer une conférence ? » + liste plate `divide-y` des conférences (create/edit/delete orchestration) |
| `conference-form.tsx` | `ConferenceForm` | Create conference: title, description, optional time slot selection |
| `conference-edit-form.tsx` | `ConferenceEditForm` | Edit existing conference: same fields, pre-populated |
| `conference-delete-button.tsx` | `ConferenceDeleteButton` | Destructive delete with window.confirm |

**Layout :** section plate (pas de `Card`). Badge statut subtil : amber « À compléter » si `wantsToSpeak && conferences.length === 0`, green « Inscrit » si déjà soumise.

**Data:** All mutations via `src/hooks/use-conferences.ts` (`useCreateConference`, `useUpdateConference`, `useDeleteConference`). Time slots via `useTimeSlots()`. On success, both `userProfile` and `timeslots` queries are invalidated.

**Constraint:** One conference per user per edition (enforced server-side in `/api/conferences`).

**Section ID:** `#section-conferences`
