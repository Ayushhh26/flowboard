import { cn } from '@/lib/cn'
import { labelChipStyle } from '@/lib/labelContrast'
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
        'inline-flex max-w-full items-center truncate rounded-md font-semibold shadow-sm',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        className
      )}
      style={labelChipStyle(label.color)}
      title={label.name}
    >
      {label.name}
    </span>
  )
}
