-- AlterTable
ALTER TABLE "EditionParticipation" ADD COLUMN     "supportAmount" INTEGER;

-- AlterTable
ALTER TABLE "PaymentIntent" ADD COLUMN     "supportAmount" INTEGER NOT NULL DEFAULT 0;
