/*
  Warnings:

  - A unique constraint covering the columns `[timeSlotId]` on the table `Conference` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."SlotKind" AS ENUM ('CONFERENCE', 'MEAL', 'BREAK', 'OTHER');

-- AlterTable
ALTER TABLE "public"."TimeSlot" ADD COLUMN     "kind" "public"."SlotKind" NOT NULL DEFAULT 'CONFERENCE';

-- CreateIndex
CREATE UNIQUE INDEX "Conference_timeSlotId_key" ON "public"."Conference"("timeSlotId");
