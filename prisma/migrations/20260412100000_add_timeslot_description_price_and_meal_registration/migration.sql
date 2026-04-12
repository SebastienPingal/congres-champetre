-- AlterTable
ALTER TABLE "public"."TimeSlot" ADD COLUMN "description" TEXT;
ALTER TABLE "public"."TimeSlot" ADD COLUMN "price" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "public"."MealRegistration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timeSlotId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MealRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MealRegistration_userId_timeSlotId_key" ON "public"."MealRegistration"("userId", "timeSlotId");

-- AddForeignKey
ALTER TABLE "public"."MealRegistration" ADD CONSTRAINT "MealRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MealRegistration" ADD CONSTRAINT "MealRegistration_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "public"."TimeSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
