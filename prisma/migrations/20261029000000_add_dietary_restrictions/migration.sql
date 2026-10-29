-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dietaryNotes" TEXT,
ADD COLUMN     "dietaryRestrictions" TEXT[] DEFAULT ARRAY[]::TEXT[];
