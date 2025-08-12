/*
  Warnings:

  - You are about to drop the column `isAvailable` on the `TimeSlot` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."TimeSlot" DROP COLUMN "isAvailable";
