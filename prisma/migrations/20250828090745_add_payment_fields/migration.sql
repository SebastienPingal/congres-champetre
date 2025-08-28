-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "hasPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "willPayInCash" BOOLEAN NOT NULL DEFAULT false;
