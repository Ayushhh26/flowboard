# FlowBoard

[![mcp npm](https://img.shields.io/npm/v/flowboard-mcp-server?label=mcp%20server&logo=npm)](https://www.npmjs.com/package/flowboard-mcp-server)
[![license](https://img.shields.io/github/license/Ayushhh26/flowboard)](./LICENSE)

A Kanban workspace with optimistic updates, cross-column drag-and-drop, and a strict split between server state (React Query) and UI state (Zustand).

> **Live demo:** [flowboard-kapp.vercel.app](https://flowboard-kapp.vercel.app) · **Demo mode:** toggle the pill in the header (when `NEXT_PUBLIC_DEMO_MODE=true`) to simulate a server failure mid-drag and watch the optimistic update roll back with a toast.

---

## Features

- **Kanban board** — columns and cards with drag-and-drop (`@dnd-kit`), inline edits, labels, priorities, assignees
- **Board sharing** — invite collaborators by email with `editor` or `viewer` roles
- **Filters** — priority, assignee, and label filters on the board toolbar
- **Realtime sync** — Supabase Realtime keeps multiple tabs in sync
- **Smart Add** — natural-language card creation with preview (requires `GROQ_API_KEY`)
- **MCP server** — [`flowboard-mcp-server`](https://www.npmjs.com/package/flowboard-mcp-server) for agent-driven board ops via personal API tokens
- **Light / dark theme** — manual toggle, persisted in localStorage

---

## Stack

- **Next.js 16** (App Router) + **TypeScript** (strict)
- **Tailwind CSS v4** + **Radix UI** primitives (Dialog, Dropdown, Tooltip)
- **TanStack React Query** (server state) + **Zustand** (UI state)
- **@dnd-kit** (drag-and-drop) + **Framer Motion** (animations)
- **Prisma 7** + **PostgreSQL** (Supabase) + **sonner** (toasts)

---

## Architecture notes

A few choices that are easy to miss when skimming the UI.

### 1. Server state and UI state live in different stores

React Query owns everything that came from the server (boards, columns, cards). Zustand owns everything ephemeral (which drawer is open, whether demo mode is on). The two never mix.

**Why:** Putting API data in a global UI store turns every fetch, mutation, and refetch into manual cache plumbing. React Query already handles caching, deduping, and invalidation. Zustand holds only state with no server counterpart, so there is always one source of truth for board data.

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

**Why:** If you wait until drop to update state, the card jumps to its new column at the end instead of following the pointer. Updating during `onDragOver` keeps movement in sync with the drag. A `lastOverId` ref skips redundant cache writes when the pointer hasn't crossed a new target, and a `boardSnapshot` ref captures the pre-drag state so cancel restores cleanly.

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

### 5. Demo mode (simulated mutation failures)

When `NEXT_PUBLIC_DEMO_MODE=true`, a header toggle sets a Zustand flag. While enabled, `useMoveCard` sends `x-simulate-failure: true`; the API returns 500. The toggle resets after one failure so the next drag succeeds normally.

**Why:** Rollback paths are awkward to test by hand. Demo mode forces a failed move on demand so `onError` snapshot restore and error toasts stay verified during development.

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
2. **Copy** [`.cursor/mcp.json.example`](.cursor/mcp.json.example) to `.cursor/mcp.json` (or add to Cursor Settings → MCP) and set `FLOWBOARD_API_TOKEN` and `FLOWBOARD_BOARD_ID`.
3. Use **`npx -y flowboard-mcp-server`** as the command (no clone or local build required). Defaults to the live app at `https://flowboard-kapp.vercel.app`; set `FLOWBOARD_BASE_URL` when pointing at a local dev server.
4. **Restart Cursor** — the `flowboard` MCP server appears with its tools.

To develop the MCP package in this repo: `npm run mcp:build` then point Cursor at `packages/mcp-server/dist/index.js` (see `docs/mcp-setup.md`).

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
| `FLOWBOARD_BASE_URL` | MCP env | All MCP tools (default `https://flowboard-kapp.vercel.app`; use `http://localhost:3000` for local dev) |
| `FLOWBOARD_BOARD_ID` | MCP env | Optional default board for tools that accept `boardId` |

---

## Project structure

```
src/
  app/                 Next.js App Router (pages + API routes)
    api/
      boards/          CRUD, columns, labels, members, invitations
        [id]/cards/
          parse/       Smart Add — preview-only (browser)
          from-text/   Smart Add — atomic create (MCP)
          search/      Filterable list (MCP search_cards)
      cards/           Card update, move
      columns/         Column CRUD, cards, move
      tokens/          API token create / revoke (MCP auth)
      features/        Feature flags (e.g. Smart Add enabled)
  components/
    board/             BoardCanvas, Column, CardItem, CardDrawer, FilterBar, ShareBoardDialog, SmartAddCardDialog
    settings/          ApiTokensDialog (create/revoke MCP tokens)
    ui/                Button, Badge, Skeleton, InlineEdit, ThemeToggle primitives
  hooks/               useBoard, useMoveCard, useCreateCard, useParseCard, useSmartCreateCard, useBoardRealtime, …
  lib/
    ai/                Groq client, prompt, draft validation
    auth.ts            requireUser (cookie) + requireActor (cookie OR Bearer token)
    cn.ts              className helper
    db.ts              Prisma client
    fractionalIndex.ts Card/column ordering (floats)
  stores/              useDrawerStore, useDemoStore, useFilterStore, useThemeStore, …
  types/               Shared types (Board, Card, Column, ApiResponse, agent)
packages/
  mcp-server/          flowboard-mcp-server — stdio MCP server with 6 tools
prisma/
  schema.prisma        Boards, Columns, Cards, Labels, Users, BoardMember, ApiToken, …
  seed.ts              Seed data for local development
design-system/
  MASTER.md            Typography, colors, interaction tokens
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

Set `NEXT_PUBLIC_DEMO_MODE=true` in preview or production to show the demo-mode toggle in the header.

### E2E tests (Playwright)

```bash
npx playwright install chromium
PLAYWRIGHT_BOARD_ID=<your-board-id> npm run test:e2e
```

Tests log in via `e2e/auth.setup.ts` using `PLAYWRIGHT_EMAIL` and `PLAYWRIGHT_PASSWORD`. Omit `PLAYWRIGHT_BOARD_ID` to use the first board on the home page. Set `PLAYWRIGHT_BASE_URL` when targeting a deployed preview. Locally, Playwright starts `npm run dev`; in CI it runs against `npm run start` after `npm run build`.

### Unit tests

```bash
npm run test:unit
```

Covers Smart Add draft validation (`src/lib/ai/parseCardDraft.test.ts`) and board card search (`src/lib/searchBoardCards.test.ts`). The MCP package has its own tests: `npm run mcp:test`.

### CI (GitHub Actions)

On every push to `main` and on pull requests, [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs:

1. `npm run lint`
2. `npx prisma generate`
3. `npm run typecheck`
4. `npm run mcp:typecheck` and `npm run mcp:test`
5. `npm run build` and `npm run mcp:build`
6. Playwright E2E against a production build (`npm run start` via `playwright.config.ts` `webServer`)

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
