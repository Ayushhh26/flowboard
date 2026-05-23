import type { Priority } from '@/types/card'
import type { ViewerRole } from '@/types/board'

export const PRIORITY_STYLES: Record<
  Priority,
  { label: string; badge: string; border: string; dot: string; selected: string }
> = {
  none: {
    label: 'No priority',
    badge: 'bg-slate-100 text-slate-600',
    border: 'border-l-transparent',
    dot: 'bg-slate-300',
    selected: 'border-slate-300 bg-slate-50 text-slate-700 ring-1 ring-slate-200',
  },
  low: {
    label: 'Low',
    badge: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200/60',
    border: 'border-l-sky-400',
    dot: 'bg-sky-500',
    selected: 'border-sky-300 bg-sky-50 text-sky-800 ring-1 ring-sky-200',
  },
  medium: {
    label: 'Medium',
    badge: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/60',
    border: 'border-l-amber-400',
    dot: 'bg-amber-500',
    selected: 'border-amber-300 bg-amber-50 text-amber-900 ring-1 ring-amber-200',
  },
  high: {
    label: 'High',
    badge: 'bg-orange-50 text-orange-800 ring-1 ring-orange-200/60',
    border: 'border-l-orange-500',
    dot: 'bg-orange-500',
    selected: 'border-orange-300 bg-orange-50 text-orange-900 ring-1 ring-orange-200',
  },
  urgent: {
    label: 'Urgent',
    badge: 'bg-red-50 text-red-700 ring-1 ring-red-200/60',
    border: 'border-l-red-500',
    dot: 'bg-red-600',
    selected: 'border-red-300 bg-red-50 text-red-800 ring-1 ring-red-200',
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
    className: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200/60',
  },
  editor: {
    label: 'Editor',
    className: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60',
  },
  viewer: {
    label: 'Viewer',
    className: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80',
  },
  pending: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
  },
}

/** Shared form control styles */
export const inputClassName =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition-colors duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100'

export const fieldLabelClassName =
  'text-xs font-semibold uppercase tracking-wide text-slate-500'

export const cardSurfaceClassName =
  'rounded-xl border border-slate-200/80 bg-white shadow-sm transition-[box-shadow,border-color] duration-200'

export const interactiveCardClassName =
  'block cursor-pointer rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors duration-200 hover:border-indigo-200 hover:bg-indigo-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2'

export const linkClassName =
  'font-medium text-indigo-600 transition-colors duration-200 hover:text-indigo-700'

export const focusRingClassName =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2'
