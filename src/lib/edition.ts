import { prisma } from "@/lib/prisma";

export async function getActiveEdition() {
  const edition = await prisma.edition.findFirst({
    where: { isActive: true },
  });

  if (!edition) {
    throw new Error("Aucune édition active trouvée");
  }

  return edition;
}

export async function getActiveEditionId() {
  const edition = await getActiveEdition();
  return edition.id;
}
