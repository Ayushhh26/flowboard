import { useQuery } from '@tanstack/react-query'
import type { ApiResponse } from '@/types/api'

async function fetchSmartAddEnabled(): Promise<boolean> {
  const res = await fetch('/api/features')
  const json: ApiResponse<{ smartAdd: boolean }> = await res.json()
  if (json.error) return false
  return json.data.smartAdd
}

export function useSmartAddEnabled() {
  return useQuery({
    queryKey: ['features', 'smartAdd'],
    queryFn: fetchSmartAddEnabled,
    staleTime: 60_000,
  })
}
