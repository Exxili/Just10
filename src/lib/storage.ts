import localforage from 'localforage'
import { defaultQuickPicks, defaultSettings } from './defaults'
import type { QuickPick, Session, Settings } from '../types'

const sessionsStore = localforage.createInstance({
  name: 'just10',
  storeName: 'sessions',
})

const appStore = localforage.createInstance({
  name: 'just10',
  storeName: 'app',
})

export async function getSessions(): Promise<Session[]> {
  return (await appStore.getItem<Session[]>('sessions')) ?? []
}

export async function saveSession(session: Session): Promise<void> {
  const sessions = await getSessions()
  const nextSessions = [session, ...sessions.filter((item) => item.id !== session.id)]
  await appStore.setItem('sessions', nextSessions)
}

export async function updateSession(id: string, patch: Partial<Session>): Promise<void> {
  const sessions = await getSessions()
  const nextSessions = sessions.map((session) =>
    session.id === id ? { ...session, ...patch, updatedAt: new Date().toISOString() } : session,
  )
  await appStore.setItem('sessions', nextSessions)
}

export async function deleteSession(id: string): Promise<void> {
  const sessions = await getSessions()
  await appStore.setItem(
    'sessions',
    sessions.filter((session) => session.id !== id),
  )
}

export async function getQuickPicks(): Promise<QuickPick[]> {
  return (await appStore.getItem<QuickPick[]>('quickPicks')) ?? defaultQuickPicks
}

export async function saveQuickPick(quickPick: QuickPick): Promise<void> {
  const quickPicks = await getQuickPicks()
  const nextQuickPicks = [quickPick, ...quickPicks.filter((item) => item.id !== quickPick.id)]
  await appStore.setItem('quickPicks', nextQuickPicks)
}

export async function getSettings(): Promise<Settings> {
  return {
    ...defaultSettings,
    ...((await appStore.getItem<Partial<Settings>>('settings')) ?? {}),
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await appStore.setItem('settings', settings)
}

export async function exportData(): Promise<string> {
  const data = {
    sessions: await getSessions(),
    quickPicks: await getQuickPicks(),
    settings: await getSettings(),
    exportedAt: new Date().toISOString(),
  }

  return JSON.stringify(data, null, 2)
}

export async function resetAllData(): Promise<void> {
  await appStore.clear()
  await sessionsStore.clear()
}
