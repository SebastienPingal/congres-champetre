# features/meals

Components for meal registration and payment validation.

| File | Component | Purpose |
|---|---|---|
| `meals-section.tsx` | `MealsSection` | Flat list of meal slots (ul `divide-y rounded-lg border`) avec toggles PRESENT/ABSENT. Read-only une fois les inscriptions fermées. |
| `payment-section.tsx` | `PaymentSection` | Bloc plat de validation : breakdown des repas, total, deadline countdown, bouton PayPal (`<PayPalButtons>`) + « Payer plus tard ». |

**Layout :** sections plates (pas de `Card`). Statut affiché via badge outline subtil (amber « À compléter » / green « Complet » ou « Validée » / destructive « Inscriptions fermées »).

**PayPal-only:** The cash / bank-transfer (IBAN) UX has been removed from the participant dashboard. All paid participations go through PayPal Orders v2. The admin can still flip `willPayInCash` manually from `/admin/users` for on-site cash payments. Le bouton PayPal expose à la fois le compte PayPal et un règlement carte invité (sans compte requis).

**Data:**
- `useMeals()` / `useUpdateMealStatus()` from `src/hooks/use-meals.ts`
- Total is computed from PRESENT meals with `price != null`
- `user.edition.isRegistrationClosed` toggles read-only state; `user.edition.registrationDeadline` is the cut-off date (7 days before the edition's `startDate`)

**Validation flow:**
1. After onboarding completes, `PaymentSection` shows on the dashboard for attending users with at least one paid meal.
2. Status badge: **Validée** (green, when `hasPaid=true`) or **Non validée** (amber).
3. Click bouton PayPal → `createOrder` POST `/api/payments/order` → popup PayPal → `onApprove` POST `/api/payments/capture`.
4. On success → invalidate `userProfile` query → `hasPaid=true` and the section turns green. Le webhook PayPal sert de filet de sécurité si le capture côté front échoue.
5. "Payer plus tard" only collapses the CTA; the participation stays unpaid until the user returns.

**Section IDs:** `#section-repas` (meals), `#section-validation` (payment).
