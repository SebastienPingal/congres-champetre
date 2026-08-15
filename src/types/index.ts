export type AttendanceDays = 'NONE' | 'DAY1' | 'DAY2' | 'BOTH' | 'UNKNOWN'
export type MealStatus = 'PRESENT' | 'ABSENT' | null
export type SlotKind = 'CONFERENCE' | 'MEAL' | 'BREAK' | 'OTHER'
export type Role = 'USER' | 'ADMIN'

export interface EditionInfo {
  id: string
  name: string
  startDate: string | null
  endDate: string | null
  participantCount: number
  registrationDeadline: string | null
  isRegistrationClosed: boolean
}

export interface ConferenceRecord {
  id: string
  title: string
  description?: string | null
  timeSlot?: {
    id: string
    title: string
    startTime: string
    endTime: string
  } | null
}

export interface UserProfile {
  id: string
  name: string
  email: string
  role: Role
  wantsToSpeak: boolean | null
  isAttending: boolean | null
  attendanceDays: AttendanceDays
  sleepsOnSite: boolean | null
  willPayInCash: boolean
  hasPaid: boolean
  paidAmount: number | null
  onboardingCompletedAt: string | null
  edition: EditionInfo
  conferences: ConferenceRecord[]
}

export interface MealSlot {
  id: string
  title: string
  description: string | null
  price: number | null
  startTime: string
  endTime: string
  status: MealStatus
}

/** `speaker` est `null` sur les conférences générales créées par un admin. */
export interface ConferenceSpeaker {
  id: string
  name: string
  email: string
}

export interface TimeSlot {
  id: string
  title: string
  startTime: string
  endTime: string
  kind: SlotKind
  conference?: {
    id: string
    title: string
    speaker: ConferenceSpeaker | null
    speakerName?: string | null
  }
}

export interface AdminTimeSlot extends Omit<TimeSlot, 'kind'> {
  kind?: SlotKind
  description?: string | null
  price?: number | null
  showInRegistration?: boolean
}

export interface Conference {
  id: string
  title: string
  description?: string | null
  /** `null` pour une conférence générale (non rattachée à un compte). */
  speaker: ConferenceSpeaker | null
  /** Intervenant libre, utilisé uniquement quand `speaker` est `null`. */
  speakerName?: string | null
  timeSlot?: {
    id: string
    title: string
    startTime: string
    endTime: string
  } | null
}
