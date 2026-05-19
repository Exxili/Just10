import { create } from 'zustand'
import * as storage from '../lib/storage'
import type { QuickPick } from '../types'

interface QuickPickState {
  quickPicks: QuickPick[]
  isLoaded: boolean
  loadQuickPicks: () => Promise<void>
  saveQuickPick: (quickPick: QuickPick) => Promise<void>
}

export const useQuickPickStore = create<QuickPickState>((set, get) => ({
  quickPicks: [],
  isLoaded: false,

  async loadQuickPicks() {
    const quickPicks = await storage.getQuickPicks()
    set({ quickPicks, isLoaded: true })
  },

  async saveQuickPick(quickPick) {
    await storage.saveQuickPick(quickPick)
    set({ quickPicks: [quickPick, ...get().quickPicks.filter((item) => item.id !== quickPick.id)] })
  },
}))
