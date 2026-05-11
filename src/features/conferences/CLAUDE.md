# features/conferences

Components for conference proposal management.

| File | Component | Purpose |
|---|---|---|
| `conferences-section.tsx` | `ConferencesSection` | Speaker toggle checkbox + conference card (create/edit/delete orchestration) |
| `conference-edit-form.tsx` | `ConferenceEditForm` | Edit existing conference: same fields, pre-populated |
| `conference-delete-button.tsx` | `ConferenceDeleteButton` | Destructive delete with window.confirm |

**Note:** The creation form (`ConferenceForm`) lives in `src/components/conference-form.tsx` so it can be reused by the onboarding wizard without violating the feature isolation rule (features must not import from other features). `ConferencesSection` imports it from `@/components/conference-form`.

**Data:** All mutations via `src/hooks/use-conferences.ts` (`useCreateConference`, `useUpdateConference`, `useDeleteConference`). Time slots via `useTimeSlots()`. On success, both `userProfile` and `timeslots` queries are invalidated.

**Constraint:** One conference per user per edition (enforced server-side in `/api/conferences`).

**Section ID:** `#section-conferences`
