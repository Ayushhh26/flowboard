import { create } from 'zustand'

interface DemoState {
  simulateFailure: boolean
  toggleSimulateFailure: () => void
}

export const useDemoStore = create<DemoState>((set) => ({
  simulateFailure: false,
  toggleSimulateFailure: () => set((s) => ({ simulateFailure: !s.simulateFailure })),
}))
