export function computeOrderIndex(
  cards: { orderIndex: number }[],
  insertIndex: number
): number {
  const before = cards[insertIndex - 1]?.orderIndex ?? null
  const after = cards[insertIndex]?.orderIndex ?? null

  if (before === null && after === null) return 1.0
  if (before === null) return after! / 2
  if (after === null) return before + 1.0
  return (before + after) / 2
}
