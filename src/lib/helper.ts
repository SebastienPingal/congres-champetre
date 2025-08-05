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