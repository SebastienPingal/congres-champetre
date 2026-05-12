# features/meals

Components for meal registration and payment validation.

| File | Component | Purpose |
|---|---|---|
| `meals-section.tsx` | `MealsSection` | List of meal slots with PRESENT/ABSENT toggles. Read-only once registrations close. |
| `payment-section.tsx` | `PaymentSection` | Dashboard validation panel: total breakdown, deadline countdown, Stripe "Payer maintenant" + "Payer plus tard". |

**Stripe-only:** The cash / bank-transfer (IBAN) UX has been removed from the participant dashboard. All paid participations go through Stripe PaymentIntents. The admin can still flip `willPayInCash` manually from `/admin/users` for on-site cash payments.

**Data:**
- `useMeals()` / `useUpdateMealStatus()` from `src/hooks/use-meals.ts`
- Total is computed from PRESENT meals with `price != null`
- `user.edition.isRegistrationClosed` toggles read-only state; `user.edition.registrationDeadline` is the cut-off date (7 days before the edition's `startDate`)

**Validation flow:**
1. After onboarding completes, `PaymentSection` shows on the dashboard for attending users with at least one paid meal.
2. Status badge: **Validée** (green, when `hasPaid=true`) or **Non validée** (amber).
3. Click "Payer maintenant" → POST `/api/payments/intent` → Stripe Elements `Dialog`.
4. On success → invalidate `userProfile` query → `hasPaid=true` and the section turns green.
5. "Payer plus tard" only collapses the CTA; the participation stays unpaid until the user returns.

**Section IDs:** `#section-repas` (meals), `#section-validation` (payment).
