import type { Column } from './column'

export interface Board {
  id: string
  name: string
  ownerId: string
  columns: Column[]
}
