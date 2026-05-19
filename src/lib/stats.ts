import {
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameMonth,
  isSameWeek,
  parseISO,
  startOfDay,
  startOfWeek,
  subDays,
} from 'date-fns'
import type { Session, WeekdayStarts } from '../types'

export function isStart(session: Session): boolean {
  return session.actualDurationSeconds > 0
}

export function getStartsThisWeek(sessions: Session[]): number {
  const now = new Date()
  return sessions.filter((session) =>
    isStart(session) && isSameWeek(parseISO(session.startedAt), now, { weekStartsOn: 1 }),
  ).length
}

export function getStartsThisMonth(sessions: Session[]): number {
  const now = new Date()
  return sessions.filter((session) => isStart(session) && isSameMonth(parseISO(session.startedAt), now)).length
}

export function getTotalMinutesStarted(sessions: Session[]): number {
  const seconds = sessions.reduce((total, session) => total + Math.max(0, session.actualDurationSeconds), 0)
  return Math.round(seconds / 60)
}

export function getRecentSessions(sessions: Session[], limit = 10): Session[] {
  return [...sessions]
    .filter(isStart)
    .sort((a, b) => parseISO(b.startedAt).getTime() - parseISO(a.startedAt).getTime())
    .slice(0, limit)
}

export function getStartsByWeekday(sessions: Session[]): WeekdayStarts[] {
  const now = new Date()
  const start = startOfWeek(now, { weekStartsOn: 1 })
  const end = endOfWeek(now, { weekStartsOn: 1 })

  return eachDayOfInterval({ start, end }).map((day) => {
    const daySessions = sessions.filter(
      (session) =>
        isStart(session) && differenceInCalendarDays(startOfDay(parseISO(session.startedAt)), startOfDay(day)) === 0,
    )

    return {
      day: format(day, 'EEEEE'),
      count: daySessions.length,
      minutes: getTotalMinutesStarted(daySessions),
    }
  })
}

export function getCurrentStreakDays(sessions: Session[]): number {
  const startDays = getStartDayKeys(sessions)
  let streak = 0
  let day = startOfDay(new Date())

  if (!startDays.has(day.toISOString()) && !startDays.has(startOfDay(subDays(day, 1)).toISOString())) {
    return 0
  }

  if (!startDays.has(day.toISOString())) {
    day = startOfDay(subDays(day, 1))
  }

  while (startDays.has(day.toISOString())) {
    streak += 1
    day = startOfDay(subDays(day, 1))
  }

  return streak
}

export function getLongestStreakDays(sessions: Session[]): number {
  const days = [...getStartDayKeys(sessions)].map((value) => parseISO(value)).sort((a, b) => a.getTime() - b.getTime())

  if (days.length === 0) {
    return 0
  }

  let longest = 1
  let current = 1

  for (let index = 1; index < days.length; index += 1) {
    if (differenceInCalendarDays(days[index], days[index - 1]) === 1) {
      current += 1
    } else {
      current = 1
    }

    longest = Math.max(longest, current)
  }

  return longest
}

export function getMostStartedTask(sessions: Session[]): string {
  const counts = new Map<string, number>()

  sessions.filter(isStart).forEach((session) => {
    counts.set(session.taskTitle, (counts.get(session.taskTitle) ?? 0) + 1)
  })

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'None yet'
}

function getStartDayKeys(sessions: Session[]): Set<string> {
  return new Set(sessions.filter(isStart).map((session) => startOfDay(parseISO(session.startedAt)).toISOString()))
}
