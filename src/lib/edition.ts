import { prisma } from "@/lib/prisma";
import type { Edition } from "@prisma/client";

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

export const REGISTRATION_CLOSE_DAYS_BEFORE = 7

export function getRegistrationDeadline(edition: Pick<Edition, "startDate">): Date | null {
  if (!edition.startDate) return null
  const deadline = new Date(edition.startDate)
  deadline.setDate(deadline.getDate() - REGISTRATION_CLOSE_DAYS_BEFORE)
  return deadline
}

export function isRegistrationClosed(edition: Pick<Edition, "startDate">, now: Date = new Date()): boolean {
  const deadline = getRegistrationDeadline(edition)
  if (!deadline) return false
  return now.getTime() >= deadline.getTime()
}

export class RegistrationClosedError extends Error {
  constructor() {
    super("Les inscriptions sont fermées pour cette édition")
    this.name = "RegistrationClosedError"
  }
}
