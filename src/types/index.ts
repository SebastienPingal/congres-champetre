export type AttendanceDays = 'NONE' | 'DAY1' | 'DAY2' | 'BOTH'
export type MealStatus = 'PRESENT' | 'ABSENT' | null
export type SlotKind = 'CONFERENCE' | 'MEAL' | 'BREAK' | 'OTHER'
export type Role = 'USER' | 'ADMIN'

export interface EditionInfo {
  id: string
  name: string
  startDate: string | null
  endDate: string | null
  participantCount: number
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
  wantsToSpeak: boolean
  isAttending: boolean
  attendanceDays: AttendanceDays
  sleepsOnSite: boolean
  willPayInCash: boolean
  hasPaid: boolean
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

export interface TimeSlot {
  id: string
  title: string
  startTime: string
  endTime: string
  kind: SlotKind
  conference?: {
    id: string
    title: string
    speaker: { id: string; name: string; email: string }
  }
}
