# FlowBoard

[![mcp npm](https://img.shields.io/npm/v/flowboard-mcp-server?label=mcp%20server&logo=npm)](https://www.npmjs.com/package/flowboard-mcp-server)
[![license](https://img.shields.io/github/license/Ayushhh26/flowboard)](./LICENSE)

A Kanban workspace built to explore the hard parts of building production-grade frontend systems: optimistic state, drag-and-drop across containers, and clean separation between server and UI state.

> **Live demo:** [flowboard-kapp.vercel.app](https://flowboard-kapp.vercel.app) · **Demo mode:** toggle the pill in the header to simulate a server failure mid-drag and watch the optimistic update roll back with a toast.

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

## AI features

FlowBoard ships two AI surfaces backed by the **same parse pipeline** and the **same REST API**:

| Surface | User | Auth | Entry |
|---------|------|------|-------|
| **Smart Add** | Human, in the browser | Supabase session cookie | Floating sparkle button on the board |
| **MCP server** | Agent, in Cursor / Claude Code | Personal API token (`fb_…`) | `packages/mcp-server` (stdio) |

```text
┌──────────┐   ┌────────────────────────┐    ┌──────────────┐
│ Browser  │──▶│  POST /cards/parse     │──▶│ Groq         │
│ Smart Add│   │  POST /cards/from-text │   │ structured   │
└──────────┘   │  REST /api/...         │   │ JSON         │
               │                        │   └──────┬───────┘
┌──────────┐   │  requireActor:         │          │
│ Cursor / │──▶│  Bearer fb_… OR cookie │◀─────────┘
│ MCP tool │   └──────┬─────────────────┘
└──────────┘          │
                ┌─────▼──────┐
                │ PostgreSQL │
                └────────────┘
```

### Smart Add (browser)

A short prompt like _"fix the login bug on mobile, urgent, assign to Alice"_ becomes a fully-structured card — title, description, priority, column, assignee, labels — with a **preview-and-confirm** step before anything is written.

The pipeline:

1. `POST /api/boards/[id]/cards/parse` loads board context (columns, members, labels).
2. The server calls **Groq** with a JSON-schema-constrained prompt (default model `openai/gpt-oss-20b`, with a `json_object` fallback for models that don't support `json_schema`).
3. The response is validated against the **actual board IDs** — a hallucinated `columnId` or member never reaches the DB.
4. The UI renders a preview card; on confirm, the existing `useCreateCard` / `useUpdateCard` hooks insert it.

Files: [`src/lib/ai/parseCardPrompt.ts`](src/lib/ai/parseCardPrompt.ts) · [`parseCardFromText.ts`](src/lib/ai/parseCardFromText.ts) · [`parseCardDraft.ts`](src/lib/ai/parseCardDraft.ts) · [`src/app/api/boards/[id]/cards/parse/route.ts`](src/app/api/boards/[id]/cards/parse/route.ts) · [`src/components/board/SmartAddCardDialog.tsx`](src/components/board/SmartAddCardDialog.tsx).

The Smart Add button is hidden when `GROQ_API_KEY` is not configured (the client checks `GET /api/features`).

### MCP server (Cursor / Claude Code)

[`flowboard-mcp-server`](https://www.npmjs.com/package/flowboard-mcp-server) is a stdio MCP server in [`packages/mcp-server`](packages/mcp-server). It exposes six tools that hit the **same REST API** as the browser using a personal Bearer token — no direct DB access, no shared secrets.

| Tool | Calls |
|------|-------|
| `get_board` | `GET /api/boards/{id}` |
| `get_board_summary` | Same board, aggregated locally (counts, urgent list) |
| `search_cards` | `GET /api/boards/{id}/cards/search` |
| `create_card` | `POST /api/columns/{columnId}/cards` (+ optional `PATCH /api/cards/{id}`) |
| `create_card_from_text` | `POST /api/boards/{id}/cards/from-text` (Smart Add parser → atomic create) |
| `move_card` | `POST /api/cards/{id}/move` |

Setup is in [`docs/mcp-setup.md`](docs/mcp-setup.md). The short version:

1. **Create an API token** in FlowBoard (user menu → API tokens) and copy the `fb_…` value.
2. **Build the server:** `npm run mcp:build`.
3. **Copy** [`.cursor/mcp.json.example`](.cursor/mcp.json.example) to `.cursor/mcp.json` and fill in the token, board ID, and the absolute path to `dist/index.js`.
4. **Restart Cursor** and the `flowboard` MCP server appears with its tools.

### Security model

- Tokens are stored as **SHA-256 hashes** (`ApiToken.tokenHash`); the plaintext is shown once at creation and never logged or returned again.
- Every API route uses **`requireActor(req)`** ([`src/lib/auth.ts`](src/lib/auth.ts)), which accepts either a Supabase session cookie or a `Bearer fb_…` token. Permissions (`boardReadAccess`, `boardWriteAccess`, `boardOwnerAccess`) apply identically to both.
- `GROQ_API_KEY` is **server-only** — there is no browser call to Groq.
- The MCP package contains no DB driver and no Supabase keys; it only knows your HTTP base URL and your token.

### Environment

| Variable | Where | Required for |
|----------|-------|--------------|
| `GROQ_API_KEY` | Server | Smart Add (browser + MCP `create_card_from_text`) |
| `GROQ_MODEL` | Server | Optional override (defaults to `openai/gpt-oss-20b`) |
| `FLOWBOARD_API_TOKEN` | MCP env | All MCP tools |
| `FLOWBOARD_BASE_URL` | MCP env | All MCP tools (default `http://localhost:3000`) |
| `FLOWBOARD_BOARD_ID` | MCP env | Optional default board for tools that accept `boardId` |

---

## Project structure

```
src/
  app/                 Next.js App Router (pages + API routes)
    api/               REST endpoints for boards, columns, cards, tokens
      boards/[id]/
        cards/
          parse/       Smart Add — preview-only (browser)
          from-text/   Smart Add — atomic create (MCP)
          search/      Filterable list (MCP search_cards)
  components/
    board/             BoardCanvas, Column, CardItem, CardDrawer, SmartAddCardDialog
    settings/          ApiTokensDialog (create/revoke MCP tokens)
    ui/                Button, Badge, Skeleton, InlineEdit primitives
  hooks/               useBoard, useMoveCard, useCreateCard, useParseCard, useSmartCreateCard
  lib/
    ai/                groq client, prompt, draft validation
    auth.ts            requireUser (cookie) + requireActor (cookie OR Bearer token)
    fractionalIndex.ts cn (className helper), Prisma client
  stores/              useDrawerStore, useDemoStore, useFilterStore
  types/               Shared types (Board, Card, Column, ApiResponse, agent)
packages/
  mcp-server/          flowboard-mcp-server — stdio MCP server with 6 tools
prisma/
  schema.prisma        Boards → Columns → Cards, plus Labels, Users, ApiToken
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
| `GROQ_API_KEY` | Optional — enables Smart Add (browser) and `create_card_from_text` (MCP) |

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

Tests log in via `e2e/auth.setup.ts` using `PLAYWRIGHT_EMAIL` and `PLAYWRIGHT_PASSWORD`. Omit `PLAYWRIGHT_BOARD_ID` to use the first board on the home page. Set `PLAYWRIGHT_BASE_URL` when targeting a deployed preview.

### CI (GitHub Actions)

On every push to `main` and on pull requests, [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run build`
4. Playwright E2E against a production build (`npm run start`)

**Repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Required |
|--------|----------|
| `DATABASE_URL` | Yes |
| `DIRECT_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |
| `PLAYWRIGHT_EMAIL` | Yes — dedicated test user |
| `PLAYWRIGHT_PASSWORD` | Yes |
| `PLAYWRIGHT_BOARD_ID` | No — omit to auto-pick first board |

Use the same Supabase project as production or a separate staging project. The test user must have at least one board (or create one before E2E runs).

Vercel deployment is unchanged: merge to `main` still auto-deploys. CI is an extra quality gate before you merge.

---

## What's next

- **Virtualization** for boards with hundreds of cards per column
- **Command palette** for power-user navigation
- Submit `flowboard-mcp-server` to the [Cursor Directory](https://cursor.directory/mcp) and [awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) for discoverability
