export type Priority = 'none' | 'low' | 'medium' | 'high' | 'urgent'

export interface User {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  createdAt: string
}

export interface Label {
  id: string
  boardId: string
  name: string
  color: string
}

export interface Card {
  id: string
  columnId: string
  title: string
  description: string | null
  priority: Priority
  orderIndex: number
  assigneeId: string | null
  assignee: User | null
  labels: Label[]
  createdAt: string
  updatedAt: string
}

export interface MoveCardPayload {
  targetColumnId: string
  newOrderIndex: number
}

export interface UpdateCardPayload {
  title?: string
  description?: string | null
  priority?: Priority
  assigneeId?: string | null
  labelIds?: string[]
}
