'use client'

import { useEffect } from 'react'
import { applyTheme } from '@/lib/theme'
import { useThemeStore } from '@/stores/useThemeStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const sync = () => applyTheme(useThemeStore.getState().theme)

    if (useThemeStore.persist.hasHydrated()) {
      sync()
      return
    }

    const unsub = useThemeStore.persist.onFinishHydration(sync)
    void useThemeStore.persist.rehydrate()

    return unsub
  }, [])

  return children
}
