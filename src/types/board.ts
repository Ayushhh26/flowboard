import type { Column } from './column'

export type ViewerRole = 'owner' | 'editor' | 'viewer'

export interface Board {
  id: string
  name: string
  ownerId: string
  columns: Column[]
  viewerRole: ViewerRole
}
