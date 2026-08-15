-- Conférences « générales » : créées par un admin, rattachées à aucun compte.
-- AlterTable
ALTER TABLE "Conference" ALTER COLUMN "speakerId" DROP NOT NULL;
ALTER TABLE "Conference" ADD COLUMN "speakerName" TEXT;
