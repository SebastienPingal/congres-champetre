# src/app/api/payments

PayPal payment API routes (Orders v2 + Webhooks).

| Route | File | Purpose |
|---|---|---|
| `POST /api/payments/order` | `order/route.ts` | Compute total from PRESENT meals, create a PayPal Order, return `orderId`. Persists the order id on the participation. |
| `POST /api/payments/capture` | `capture/route.ts` | After buyer approves in the PayPal popup, capture the order, mark `hasPaid=true`. Body: `{ orderId }`. |
| `POST /api/payments/webhook` | `webhook/route.ts` | Backup confirmation: handles `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`, `CHECKOUT.ORDER.VOIDED`. Verifies signature via PayPal's `/v1/notifications/verify-webhook-signature`. |

**Security:**
- Amount is always computed server-side from DB (never trusted from client).
- Capture route checks that `orderId` belongs to the authenticated user before capturing.
- Webhook signature verified against `PAYPAL_WEBHOOK_ID` using raw request body (`request.text()` — never `request.json()`).
- `custom_id` on the order encodes `userId:editionId` so the webhook can locate the participation without trusting the client.

**Registration deadline:** `/api/payments/order` and `/api/payments/capture` deliberately stay open after registrations close (`isRegistrationClosed`), so users who confirmed before the cut-off can still pay late. Meal/participation/conference mutations on other routes return 409 once the deadline has passed.

**UI entry point:** `src/features/meals/payment-section.tsx` is the only client surface — it uses `@paypal/react-paypal-js` (`<PayPalScriptProvider>` + `<PayPalButtons>`). The buyer can pay via PayPal account or as a guest with a card (PayPal's "Debit or Credit Card" option in the popup).

**Env vars required:**
- `PAYPAL_CLIENT_ID` — server-side
- `PAYPAL_CLIENT_SECRET` — server-side
- `PAYPAL_WEBHOOK_ID` — server-side, for webhook signature verification
- `PAYPAL_ENV` — `"live"` for production, anything else (or unset) routes to sandbox
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID` — client-side (same value as `PAYPAL_CLIENT_ID`)

**PayPal library:** `src/lib/paypal.ts` — thin fetch wrapper over PayPal REST (OAuth token cached in-process).

**DB tracking:**
- `EditionParticipation.paymentProviderId` + `paymentStatus` track the latest order.
- `PaymentIntent` model is the audit trail (one row per order created, `providerId` = PayPal order id).
