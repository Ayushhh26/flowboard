import type { Priority } from '@/types/card'
import type { ViewerRole } from '@/types/board'

/** Linear-inspired priority palette — saturated, scannable at a glance. */
export const PRIORITY_STYLES: Record<
  Priority,
  { label: string; badge: string; border: string; dot: string; selected: string; filterActive: string }
> = {
  none: {
    label: 'No priority',
    badge: 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-600',
    border: 'border-l-zinc-300 dark:border-l-zinc-600',
    dot: 'bg-zinc-400',
    selected: 'border-zinc-300 bg-zinc-100 text-zinc-800 ring-2 ring-zinc-300 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-500',
    filterActive: 'border-zinc-400 bg-zinc-100 text-zinc-800 ring-1 ring-zinc-300 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-100',
  },
  low: {
    label: 'Low',
    badge: 'bg-blue-100 text-blue-800 ring-1 ring-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:ring-blue-700',
    border: 'border-l-blue-500',
    dot: 'bg-blue-500',
    selected: 'border-blue-400 bg-blue-50 text-blue-900 ring-2 ring-blue-300 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-100 dark:ring-blue-600',
    filterActive: 'border-blue-400 bg-blue-100 text-blue-900 ring-1 ring-blue-300 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-100',
  },
  medium: {
    label: 'Medium',
    badge: 'bg-amber-100 text-amber-900 ring-1 ring-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-700',
    border: 'border-l-amber-500',
    dot: 'bg-amber-500',
    selected: 'border-amber-400 bg-amber-50 text-amber-950 ring-2 ring-amber-300 dark:border-amber-500 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-600',
    filterActive: 'border-amber-400 bg-amber-100 text-amber-950 ring-1 ring-amber-300 dark:border-amber-500 dark:bg-amber-950 dark:text-amber-100',
  },
  high: {
    label: 'High',
    badge: 'bg-orange-100 text-orange-900 ring-1 ring-orange-300 dark:bg-orange-950 dark:text-orange-200 dark:ring-orange-700',
    border: 'border-l-orange-500',
    dot: 'bg-orange-500',
    selected: 'border-orange-400 bg-orange-50 text-orange-950 ring-2 ring-orange-300 dark:border-orange-500 dark:bg-orange-950 dark:text-orange-100 dark:ring-orange-600',
    filterActive: 'border-orange-400 bg-orange-100 text-orange-950 ring-1 ring-orange-300 dark:border-orange-500 dark:bg-orange-950 dark:text-orange-100',
  },
  urgent: {
    label: 'Urgent',
    badge: 'bg-red-100 text-red-900 ring-1 ring-red-300 dark:bg-red-950 dark:text-red-200 dark:ring-red-700',
    border: 'border-l-red-600',
    dot: 'bg-red-600',
    selected: 'border-red-400 bg-red-50 text-red-950 ring-2 ring-red-300 dark:border-red-500 dark:bg-red-950 dark:text-red-100 dark:ring-red-600',
    filterActive: 'border-red-500 bg-red-100 text-red-900 ring-1 ring-red-300 dark:border-red-500 dark:bg-red-950 dark:text-red-100',
  },
}

export const PRIORITY_OPTIONS = (Object.keys(PRIORITY_STYLES) as Priority[]).map((value) => ({
  value,
  label: PRIORITY_STYLES[value].label,
}))

export const ROLE_STYLES: Record<
  ViewerRole | 'pending',
  { label: string; className: string }
> = {
  owner: {
    label: 'Owner',
    className: 'bg-violet-100 text-violet-900 ring-1 ring-violet-200 dark:bg-violet-950 dark:text-violet-200 dark:ring-violet-700',
  },
  editor: {
    label: 'Editor',
    className: 'bg-blue-100 text-blue-900 ring-1 ring-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:ring-blue-700',
  },
  viewer: {
    label: 'Viewer',
    className: 'bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-600',
  },
  pending: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-700',
  },
}

export const inputClassName =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-ring'

export const fieldLabelClassName =
  'text-[11px] font-semibold uppercase tracking-[0.1em] text-muted'

export const cardSurfaceClassName =
  'rounded-lg border border-border bg-surface shadow-sm transition-[border-color,box-shadow] duration-200'

export const interactiveCardClassName =
  'block cursor-pointer rounded-lg border border-border bg-surface p-4 shadow-sm transition-[border-color,box-shadow,background-color] duration-200 hover:border-foreground/15 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background'

export const linkClassName =
  'font-medium text-accent transition-colors duration-200 hover:text-accent-hover'

export const focusRingClassName =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background'

export const displayTitleClassName =
  'font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl'
