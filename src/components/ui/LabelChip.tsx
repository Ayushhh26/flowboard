import { cn } from '@/lib/cn'
import type { Label } from '@/types/card'

interface LabelChipProps {
  label: Label
  className?: string
  size?: 'sm' | 'md'
}

export function LabelChip({ label, className, size = 'sm' }: LabelChipProps) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center truncate rounded-md font-medium text-white',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
        className
      )}
      style={{ backgroundColor: label.color }}
      title={label.name}
    >
      {label.name}
    </span>
  )
}
