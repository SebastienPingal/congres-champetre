# features/meals

Components for meal registration and payment validation.

| File | Component | Purpose |
|---|---|---|
| `meals-section.tsx` | `MealsSection` | Flat list of meal slots (ul `divide-y rounded-lg border`) avec toggles PRESENT/ABSENT. Read-only une fois les inscriptions fermées. |
| `dietary-section.tsx` | `DietarySection` | Encart « Régime alimentaire » rendu en bas de `MealsSection` : cases (`DIETARY_OPTIONS`) + « Autre » libre, bouton « Enregistrer » actif si modifié. Utilise `DietaryFields` (`src/components/dietary-fields.tsx`, partagé avec l'onboarding). Jamais verrouillé. |
| `payment-section.tsx` | `PaymentSection` | Bloc plat de validation, étroit et centré façon bulletin (`max-w-md mx-auto`, les boutons PayPal suivent cette largeur) : breakdown des repas, total, encart « Soutenir le congrès » (soutien libre facultatif : `SUPPORT_PRESETS` + champ « Autre », euros entiers, sans frais PayPal ajoutés), deadline countdown, bouton PayPal (`<PayPalButtons>`) + « Payer plus tard ». Le soutien courant est lu via une ref dans `createOrder` (callback figé par PayPal). |

**Layout :** sections plates (pas de `Card`). Statut affiché via badge outline subtil (amber « À compléter » / green « Complet » ou « Validée » / destructive « Inscriptions fermées »).

**PayPal-only:** The cash / bank-transfer (IBAN) UX has been removed from the participant dashboard. All paid participations go through PayPal Orders v2. The admin can still flip `willPayInCash` manually from `/admin/users` for on-site cash payments. Le bouton PayPal expose à la fois le compte PayPal et un règlement carte invité (sans compte requis).

**Data:**
- `useMeals()` / `useUpdateMealStatus()` from `src/hooks/use-meals.ts`
- Total is computed from PRESENT meals with `price != null`
- `user.edition.isRegistrationClosed` toggles read-only state; `user.edition.registrationDeadline` is the cut-off date (7 days before the edition's last day — `endDate`, falling back to `startDate`). Currently disabled via `REGISTRATION_DEADLINE_ENABLED = false` in `src/lib/edition.ts`: the deadline is always `null` and the section never locks.

**Validation flow:**
0. **Validation automatique quand rien n'est dû** — `isParticipationValidated()` (`src/lib/participation-status.ts`) : un participant (`isAttending === true`) qui n'a coché aucun repas payant (`amountDue === 0`) est considéré comme validé, sans passer par PayPal. `PaymentSection` affiche alors le bloc vert « Rien à régler » et aucune alerte de paiement ne remonte.
1. After onboarding completes, `PaymentSection` shows on the dashboard for attending users with at least one paid meal.
2. Status badge: **Validée** (green, when `hasPaid=true` ou montant dû nul) or **Non validée** (amber).
3. Click bouton PayPal → `createOrder` POST `/api/payments/order` → popup PayPal → `onApprove` POST `/api/payments/capture`.
4. On success → invalidate `userProfile` query → `hasPaid=true` **et `isAttending=true`** (payer vaut confirmation de présence, posé côté serveur par `/api/payments/capture` et le webhook) → the section turns green. Le webhook PayPal sert de filet de sécurité si le capture côté front échoue.
5. "Payer plus tard" only collapses the CTA; the participation stays unpaid until the user returns.

**Section IDs:** `#section-repas` (meals), `#section-validation` (payment).
