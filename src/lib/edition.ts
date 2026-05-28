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

type EditionDates = Pick<Edition, "startDate" | "endDate">

export function formatEditionDatesLabel(edition: EditionDates): string | null {
  if (!edition.startDate) return null
  const start = new Date(edition.startDate)
  const end = edition.endDate ? new Date(edition.endDate) : null
  const startMonth = start.toLocaleDateString("fr-FR", { month: "long" })
  if (!end) return `${start.getDate()} ${startMonth} ${start.getFullYear()}`
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
  if (sameMonth) return `${start.getDate()} & ${end.getDate()} ${startMonth} ${start.getFullYear()}`
  const endMonth = end.toLocaleDateString("fr-FR", { month: "long" })
  return `${start.getDate()} ${startMonth} & ${end.getDate()} ${endMonth} ${end.getFullYear()}`
}

export function formatEditionDatesBanner(edition: EditionDates): string | null {
  if (!edition.startDate) return null
  const start = new Date(edition.startDate)
  const end = edition.endDate ? new Date(edition.endDate) : null
  const startMonth = start.toLocaleDateString("fr-FR", { month: "long" }).toUpperCase()
  if (!end) return `${start.getDate()} ${startMonth} ${start.getFullYear()}`
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
  if (sameMonth) return `${start.getDate()} — ${end.getDate()} ${startMonth} ${start.getFullYear()}`
  const endMonth = end.toLocaleDateString("fr-FR", { month: "long" }).toUpperCase()
  return `${start.getDate()} ${startMonth} — ${end.getDate()} ${endMonth} ${end.getFullYear()}`
}

const SEASON_LABELS = ["l'hiver", "le printemps", "l'été", "l'automne"] as const

export function getEditionSeasonLabel(edition: Pick<Edition, "startDate">): string | null {
  if (!edition.startDate) return null
  const m = new Date(edition.startDate).getMonth()
  if (m <= 1 || m === 11) return SEASON_LABELS[0]
  if (m <= 4) return SEASON_LABELS[1]
  if (m <= 7) return SEASON_LABELS[2]
  return SEASON_LABELS[3]
}

const ROMAN_NUMERALS = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]

export function toRoman(n: number): string {
  return ROMAN_NUMERALS[n] ?? String(n)
}

export async function getActiveEditionNumber(): Promise<number | null> {
  const editions = await prisma.edition.findMany({
    orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
    select: { id: true, isActive: true },
  })
  const idx = editions.findIndex((e) => e.isActive)
  return idx >= 0 ? idx + 1 : null
}

export function formatFrenchDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
}

export function formatPrice(value: number): string {
  const rounded = Math.round(value * 100) / 100
  const formatted = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(2).replace(".", ",")
  return `${formatted} €`
}
