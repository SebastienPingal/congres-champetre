# features/conferences

Components for conference proposal management.

| File | Component | Purpose |
|---|---|---|
| `conferences-section.tsx` | `ConferencesSection` | Speaker toggle checkbox + conference card (create/edit/delete orchestration) |
| `conference-form.tsx` | `ConferenceForm` | Create conference: title, description, optional time slot selection |
| `conference-edit-form.tsx` | `ConferenceEditForm` | Edit existing conference: same fields, pre-populated |
| `conference-delete-button.tsx` | `ConferenceDeleteButton` | Destructive delete with window.confirm |

**Data:** All mutations via `src/hooks/use-conferences.ts` (`useCreateConference`, `useUpdateConference`, `useDeleteConference`). Time slots via `useTimeSlots()`. On success, both `userProfile` and `timeslots` queries are invalidated.

**Constraint:** One conference per user per edition (enforced server-side in `/api/conferences`).

**Section ID:** `#section-conferences`
