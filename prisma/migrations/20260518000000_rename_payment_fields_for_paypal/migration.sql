-- Rename Stripe-specific columns to provider-agnostic names (PayPal migration)
ALTER TABLE "EditionParticipation" RENAME COLUMN "stripePaymentIntentId" TO "paymentProviderId";
ALTER TABLE "EditionParticipation" RENAME COLUMN "stripePaymentStatus" TO "paymentStatus";

ALTER TABLE "PaymentIntent" RENAME COLUMN "stripeId" TO "providerId";
ALTER INDEX "PaymentIntent_stripeId_key" RENAME TO "PaymentIntent_providerId_key";
