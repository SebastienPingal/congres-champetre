-- AlterEnum
ALTER TYPE "AttendanceDays" ADD VALUE 'UNKNOWN';

-- AlterTable: make isAttending nullable
ALTER TABLE "EditionParticipation" ALTER COLUMN "isAttending" DROP NOT NULL;
ALTER TABLE "EditionParticipation" ALTER COLUMN "isAttending" DROP DEFAULT;

-- AlterTable: make sleepsOnSite nullable
ALTER TABLE "EditionParticipation" ALTER COLUMN "sleepsOnSite" DROP NOT NULL;
ALTER TABLE "EditionParticipation" ALTER COLUMN "sleepsOnSite" DROP DEFAULT;

-- AlterTable: make wantsToSpeak nullable
ALTER TABLE "User" ALTER COLUMN "wantsToSpeak" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "wantsToSpeak" DROP DEFAULT;
