# features/meals

Components for meal registration and payment.

| File | Component | Purpose |
|---|---|---|
| `meals-section.tsx` | `MealsSection` | List of meal slots with PRESENT/ABSENT toggles + payment mode selector |
| `meal-payment-block.tsx` | `MealPaymentBlock` | Stripe card payment button (hidden when `willPayInCash=true` or no Stripe key configured) |

**Data:**
- `useMeals()` / `useUpdateMealStatus()` from `src/hooks/use-meals.ts`
- `useUpdateProfile()` for `willPayInCash` toggle
- Payment total computed from PRESENT meals with `price != null`

**Stripe flow:**
1. User picks "Virement" → `MealPaymentBlock` shows "Payer par carte" button
2. Click → POST `/api/payments/intent` → gets `clientSecret`
3. Stripe `Elements` + `PaymentElement` rendered in Dialog
4. On success → invalidate `userProfile` query → `hasPaid` becomes `true`
5. If `hasPaid=true` → shows green confirmation badge instead

**IBAN fallback:** When `willPayInCash=true`, shows IBAN copy button + RIB PDF download (bank transfer info).

**Section ID:** `#section-repas`
