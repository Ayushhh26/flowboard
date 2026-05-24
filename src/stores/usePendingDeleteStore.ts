import { create } from 'zustand'

const DELETE_DELAY_MS = 5000

interface PendingDelete {
  cardId: string
  boardId: string
  timeoutId: ReturnType<typeof setTimeout>
  onUndo: () => void
  onCommit: () => void
}

interface PendingDeleteState {
  pending: Map<string, PendingDelete>
  scheduleDelete: (opts: {
    cardId: string
    boardId: string
    onUndo: () => void
    onCommit: () => void
  }) => void
  undoDelete: (cardId: string) => void
  commitDelete: (cardId: string) => void
}

export const usePendingDeleteStore = create<PendingDeleteState>((set, get) => ({
  pending: new Map(),

  scheduleDelete: ({ cardId, boardId, onUndo, onCommit }) => {
    const existing = get().pending.get(cardId)
    if (existing) clearTimeout(existing.timeoutId)

    const timeoutId = setTimeout(() => {
      get().commitDelete(cardId)
    }, DELETE_DELAY_MS)

    set((state) => {
      const next = new Map(state.pending)
      next.set(cardId, { cardId, boardId, timeoutId, onUndo, onCommit })
      return { pending: next }
    })
  },

  undoDelete: (cardId) => {
    const item = get().pending.get(cardId)
    if (!item) return
    clearTimeout(item.timeoutId)
    item.onUndo()
    set((state) => {
      const next = new Map(state.pending)
      next.delete(cardId)
      return { pending: next }
    })
  },

  commitDelete: (cardId) => {
    const item = get().pending.get(cardId)
    if (!item) return
    clearTimeout(item.timeoutId)
    item.onCommit()
    set((state) => {
      const next = new Map(state.pending)
      next.delete(cardId)
      return { pending: next }
    })
  },
}))
