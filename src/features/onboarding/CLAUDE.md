# features/onboarding

First-visit onboarding wizard shown as a non-dismissable Dialog.

**Trigger:** `user.onboardingCompletedAt === null` (null means onboarding never completed). Set by `POST /api/onboarding`.

**Files:**
| File | Purpose |
|---|---|
| `onboarding-modal.tsx` | Main modal: step state machine, progress bar, "Répondre plus tard" fallback |
| `steps/attending-step.tsx` | "Venez-vous au weekend ?" → yes / no / unknown |
| `steps/days-step.tsx` | "Quels jours ?" (only if attending=yes) → BOTH / DAY1 / DAY2 / unknown |
| `steps/sleeping-step.tsx` | "Dormez-vous sur place ?" → true / false / null |
| `steps/speaking-step.tsx` | "Souhaitez-vous proposer une conférence ?" → true / false / null |

**Step flow:**
- attending=yes → days → sleeping → speaking → complete
- attending=no/unknown → (skip days/sleeping) → speaking → complete

**Save strategy:** Each answer immediately calls `useUpdateProfile()` for partial saves. Final step (speaking) calls `POST /api/onboarding` which sets `onboardingCompletedAt = now()` and invalidates the profile query — modal disappears.

**"Répondre plus tard":** Calls `POST /api/onboarding` immediately with whatever was answered so far, marking onboarding complete. Modal won't reappear.
