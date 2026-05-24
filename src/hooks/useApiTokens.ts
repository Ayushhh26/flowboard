import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ApiResponse } from '@/types/api'
import type { ApiTokenCreated, ApiTokenListItem } from '@/types/apiToken'

const queryKey = ['api-tokens'] as const

export function useApiTokens() {
  return useQuery({
    queryKey,
    queryFn: async (): Promise<ApiTokenListItem[]> => {
      const res = await fetch('/api/tokens')
      const json: ApiResponse<ApiTokenListItem[]> = await res.json()
      if (json.error) throw new Error(json.error.message)
      return json.data
    },
  })
}

export function useCreateApiToken() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (name: string): Promise<ApiTokenCreated> => {
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const json: ApiResponse<ApiTokenCreated> = await res.json()
      if (json.error) throw new Error(json.error.message)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
    onError: () => {
      toast.error('Failed to create API token')
    },
  })
}

export function useRevokeApiToken() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tokens/${id}`, { method: 'DELETE' })
      const json: ApiResponse<{ id: string }> = await res.json()
      if (json.error) throw new Error(json.error.message)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success('Token revoked')
    },
    onError: () => {
      toast.error('Failed to revoke token')
    },
  })
}
