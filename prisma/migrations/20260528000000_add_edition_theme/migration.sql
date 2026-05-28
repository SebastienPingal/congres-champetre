-- AlterTable: add theme to Edition
ALTER TABLE "public"."Edition"
  ADD COLUMN "theme" TEXT NOT NULL DEFAULT 'champetre';
