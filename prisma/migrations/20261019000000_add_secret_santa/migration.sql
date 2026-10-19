-- CreateTable
CREATE TABLE "SecretSantaAssignment" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "giverId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "revealedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecretSantaAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SecretSantaAssignment_editionId_giverId_key" ON "SecretSantaAssignment"("editionId", "giverId");

-- CreateIndex
CREATE UNIQUE INDEX "SecretSantaAssignment_editionId_receiverId_key" ON "SecretSantaAssignment"("editionId", "receiverId");

-- AddForeignKey
ALTER TABLE "SecretSantaAssignment" ADD CONSTRAINT "SecretSantaAssignment_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "Edition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretSantaAssignment" ADD CONSTRAINT "SecretSantaAssignment_giverId_fkey" FOREIGN KEY ("giverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretSantaAssignment" ADD CONSTRAINT "SecretSantaAssignment_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
