# features/onboarding

First-visit onboarding wizard shown as a non-dismissable Dialog.

**Trigger:** `user.onboardingCompletedAt === null` (null means onboarding never completed). Set by `POST /api/onboarding`.

**Files:**
| File | Purpose |
|---|---|
| `onboarding-modal.tsx` | Main modal: step state machine, localStorage persistence, progress bar, "Répondre plus tard" fallback |
| `steps/attending-step.tsx` | "Venez-vous au weekend ?" → yes / no / unknown |
| `steps/days-step.tsx` | "Quels jours ?" (only if attending=yes) → BOTH / DAY1 / DAY2 / unknown |
| `steps/sleeping-step.tsx` | "Dormez-vous sur place ?" → true / false / null |
| `steps/speaking-step.tsx` | "Souhaitez-vous proposer une conférence ?" → true / false / null |
| `steps/conference-step.tsx` | Conference info (only if speaking=yes) — thin wrapper around `ConferenceForm` |

**Step flow:**
- attending=yes → days → sleeping → meals (si repas disponibles) → speaking → [conference si speaking=yes] → complete
- attending=no/unknown → (skip days/sleeping/meals) → speaking → [conference si speaking=yes] → complete

The meals step is skipped entirely if there are no MEAL-type time slots in the active edition.

**localStorage persistence:** Progress (`currentStep` + `answers`) is saved to `onboarding_progress_{userId}` at every state change. Restored on mount. Cleared when onboarding completes (success callback of `POST /api/onboarding`).

**Save strategy:** Each answer immediately calls `useUpdateProfile()` for partial saves. The final step calls `POST /api/onboarding` which sets `onboardingCompletedAt = now()` and invalidates the profile query — modal disappears.

**"Répondre plus tard":** Calls `POST /api/onboarding` immediately with whatever was answered so far, marking onboarding complete. Modal won't reappear.

## ConferenceStep and shared ConferenceForm

`ConferenceStep` is intentionally a thin wrapper — it renders `ConferenceForm` with `withCard={false}` (no Card wrapper needed inside a Dialog) and adds a "Remplir plus tard" skip button. The actual form logic (title, description, time slot selection, API call via `useCreateConference`) lives entirely in `ConferenceForm`.

`ConferenceForm` is in `src/components/conference-form.tsx` rather than `src/features/conferences/` because the feature isolation rule forbids inter-feature imports. Both `ConferencesSection` (conferences feature) and `ConferenceStep` (onboarding feature) import it from `@/components/conference-form`.

When `ConferenceForm` calls `onConferenceCreated` (after a successful POST to `/api/conferences`), or when the user skips the step, the modal calls `POST /api/onboarding` to mark onboarding as done.
