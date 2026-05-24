import { create } from 'zustand'

interface DrawerState {
  openCardId: string | null
  lastOpenedCardId: string | null
  openCard: (id: string) => void
  closeCard: () => void
}

export const useDrawerStore = create<DrawerState>((set) => ({
  openCardId: null,
  lastOpenedCardId: null,

  openCard: (id) => set({ openCardId: id, lastOpenedCardId: id }),

  closeCard: () =>
    set((state) => ({
      openCardId: null,
      lastOpenedCardId: state.lastOpenedCardId,
    })),
}))
