-- AlterTable
ALTER TABLE "Edition" ADD COLUMN     "secretSantaEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "EditionParticipation" ADD COLUMN     "wantsSecretSanta" BOOLEAN;

-- Backfill : un tirage déjà effectué reste cohérent avec le nouvel opt-in
-- (Secret Santa activé, les personnes tirées sont considérées volontaires).
UPDATE "Edition" e SET "secretSantaEnabled" = true
WHERE EXISTS (SELECT 1 FROM "SecretSantaAssignment" a WHERE a."editionId" = e."id");

UPDATE "EditionParticipation" p SET "wantsSecretSanta" = true
WHERE EXISTS (
  SELECT 1 FROM "SecretSantaAssignment" a
  WHERE a."editionId" = p."editionId" AND a."giverId" = p."userId"
);
