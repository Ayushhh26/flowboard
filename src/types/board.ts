import type { Column } from './column'
import type { Label } from './card'

export type ViewerRole = 'owner' | 'editor' | 'viewer'

export interface Board {
  id: string
  name: string
  ownerId: string
  columns: Column[]
  labels: Label[]
  viewerRole: ViewerRole
}
