Create a React Query mutation hook for: $ARGUMENTS

Requirements:
- Implement full optimistic update pattern:
  - onMutate: cancel queries, snapshot cache, optimistically update
  - onError: rollback to snapshot, show toast via sonner
  - onSettled: invalidate queries
- Strict TypeScript for payload and response types
- Place in src/hooks/
- Use the existing api.ts fetch wrapper