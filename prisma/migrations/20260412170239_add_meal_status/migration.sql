-- CreateEnum
CREATE TYPE "public"."MealStatus" AS ENUM ('PRESENT', 'ABSENT');

-- AlterTable: add column with default for existing rows, then drop the default
ALTER TABLE "public"."MealRegistration" ADD COLUMN "status" "public"."MealStatus" NOT NULL DEFAULT 'PRESENT';
ALTER TABLE "public"."MealRegistration" ALTER COLUMN "status" DROP DEFAULT;
