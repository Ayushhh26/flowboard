import { create } from 'zustand'

interface DrawerState {
  openCardId: string | null
  openCard: (id: string) => void
  closeCard: () => void
}

export const useDrawerStore = create<DrawerState>((set) => ({
  openCardId: null,
  openCard: (id) => set({ openCardId: id }),
  closeCard: () => set({ openCardId: null }),
}))
