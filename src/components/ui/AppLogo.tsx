import Link from 'next/link'
import { cn } from '@/lib/cn'
import { focusRingClassName } from '@/lib/ui-colors'

interface AppLogoProps {
  className?: string
  showWordmark?: boolean
  variant?: 'default' | 'inverted'
}

export function AppLogo({ className, showWordmark = true, variant = 'default' }: AppLogoProps) {
  const isInverted = variant === 'inverted'

  return (
    <Link
      href="/"
      className={cn(
        'inline-flex items-center gap-2 rounded-md transition-opacity duration-200 hover:opacity-90',
        focusRingClassName,
        isInverted && 'focus-visible:ring-offset-foreground',
        className
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md',
          isInverted ? 'bg-background/15 text-background ring-1 ring-background/20' : 'bg-accent text-white'
        )}
        aria-hidden
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="4" width="5" height="16" rx="1.5" fill="currentColor" fillOpacity="0.9" />
          <rect x="9.5" y="4" width="5" height="10" rx="1.5" fill="currentColor" fillOpacity="0.65" />
          <rect x="16" y="4" width="5" height="14" rx="1.5" fill="currentColor" fillOpacity="0.45" />
        </svg>
      </span>
      {showWordmark && (
        <span
          className={cn(
            'text-base font-semibold tracking-tight',
            isInverted ? 'text-background' : 'text-foreground'
          )}
        >
          Flow
          <span className={isInverted ? 'text-background/70' : 'text-accent'}>Board</span>
        </span>
      )}
    </Link>
  )
}
