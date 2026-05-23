import Link from 'next/link'
import { cn } from '@/lib/cn'

interface AppLogoProps {
  className?: string
  showWordmark?: boolean
  variant?: 'default' | 'light'
}

export function AppLogo({ className, showWordmark = true, variant = 'default' }: AppLogoProps) {
  const isLight = variant === 'light'

  return (
    <Link
      href="/"
      className={cn(
        'inline-flex items-center gap-2 rounded-lg transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
        isLight && 'focus-visible:ring-white focus-visible:ring-offset-indigo-600',
        className
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg shadow-sm',
          isLight ? 'bg-white/15 text-white ring-1 ring-white/20' : 'bg-indigo-600 text-white'
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
            isLight ? 'text-white' : 'text-slate-900'
          )}
        >
          Flow
          <span className={isLight ? 'text-indigo-200' : 'text-indigo-600'}>Board</span>
        </span>
      )}
    </Link>
  )
}
