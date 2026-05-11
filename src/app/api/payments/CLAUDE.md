# src/app/api/payments

Stripe payment API routes.

| Route | File | Purpose |
|---|---|---|
| `POST /api/payments/intent` | `intent/route.ts` | Compute total from PRESENT meals, create/reuse Stripe PaymentIntent, return `clientSecret` |
| `POST /api/payments/webhook` | `webhook/route.ts` | Handle Stripe events: set `hasPaid=true` on `payment_intent.succeeded` |

**Security:** Amount is always computed server-side from DB (never trusted from client). Webhook signature verified via `stripe.webhooks.constructEvent()` using raw request body (`request.text()` — do NOT use `request.json()`).

**Env vars required:**
- `STRIPE_SECRET_KEY` — server-side only
- `STRIPE_WEBHOOK_SECRET` — for webhook signature verification
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — client-side (exposed to browser)

**Stripe library:** `src/lib/stripe.ts` — singleton `Stripe` instance.

**DB tracking:** `EditionParticipation.stripePaymentIntentId` + `stripePaymentStatus`. Audit trail in `PaymentIntent` model.
