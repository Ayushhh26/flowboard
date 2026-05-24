# FlowBoard

A Kanban workspace built to explore the hard parts of building production-grade frontend systems: optimistic state, drag-and-drop across containers, and clean separation between server and UI state.

> **Live demo:** _coming soon_ · **Demo mode:** toggle the pill in the header to simulate a server failure mid-drag and watch the optimistic update roll back with a toast.

![demo](docs/demo.gif)

---

## Stack

- **Next.js 16** (App Router) + **TypeScript** (strict)
- **Tailwind CSS v4** + **Radix UI** primitives (Dialog, Dropdown, Tooltip)
- **TanStack React Query** (server state) + **Zustand** (UI state)
- **@dnd-kit** (drag-and-drop) + **Framer Motion** (animations)
- **Prisma 7** + **PostgreSQL** (Supabase) + **sonner** (toasts)

---

## Technical Decisions

The interesting parts aren't visible from the screenshot. Here's why this is built the way it is.

### 1. Server state and UI state live in different stores

React Query owns everything that came from the server (boards, columns, cards). Zustand owns everything ephemeral (which drawer is open, whether demo mode is on). The two never mix.

**Why:** Putting API data in a global UI store turns every fetch, mutation, and refetch into manual cache plumbing. React Query already solves caching, deduping, and invalidation. Zustand is reserved for state that has no server counterpart — that way I never have to ask "is this the source of truth or a stale copy?"

### 2. Optimistic updates with cache snapshots, not setState

Every mutation (create, move, delete, update) follows React Query's `onMutate` / `onError` / `onSettled` pattern:

```ts
onMutate: async (vars) => {
  await queryClient.cancelQueries({ queryKey: ['board', boardId] })
  const preSnapshot = queryClient.getQueryData<Board>(['board', boardId])
  queryClient.setQueryData<Board>(['board', boardId], (old) => /* mutated copy */)
  return { preSnapshot }
},
onError: (_err, _vars, context) => {
  if (context?.preSnapshot) {
    queryClient.setQueryData(['board', boardId], context.preSnapshot)
  }
  toast.error('Failed to move card')
},
onSettled: () => queryClient.invalidateQueries({ queryKey: ['board', boardId] }),
```

**Why:** Local component state would force every drag-aware component to subscribe to and rebroadcast the same data. By mutating the React Query cache directly, the optimistic state lives in exactly one place — the same place a refetch would write to. Rollback is a single line: restore the snapshot.

### 3. Cross-column DnD updates the cache during `onDragOver`, not just `onDragEnd`

When a user drags a card across columns, the cache is updated continuously as `onDragOver` fires. `onDragEnd` only computes the final `orderIndex` and triggers the mutation.

**Why:** If you wait until drop to update state, the user sees the card snap to its new column at the end instead of moving in real time. Updating during `onDragOver` gives Trello-quality feedback. A `lastOverId` ref prevents redundant cache writes when the pointer hasn't actually crossed a new boundary, and a `boardSnapshot` ref captures the pre-drag state so cancellation can fully restore it.

### 4. Fractional indexing instead of integer `orderIndex`

Card positions are floats. Inserting between two cards with `orderIndex` `1.0` and `2.0` produces `1.5`. No reindexing of neighbors. Ever.

```ts
export function computeOrderIndex(cards, insertIndex) {
  const before = cards[insertIndex - 1]?.orderIndex ?? null
  const after = cards[insertIndex]?.orderIndex ?? null
  if (before === null && after === null) return 1.0
  if (before === null) return after! / 2
  if (after === null) return before + 1.0
  return (before + after) / 2
}
```

