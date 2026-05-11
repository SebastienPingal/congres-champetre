-- AlterTable: add onboarding and Stripe fields to EditionParticipation
ALTER TABLE "public"."EditionParticipation"
  ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3),
  ADD COLUMN "stripePaymentIntentId" TEXT,
  ADD COLUMN "stripePaymentStatus"   TEXT,
  ADD COLUMN "paidAmount"            DOUBLE PRECISION;

-- CreateTable: PaymentIntent audit trail
CREATE TABLE "public"."PaymentIntent" (
    "id"              TEXT NOT NULL,
    "userId"          TEXT NOT NULL,
    "editionId"       TEXT NOT NULL,
    "participationId" TEXT NOT NULL,
    "stripeId"        TEXT NOT NULL,
    "amount"          INTEGER NOT NULL,
    "currency"        TEXT NOT NULL DEFAULT 'eur',
    "status"          TEXT NOT NULL DEFAULT 'pending',
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_stripeId_key" ON "public"."PaymentIntent"("stripeId");

-- AddForeignKey
ALTER TABLE "public"."PaymentIntent" ADD CONSTRAINT "PaymentIntent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."PaymentIntent" ADD CONSTRAINT "PaymentIntent_editionId_fkey"
  FOREIGN KEY ("editionId") REFERENCES "public"."Edition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."PaymentIntent" ADD CONSTRAINT "PaymentIntent_participationId_fkey"
  FOREIGN KEY ("participationId") REFERENCES "public"."EditionParticipation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
