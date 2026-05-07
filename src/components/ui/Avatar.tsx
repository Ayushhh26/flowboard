import { forwardRef, useState } from 'react'
import { cn } from '@/lib/cn'

export interface AvatarProps {
  name: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = { sm: 'h-6 w-6 text-xs', md: 'h-8 w-8 text-sm', lg: 'h-10 w-10 text-base' }

const bgPalette = [
  'bg-blue-200 text-blue-800',
  'bg-green-200 text-green-800',
  'bg-purple-200 text-purple-800',
  'bg-yellow-200 text-yellow-800',
  'bg-pink-200 text-pink-800',
  'bg-indigo-200 text-indigo-800',
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function hashColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return bgPalette[Math.abs(hash) % bgPalette.length]
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(function Avatar(
  { name, src, size = 'md', className },
  ref
) {
  const [imgError, setImgError] = useState(false)
  const showImage = src && !imgError

  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-medium',
        sizeClasses[size],
        !showImage && hashColor(name),
        className
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={`Avatar of ${name}`}
          className="h-full w-full rounded-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span aria-hidden="true">{getInitials(name)}</span>
      )}
    </div>
  )
})
