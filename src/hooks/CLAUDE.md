# src/hooks

React Query hooks for server state. All hooks use query keys from `src/lib/query-keys.ts`.

| File | Purpose |
|---|---|
| `use-user-profile.ts` | `useUserProfile()` — GET `/api/user/profile`; `useUpdateProfile()` — PATCH with optimistic cache update |
| `use-meals.ts` | `useMeals()` — GET `/api/meals`; `useUpdateMealStatus()` — POST with optimistic update |
| `use-time-slots.ts` | `useTimeSlots()` — GET `/api/timeslots`; 60s staleTime (slots change rarely) |
| `use-secret-santa.ts` | `useSecretSanta()` / `useRevealSecretSanta()` (participant) ; `useAdminSecretSanta()`, `useToggleSecretSanta()`, `useDrawSecretSanta()`, `useCancelSecretSanta()`, `useNotifySecretSanta()` (admin). L'inscription passe par `useUpdateProfile({ wantsSecretSanta })`, qui invalide aussi `queryKeys.secretSanta` |
| `use-bug-report.ts` | `useSendBugReport()` — POST multipart `/api/bug-report` ; aucun cache touché |
| `use-conferences.ts` | `useCreateConference()`, `useUpdateConference()`, `useDeleteConference()` — invalidate profile + timeslots on success |

**Pattern:** Mutations call `qc.setQueryData()` for instant UI update (no round-trip GET needed). Mutations that affect multiple queries call `qc.invalidateQueries()` instead.

**Provider:** Hooks require `QueryProvider` to be mounted (set in `src/app/layout.tsx`).
