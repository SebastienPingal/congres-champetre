# features/onboarding

First-visit onboarding wizard shown as a non-dismissable Dialog.

**Trigger:** `user.onboardingCompletedAt === null` (null means onboarding never completed). Set by `POST /api/onboarding`.

**Files:**
| File | Purpose |
|---|---|
| `onboarding-modal.tsx` | Main modal: step state machine, progress bar, "Répondre plus tard" fallback |
| `intention-letter.tsx` | `IntentionLetterContent` — texte de la lettre d'intention (nos valeurs). Réutilisé par la première étape ET la page `/lettre-intention` (`src/app/(app)/lettre-intention/page.tsx`, aussi liée dans la navbar). Lorem ipsum pour l'instant. |
| `steps/intention-step.tsx` | Première étape : affiche la lettre d'intention + bouton chaleureux "C'est parti" (pas une question, juste un accueil) |
| `steps/attending-step.tsx` | "Venez-vous au weekend ?" → yes / no / unknown |
| `steps/days-step.tsx` | "Quels jours ?" (only if attending=yes) → BOTH / DAY1 / DAY2 / unknown |
| `steps/sleeping-step.tsx` | "Dormez-vous sur place ?" → true / false / null |
| `steps/speaking-step.tsx` | "Souhaitez-vous proposer une conférence ?" → true / false / null |

**Step flow:**
- intention (lettre d'intention, accueil) → attending → …
- attending=yes → days → sleeping → meals (si repas disponibles) → speaking → complete
- attending=no/unknown → (skip days/sleeping/meals) → speaking → complete

The meals step is skipped entirely if there are no MEAL-type time slots in the active edition.

**Save strategy:** Each answer immediately calls `useUpdateProfile()` for partial saves. Final step (speaking) calls `POST /api/onboarding` which sets `onboardingCompletedAt = now()` and invalidates the profile query — modal disappears.

**"Répondre plus tard":** Calls `POST /api/onboarding` immediately with whatever was answered so far, marking onboarding complete. Modal won't reappear.
