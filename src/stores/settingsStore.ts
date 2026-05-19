import { create } from 'zustand'
import * as storage from '../lib/storage'
import type { Settings } from '../types'

interface SettingsState {
  settings: Settings | null
  isLoaded: boolean
  loadSettings: () => Promise<void>
  updateSettings: (patch: Partial<Settings>) => Promise<void>
  setSettings: (settings: Settings) => void
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoaded: false,

  async loadSettings() {
    const settings = await storage.getSettings()
    set({ settings, isLoaded: true })
  },

  async updateSettings(patch) {
    const current = get().settings ?? (await storage.getSettings())
    const nextSettings = { ...current, ...patch }
    await storage.saveSettings(nextSettings)
    set({ settings: nextSettings, isLoaded: true })
  },

  setSettings(settings) {
    set({ settings, isLoaded: true })
  },
}))
