/*
  Migration sécurisée : Création des éditions et transfert des données
*/

-- 1. Créer la table Edition d'abord
CREATE TABLE "public"."Edition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Edition_pkey" PRIMARY KEY ("id")
);

-- 2. Créer la table EditionParticipation
CREATE TABLE "public"."EditionParticipation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "isAttending" BOOLEAN NOT NULL DEFAULT false,
    "attendanceDays" "public"."AttendanceDays" NOT NULL DEFAULT 'NONE',
    "sleepsOnSite" BOOLEAN NOT NULL DEFAULT false,
    "hasPaid" BOOLEAN NOT NULL DEFAULT false,
    "willPayInCash" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EditionParticipation_pkey" PRIMARY KEY ("id")
);

-- 3. Ajouter les colonnes editionId en NULLABLE d'abord (pour éviter l'erreur de table non vide)
ALTER TABLE "public"."Conference" ADD COLUMN "editionId" TEXT;
ALTER TABLE "public"."TimeSlot" ADD COLUMN "editionId" TEXT;

-- 4. CRÉATION DE L'ÉDITION INITIALE
-- On génère un ID fixe pour pouvoir lier les données
INSERT INTO "public"."Edition" ("id", "name", "isActive", "updatedAt")
VALUES ('initial-edition-uuid', 'Première édition', true, CURRENT_TIMESTAMP);

-- 5. TRANSFERT DES DONNÉES (Le plus important)
-- On lie les conférences et slots à l'édition créée
UPDATE "public"."Conference" SET "editionId" = 'initial-edition-uuid';
UPDATE "public"."TimeSlot" SET "editionId" = 'initial-edition-uuid';

-- On migre les données de participation depuis la table User
INSERT INTO "public"."EditionParticipation" (
    "id", "userId", "editionId", "isAttending", "attendanceDays", 
    "sleepsOnSite", "hasPaid", "willPayInCash", "updatedAt"
)
SELECT 
    'migrated_' || "id", "id", 'initial-edition-uuid',
    "isAttending", "attendanceDays", "sleepsOnSite", "hasPaid", "willPayInCash", CURRENT_TIMESTAMP
FROM "public"."User"
WHERE "isAttending" = true OR "hasPaid" = true OR "willPayInCash" = true;

-- 6. RENDRE LES COLONNES OBLIGATOIRES (Maintenant qu'elles sont remplies)
ALTER TABLE "public"."Conference" ALTER COLUMN "editionId" SET NOT NULL;
ALTER TABLE "public"."TimeSlot" ALTER COLUMN "editionId" SET NOT NULL;

-- 7. SUPPRIMER LES ANCIENNES COLONNES DE USER
ALTER TABLE "public"."User" DROP COLUMN "attendanceDays";
ALTER TABLE "public"."User" DROP COLUMN "hasPaid";
ALTER TABLE "public"."User" DROP COLUMN "isAttending";
ALTER TABLE "public"."User" DROP COLUMN "sleepsOnSite";
ALTER TABLE "public"."User" DROP COLUMN "willPayInCash";

-- 8. AJOUTER LES INDEX ET LES CLÉS ÉTRANGÈRES
CREATE UNIQUE INDEX "EditionParticipation_userId_editionId_key" ON "public"."EditionParticipation"("userId", "editionId");

ALTER TABLE "public"."EditionParticipation" ADD CONSTRAINT "EditionParticipation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."EditionParticipation" ADD CONSTRAINT "EditionParticipation_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "public"."Edition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."TimeSlot" ADD CONSTRAINT "TimeSlot_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "public"."Edition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Conference" ADD CONSTRAINT "Conference_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "public"."Edition"("id") ON DELETE CASCADE ON UPDATE CASCADE;