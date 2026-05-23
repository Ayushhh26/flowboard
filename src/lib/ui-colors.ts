import type { Priority } from '@/types/card'
import type { ViewerRole } from '@/types/board'

export const PRIORITY_STYLES: Record<
  Priority,
  { label: string; badge: string; border: string; dot: string; selected: string }
> = {
  none: {
    label: 'No priority',
    badge: 'bg-gray-100 text-gray-600',
    border: 'border-l-transparent',
    dot: 'bg-gray-300',
    selected: 'border-gray-300 bg-gray-50 text-gray-700 ring-1 ring-gray-200',
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
    className: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200/60',
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
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100'

export const fieldLabelClassName =
  'text-xs font-medium uppercase tracking-wide text-gray-500'
