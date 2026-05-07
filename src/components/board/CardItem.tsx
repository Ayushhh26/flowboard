import { cn } from '@/lib/cn'
import type { Card } from '@/types/card'

const priorityBorderClass: Record<Card['priority'], string> = {
  none: 'border-l-transparent',
  low: 'border-l-blue-400',
  medium: 'border-l-yellow-400',
  high: 'border-l-orange-500',
  urgent: 'border-l-red-500',
}

interface CardItemProps {
  card: Card
}

export function CardItem({ card }: CardItemProps) {
  return (
    <div
      className={cn(
        'cursor-pointer rounded-lg border border-gray-200 border-l-[3px] bg-white p-3',
        'transition-shadow duration-150 hover:shadow-md',
        priorityBorderClass[card.priority]
      )}
    >
      <p className="text-sm font-medium text-gray-900">{card.title}</p>
    </div>
  )
}
