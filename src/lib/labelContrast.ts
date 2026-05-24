/** Relative luminance (sRGB) for picking readable label text. */
function luminance(hex: string): number {
  const raw = hex.replace('#', '')
  if (raw.length !== 6) return 0.5
  const r = parseInt(raw.slice(0, 2), 16) / 255
  const g = parseInt(raw.slice(2, 4), 16) / 255
  const b = parseInt(raw.slice(4, 6), 16) / 255
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

import type { CSSProperties } from 'react'

export function labelChipStyle(color: string): CSSProperties {
  const light = luminance(color) > 0.55
  return {
    backgroundColor: color,
    color: light ? '#111111' : '#ffffff',
    boxShadow: light
      ? 'inset 0 0 0 1px rgba(0,0,0,0.12)'
      : 'inset 0 0 0 1px rgba(255,255,255,0.2)',
  }
}
