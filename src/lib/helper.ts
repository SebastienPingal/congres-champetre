/**
 * Nom à afficher pour l'intervenant d'une conférence.
 * Conférence rattachée à un compte → nom du conférencier.
 * Conférence générale (admin) → `speakerName` libre, ou `null` si non renseigné.
 */
export const getSpeakerLabel = (conference: {
  speaker?: { name?: string | null } | null
  speakerName?: string | null
}): string | null => {
  const name = conference.speaker?.name ?? conference.speakerName
  return name && name.trim().length > 0 ? name : null
}

export const formatDateTimeRange = (startTime: string, endTime: string) => {
  const start = new Date(startTime)
  const end = new Date(endTime)

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long"
  }

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit"
  }

  const datePart = start.toLocaleDateString("fr-FR", dateOptions)
  const startTimePart = start.toLocaleTimeString("fr-FR", timeOptions)
  const endTimePart = end.toLocaleTimeString("fr-FR", timeOptions)

  return `le ${datePart} de ${startTimePart} à ${endTimePart}`
}