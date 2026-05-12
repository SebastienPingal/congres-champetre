import { prisma } from "@/lib/prisma";

export class NoActiveEditionError extends Error {
  constructor() {
    super("Aucune édition active trouvée")
    this.name = "NoActiveEditionError"
  }
}

export async function getActiveEdition() {
  const edition = await prisma.edition.findFirst({
    where: { isActive: true },
  });

  if (!edition) {
    throw new NoActiveEditionError();
  }

  return edition;
}

export async function getActiveEditionId() {
  const edition = await getActiveEdition();
  return edition.id;
}
