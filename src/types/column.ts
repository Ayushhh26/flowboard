import type { Card } from './card'

export interface Column {
  id: string
  boardId: string
  title: string
  orderIndex: number
  cards: Card[]
}
