-- CreateEnum
CREATE TYPE "public"."AttendanceDays" AS ENUM ('NONE', 'DAY1', 'DAY2', 'BOTH');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "attendanceDays" "public"."AttendanceDays" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "isAttending" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sleepsOnSite" BOOLEAN NOT NULL DEFAULT false;
