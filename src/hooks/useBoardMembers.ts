import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ApiResponse } from '@/types/api'

export type MemberRow = {
  userId: string
  name: string
  email: string
  avatarUrl: string | null
  role: 'owner' | 'editor' | 'viewer'
}

export type InvitationRow = {
  id: string
  email: string
  role: 'editor' | 'viewer'
  createdAt: string
}

type MembersResponse = {
  members: MemberRow[]
  invitations: InvitationRow[]
}

type InviteResult =
  | { kind: 'added'; member: MemberRow }
  | { kind: 'invited'; invitation: InvitationRow }

function memberQueryKey(boardId: string) {
  return ['board-members', boardId] as const
}

export function useBoardMembers(boardId: string) {
  return useQuery({
    queryKey: memberQueryKey(boardId),
    queryFn: async (): Promise<MembersResponse> => {
      const res = await fetch(`/api/boards/${boardId}/members`)
      const json: ApiResponse<MembersResponse> = await res.json()
      if (json.error) throw new Error(json.error.message)
      return json.data
    },
  })
}

export function useInviteMember(boardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: 'editor' | 'viewer' }) => {
      const res = await fetch(`/api/boards/${boardId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })
      const json: ApiResponse<InviteResult> = await res.json()
      if (json.error) throw new Error(json.error.message)
      return json.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: memberQueryKey(boardId) })
      if (data.kind === 'added') {
        toast.success(`Added ${data.member.name}`)
      } else {
        toast.success(`Invited ${data.invitation.email} — they'll join when they sign up`)
      }
    },
    onError: (e: Error) => {
      toast.error(e.message)
    },
  })
}

export function useUpdateMemberRole(boardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'editor' | 'viewer' }) => {
      const res = await fetch(`/api/boards/${boardId}/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const json: ApiResponse<MemberRow> = await res.json()
      if (json.error) throw new Error(json.error.message)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberQueryKey(boardId) })
    },
    onError: (e: Error) => {
      toast.error(e.message)
    },
  })
}

export function useRemoveMember(boardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const res = await fetch(`/api/boards/${boardId}/members/${userId}`, {
        method: 'DELETE',
      })
      const json: ApiResponse<{ userId: string }> = await res.json()
      if (json.error) throw new Error(json.error.message)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberQueryKey(boardId) })
      toast.success('Member removed')
    },
    onError: (e: Error) => {
      toast.error(e.message)
    },
  })
}

export function useRevokeInvitation(boardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ invitationId }: { invitationId: string }) => {
      const res = await fetch(`/api/boards/${boardId}/invitations/${invitationId}`, {
        method: 'DELETE',
      })
      const json: ApiResponse<{ id: string }> = await res.json()
      if (json.error) throw new Error(json.error.message)
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberQueryKey(boardId) })
      toast.success('Invitation revoked')
    },
    onError: (e: Error) => {
      toast.error(e.message)
    },
  })
}
