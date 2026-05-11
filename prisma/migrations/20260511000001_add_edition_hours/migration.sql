-- AlterTable: add day hours to Edition
ALTER TABLE "public"."Edition"
  ADD COLUMN "startHour" INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN "endHour"   INTEGER NOT NULL DEFAULT 20;
