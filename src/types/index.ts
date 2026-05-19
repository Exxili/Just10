export type SessionStatus = 'completed_10' | 'stopped_early' | 'continued' | 'marked_done'

export interface Session {
  id: string
  taskTitle: string
  category?: string
  startedAt: string
  endedAt?: string
  intendedDurationSeconds: number
  actualDurationSeconds: number
  status: SessionStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface QuickPick {
  id: string
  title: string
  icon: string
  category?: string
  colour?: string
  createdAt: string
  updatedAt: string
  isDefault: boolean
}

export type ThemePreference = 'system' | 'light' | 'dark'
export type FocusSound = 'off' | 'calm' | 'rain' | 'soft_tone'

export interface Settings {
  timerLengthMinutes: number
  theme: ThemePreference
  remindersEnabled: boolean
  reminderTime?: string
  focusSound: FocusSound
  hasCompletedOnboarding: boolean
  premiumUnlocked: boolean
}

export interface WeekdayStarts {
  day: string
  count: number
  minutes: number
}
