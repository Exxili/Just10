import { create } from 'zustand'
import { createId } from '../lib/ids'
import * as storage from '../lib/storage'
import type { Session, SessionStatus } from '../types'

interface CreateSessionInput {
  taskTitle: string
  category?: string
  intendedDurationSeconds: number
}

interface SessionState {
  sessions: Session[]
  isLoaded: boolean
  loadSessions: () => Promise<void>
  createSession: (input: CreateSessionInput) => Promise<Session>
  updateSession: (id: string, patch: Partial<Session>) => Promise<void>
  completeSession: (id: string, status: SessionStatus, actualDurationSeconds: number) => Promise<void>
  deleteSession: (id: string) => Promise<void>
  clearSessions: () => void
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  isLoaded: false,

  async loadSessions() {
    const sessions = await storage.getSessions()
    set({ sessions, isLoaded: true })
  },

  async createSession(input) {
    const now = new Date().toISOString()
    const session: Session = {
      id: createId('session'),
      taskTitle: input.taskTitle.trim(),
      category: input.category,
      startedAt: now,
      intendedDurationSeconds: input.intendedDurationSeconds,
      actualDurationSeconds: 0,
      status: 'continued',
      createdAt: now,
      updatedAt: now,
    }

    await storage.saveSession(session)
    set({ sessions: [session, ...get().sessions.filter((item) => item.id !== session.id)] })
    return session
  },

  async updateSession(id, patch) {
    await storage.updateSession(id, patch)
    set({
      sessions: get().sessions.map((session) =>
        session.id === id ? { ...session, ...patch, updatedAt: new Date().toISOString() } : session,
      ),
    })
  },

  async completeSession(id, status, actualDurationSeconds) {
    await get().updateSession(id, {
      status,
      actualDurationSeconds,
      endedAt: new Date().toISOString(),
    })
  },

  async deleteSession(id) {
    await storage.deleteSession(id)
    set({ sessions: get().sessions.filter((session) => session.id !== id) })
  },

  clearSessions() {
    set({ sessions: [] })
  },
}))
