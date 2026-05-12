-- Conversion de paidAmount de Float vers Int (cents) pour éviter les erreurs de précision
-- Les valeurs existantes (en euros) sont converties en centimes via ROUND.
ALTER TABLE "EditionParticipation"
  ALTER COLUMN "paidAmount" TYPE INTEGER
  USING ROUND("paidAmount" * 100)::INTEGER;