**Why:** With integer ordering, a single drag in the middle of a column rewrites every subsequent row's index. That doesn't scale, breaks optimistic updates (because the optimistic cache disagrees with the server's reindexed values), and amplifies write load. Fractional indexing makes every move a single-row update — cheap on the server, trivial to rollback on the client.

### 5. Demo mode as a real failure-injection tool

A toggle in the header sets a Zustand flag. When on, `useMoveCard.mutationFn` adds an `x-simulate-failure: true` header. The API route checks for it and returns a 500. The toggle auto-resets after one failure so the next drag works again.

**Why:** Optimistic update rollback is the kind of thing that "works on my machine" until it doesn't. Having a one-click way to demonstrate the failure path — both during development and in interview demos — means the rollback path is exercised constantly instead of being theoretical.

---

## Project structure

```
src/
  app/                 Next.js App Router (pages + API routes)
    api/               REST endpoints for boards, columns, cards
  components/
    board/             BoardCanvas, Column, CardItem, CardDrawer, BoardHeader
    ui/                Button, Badge, Skeleton, InlineEdit primitives
  hooks/               useBoard, useMoveCard, useCreateCard, useUpdateCard, useDeleteCard
  lib/                 fractionalIndex, cn (className helper), Prisma client
  stores/              useDrawerStore (Zustand UI state), useDemoStore
  types/               Shared types (Board, Card, Column, ApiResponse)
prisma/
  schema.prisma        Boards → Columns → Cards, with Labels and Users
  seed.ts              Seed data for local development
```

---

## Local development

```bash
# 1. Install
npm install

# 2. Copy env and fill in DATABASE_URL, DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL,
#    NEXT_PUBLIC_SUPABASE_ANON_KEY (all from Supabase dashboard → Project Settings → API)
cp .env.example .env

# 3. Disable email confirmation in Supabase dashboard
#    → Authentication → Sign In / Up → toggle "Confirm email" off
#    (v1 of FlowBoard expects an immediate session on signup)

# 4. Apply migrations (creates schema + the auth.users → public.User trigger)
npx prisma migrate reset

# 5. Run
npm run dev
```

FlowBoard targets a Supabase-hosted Postgres. Two of the migrations assume a Supabase-shaped DB and will fail against vanilla Postgres:

- `supabase_auth_trigger` references `auth.users`
- `realtime` references `auth.uid()`, `supabase_realtime` publication, and the `authenticated` role

The `realtime` migration also issues `GRANT SELECT` on the Card, Column, and Board tables to the `authenticated` role. These grants are required because the RLS policy on Card joins through Column and Board — without SELECT on all three, the policy's EXISTS subquery returns false and Supabase Realtime silently drops the event with no error frame. If you ever see "WebSocket subscribes ok, heartbeats flow, but no `postgres_changes` events arrive" on a new table, check the grants first.

Required env vars:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Pooled Postgres connection (Supabase pooler) |
| `DIRECT_URL` | Direct Postgres connection (used by Prisma migrate) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (for the auth client) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key (for the auth client) |
| `NEXT_PUBLIC_DEMO_MODE` | Set to `"true"` to render the demo-mode toggle in the header |

---

## Deployment (Vercel + Supabase)

1. **Supabase** — create a project, run `npx prisma migrate deploy` against `DIRECT_URL`, and copy API keys into Vercel env vars.
2. **Vercel** — import the repo, set build command `npm run build`, and add all env vars from the table above.
3. **Auth** — add your Vercel domain to Supabase → Authentication → URL Configuration (Site URL + redirect URLs).
4. **Verify** — sign up, create a board, drag a card across columns, and confirm realtime sync in a second tab.

Set `NEXT_PUBLIC_DEMO_MODE=true` in preview/production if you want the failure-injection toggle visible to reviewers.

### E2E tests (Playwright)

```bash
npx playwright install chromium
PLAYWRIGHT_BOARD_ID=<your-board-id> npm run test:e2e
```

Tests assume you are already signed in via stored auth or a seeded session. Set `PLAYWRIGHT_BASE_URL` when targeting a deployed preview.

---

## What's next

- **AI-assisted card creation** — suggest priority and description from a title using the Claude API
- **Virtualization** for boards with hundreds of cards per column
- **Command palette** for power-user navigation
