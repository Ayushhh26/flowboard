import { create } from 'zustand'
import type { Priority } from '@/types/card'
import { EMPTY_FILTERS, type FilterState } from '@/lib/filterCards'

interface FilterStore extends FilterState {
  setSearch: (search: string) => void
  togglePriority: (priority: Priority) => void
  toggleAssignee: (assigneeId: string) => void
  toggleLabel: (labelId: string) => void
  clearAll: () => void
}

export const useFilterStore = create<FilterStore>((set) => ({
  ...EMPTY_FILTERS,

  setSearch: (search) => set({ search }),

  togglePriority: (priority) =>
    set((s) => ({
      priorities: s.priorities.includes(priority)
        ? s.priorities.filter((p) => p !== priority)
        : [...s.priorities, priority],
    })),

  toggleAssignee: (assigneeId) =>
    set((s) => ({
      assigneeIds: s.assigneeIds.includes(assigneeId)
        ? s.assigneeIds.filter((id) => id !== assigneeId)
        : [...s.assigneeIds, assigneeId],
    })),

  toggleLabel: (labelId) =>
    set((s) => ({
      labelIds: s.labelIds.includes(labelId)
        ? s.labelIds.filter((id) => id !== labelId)
        : [...s.labelIds, labelId],
    })),

  clearAll: () => set(EMPTY_FILTERS),
}))
