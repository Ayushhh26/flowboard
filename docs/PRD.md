# ProjectFlow — Product Requirements Document

**Version:** 2.0
**Author:** Ayush
**Date:** April 30, 2026
**Status:** Pre-Development
**Revision Note:** v2.0 incorporates scope revisions — Tier 1 split into MVP-A and MVP-B, component strategy revised to use Radix primitives with custom wrappers, demo modes added, timeline adjusted, performance/accessibility claims tightened.

---

## 1. Overview

### 1.1 What Is ProjectFlow?

ProjectFlow is a collaborative Kanban workspace for managing tasks across teams. It provides drag-and-drop board management, real-time task tracking, and a responsive interface designed around frontend engineering depth — component architecture, interaction design, accessibility, and performance under scale.

### 1.2 Why Build This?

This project exists to solve a specific portfolio gap: demonstrating frontend engineering depth beyond "full-stack apps built with React." Every feature is chosen to expose a real UI/UX engineering problem — drag-and-drop mechanics, optimistic state management, keyboard accessibility, virtualized rendering, responsive layout — that maps directly to what frontend-focused companies (IXL, Garmin, Linear, Vercel, etc.) evaluate in candidates.

### 1.3 What ProjectFlow Is NOT

- Not a Trello clone with basic CRUD and drag-and-drop bolted on
- Not a backend-heavy project that happens to have a React frontend
- Not a feature-bloated app — every feature must justify its existence as a frontend engineering signal
- Not a production SaaS — auth, billing, and multi-tenancy are explicitly out of scope

### 1.4 The Demo Milestone Test

The project is not "done" until this sentence is true:

> "I can show a recruiter a polished board where I drag a card, the UI updates instantly, I toggle simulated network failure, drag another card, and it visibly rolls back with a toast."

That single interaction demonstrates: drag-and-drop mechanics, optimistic state management, error handling, and UI polish. Everything else in this PRD layers depth on top of that moment.

---

## 2. Target Users

For project scoping purposes, the assumed user is a **small team (2–5 people) managing tasks on a shared board.** This assumption drives decisions around state complexity, real-time sync, and concurrent editing concerns. No enterprise features (role hierarchies, audit trails, SSO).

---

## 3. Tech Stack

### 3.1 Frontend

| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js (App Router) | Industry standard, SSR/RSC capability, file-based routing |
| Language | TypeScript (strict mode) | Non-negotiable for frontend roles — strict types, no `any` |
| Styling | Tailwind CSS | Utility-first, fast iteration, widely expected |
| Client State | Zustand | Lightweight, no boilerplate — manages pure UI state (drawer open/closed, active filters, drag state) |
| Server State | TanStack React Query | Fetching, caching, mutations, optimistic updates, background refetch — the backbone of the data layer |
| Drag-and-Drop | @dnd-kit/core + @dnd-kit/sortable | Modern, maintained, keyboard-accessible, highly customizable |
| Accessible Primitives | Radix UI | Headless accessible behavior for Dialog, Dropdown, Popover — wrapped in custom styled components |
| Virtualization | @tanstack/react-virtual | Virtualized card rendering for large columns (Tier 3) |
| Animation | Framer Motion | Card transitions, drawer slide-in, layout animations |
| Toasts | sonner | Lightweight, accessible toast notifications with undo support |

### 3.2 Backend

| Layer | Technology | Rationale |
|---|---|---|
| Runtime | Node.js + Express | Familiar stack, fast to build |
| Database | PostgreSQL | Relational model is correct for ordered, related entities (boards → columns → cards). Foreign keys, ordering, joins. Shows range beyond MongoDB |
| ORM | Prisma | Type-safe DB access, schema-driven migrations, pairs well with TypeScript |

### 3.3 Infrastructure

| Layer | Technology |
|---|---|
| Frontend Hosting | Vercel |
| Database Hosting | Supabase (PostgreSQL) or Railway |
| Version Control | GitHub (public repo) |

### 3.4 Component Strategy — Radix + Custom Wrappers

**Principle:** Use Radix UI for hard accessibility behavior (focus trapping, keyboard navigation, portal rendering, scroll lock). Build your own styled wrappers on top. Build simple components (Button, Badge, Avatar, Skeleton, InlineEdit) entirely from scratch.

**Why this approach:**
- Production frontend teams use accessible headless primitives — building a broken Dropdown from scratch is worse than wrapping Radix correctly
- Wrapping Radix still requires understanding component composition, prop forwarding, `forwardRef`, and styling integration
- Interviewers respect the decision: "I used Radix for the accessibility guarantees and built my own design system on top"

**What uses Radix underneath:**
- `Drawer` → wraps Radix Dialog (with Framer Motion animation)
- `Modal` → wraps Radix Dialog
- `Dropdown` → wraps Radix DropdownMenu
- `Tooltip` → wraps Radix Tooltip

**What you build from scratch:**
- `Button` — variants, sizes, loading state, disabled state
- `Badge` — priority badges, label chips, status indicators
- `Avatar` — image with fallback to initials
- `Skeleton` — loading placeholder with shimmer animation
- `EmptyState` — centered message with icon
- `InlineEdit` — click-to-edit text field, blur/Enter to save, Escape to cancel
- `Toast` (via sonner configuration) — styled wrapper with undo action support

**Shared patterns across all components:**
- `forwardRef` for DOM access
- Composed with `className` prop merging (via `cn` utility using `clsx` + `tailwind-merge`)
- Keyboard interactions implemented
- TypeScript generics where applicable (e.g., typed `Dropdown<T>` option values)

---

## 4. Data Model

### 4.1 Entity Relationship

```
Board (1) ──→ (many) Column (1) ──→ (many) Card
                                          │
                                          ├── assignee → User
                                          └── labels[] → Label
```

### 4.2 Schema

```
users
├── id           UUID (PK)
├── name         VARCHAR(100)
├── email        VARCHAR(255) UNIQUE
├── avatar_url   VARCHAR(500) NULLABLE
├── created_at   TIMESTAMP

boards
├── id           UUID (PK)
├── name         VARCHAR(200)
├── owner_id     UUID (FK → users.id)
├── created_at   TIMESTAMP
├── updated_at   TIMESTAMP

columns
├── id           UUID (PK)
├── board_id     UUID (FK → boards.id)
├── title        VARCHAR(100)
├── order_index  FLOAT   ← fractional indexing
├── created_at   TIMESTAMP

cards
├── id           UUID (PK)
├── column_id    UUID (FK → columns.id)
├── title        VARCHAR(300)
├── description  TEXT NULLABLE
├── priority     ENUM('none', 'low', 'medium', 'high', 'urgent')
├── order_index  FLOAT   ← fractional indexing
├── assignee_id  UUID (FK → users.id) NULLABLE
├── created_at   TIMESTAMP
├── updated_at   TIMESTAMP

labels
├── id           UUID (PK)
├── board_id     UUID (FK → boards.id)
├── name         VARCHAR(50)
├── color        VARCHAR(7)   ← hex color code

card_labels (junction)
├── card_id      UUID (FK → cards.id)
├── label_id     UUID (FK → labels.id)
└── PK (card_id, label_id)
```

### 4.3 Fractional Indexing — Why and How

**Problem:** Traditional integer ordering (1, 2, 3, 4) means moving card 4 between cards 1 and 2 requires updating cards 2, 3, and 4. That's O(n) writes per reorder.

**Solution:** Use float-based `order_index`. Cards are initially spaced at 1.0, 2.0, 3.0. Moving a card between two others computes the midpoint:

```
Move card between order_index 1.0 and 2.0 → new order_index = 1.5
Move card between 1.0 and 1.5 → new order_index = 1.25
```

**This reduces every reorder to a single-row UPDATE** regardless of board size.

**Edge case: Precision exhaustion.** After many repeated insertions at the same position, floats lose precision. Solution: periodically re-index the entire column (set to 1.0, 2.0, 3.0 ...) as a background cleanup. This is a rare event and can happen async.

**Edge case: Moving to first/last position.** Moving to the top = `first_card.order_index - 1.0`. Moving to the bottom = `last_card.order_index + 1.0`.

---

## 5. Feature Specification

Features are organized into milestones. MVP-A is the first demoable checkpoint. MVP-B completes the product. Tiers 2 and 3 add depth.

---

### 5.1 MVP-A — Core Demo (Build This First, Deploy This First)

**Goal:** A working board with drag-and-drop and optimistic rollback. This is demoable and deployable. Nothing beyond this list ships until MVP-A is polished.

---

#### F1: Board View

**What:** A horizontal scrollable board displaying columns, each containing a vertical list of task cards.

**Requirements:**
- Board displays all columns side-by-side in a horizontally scrollable container
- Each column has a header (title, card count) and a scrollable card list
- "Add Card" button at the bottom of each column
- Columns and cards load from the API via React Query with loading skeletons (not spinners)

**UI Details:**
- Column width: fixed 320px
- Card: rounded corners, subtle shadow, shows title and priority badge
- Empty column shows a centered "No tasks yet" empty state

**Engineering Notes:**
- Data fetched with `useQuery` — single query for the board that includes nested columns and cards
- Loading state: skeleton placeholders that match the card/column shape (shimmer animation)
- Error state: retry button with error message, not a blank screen

---

#### F2: Card Drag-and-Drop Across Columns

**What:** Cards can be dragged within a column (reorder) and across columns (move).

**Library:** `@dnd-kit/core` + `@dnd-kit/sortable`

**Requirements:**
- Cards are draggable by clicking and holding anywhere on the card
- While dragging, the original card position shows a subtle placeholder (dashed border, muted background)
- The dragged card follows the cursor with a slight scale-up and drop shadow (via `DragOverlay`)
- Dropping a card between two cards in any column inserts it at that position
- Dropping a card on an empty column adds it as the first card
- Scrolling occurs automatically when dragging near the top/bottom edge of a column

**Engineering Notes:**
- Use `DndContext` with `SortableContext` for each column
- `closestCorners` collision detection for cross-column drops
- `DragOverlay` for the floating card during drag (renders a clone, not the original)
- On drag end: compute new `order_index` via fractional indexing, fire mutation
- Column reordering is NOT in MVP-A — cards only

---

#### F3: Optimistic Updates with Rollback

**What:** When a card is moved, the UI updates instantly without waiting for the server. If the server request fails, the UI rolls back to the previous state and shows an error toast.

**This is the single most important frontend engineering feature in the project.**

**Requirements:**
- Card moves reflect in the UI within the same animation frame as the drop
- No loading spinner or disabled state during the mutation
- On API failure: card animates back to its original position, toast appears: "Failed to move task. Please try again."
- On API success: background refetch to reconcile any drift
- Multiple rapid moves should not cause race conditions — each mutation captures its own rollback snapshot

**Implementation Pattern (React Query):**

```
useMutation({
  mutationFn: moveCard,
  onMutate: async (newData) => {
    // 1. Cancel in-flight refetches to prevent overwrites
    await queryClient.cancelQueries({ queryKey: ['board', boardId] })

    // 2. Snapshot current state for rollback
    const previousBoard = queryClient.getQueryData(['board', boardId])

    // 3. Optimistically update the cache
    queryClient.setQueryData(['board', boardId], (old) => {
      // move the card in the cached data
    })

    return { previousBoard }
  },
  onError: (err, newData, context) => {
    // 4. Rollback to snapshot
    queryClient.setQueryData(['board', boardId], context.previousBoard)
    toast.error('Failed to move task')
  },
  onSettled: () => {
    // 5. Refetch to reconcile
    queryClient.invalidateQueries({ queryKey: ['board', boardId] })
  }
})
```

---

#### F4: Basic Task Drawer

**What:** Clicking a card opens a side panel from the right edge of the screen, displaying the card's details. For MVP-A, this is read-mostly with inline title editing only.

**Requirements:**
- Drawer slides in from the right with a Framer Motion animation (200ms ease-out)
- Overlay: semi-transparent dark backdrop on the board behind the drawer
- Drawer width: 480px on desktop, full-width on mobile
- Close via: X button, Escape key, clicking the overlay
- Uses Radix Dialog underneath for focus trap and portal rendering

**MVP-A Drawer Contents:**
- **Title** — inline editable (click to edit, blur or Enter to save)
- **Priority** — displayed as a badge (read-only in MVP-A, editable in MVP-B)
- **Description** — displayed as text (read-only in MVP-A)
- **Created / Updated** timestamps at the bottom, muted text

**Engineering Notes:**
- Drawer state (open/closed, active card ID) lives in Zustand
- Title edit triggers a mutation with optimistic update
- On open, focus moves to the drawer (managed by Radix Dialog). On close, focus returns to the card that was clicked.

---

#### F5: Card CRUD (Basic)

**What:** Users can create and delete cards.

**Create:**
- "Add Card" button at the bottom of each column
- Clicking it reveals an inline input field (not a modal) at the bottom of the column
- User types a title and presses Enter to create, Escape to cancel
- New card appears at the bottom of the column with optimistic UI
- After creation, the input stays active for rapid multi-card creation

**Delete:**
- Available via a "..." button that appears on card hover
- Card disappears immediately (optimistic), rolls back if API fails
- No confirmation modal in MVP-A (added in MVP-B)

---

#### F6: Seed Data

**What:** The project ships with realistic seed data so the demo board is never empty.

**Board: "Product Launch Q3"**

| Column | Cards |
|---|---|
| Backlog | "Research competitor pricing", "Draft announcement blog post", "Accessibility audit for landing page", "Write API migration guide", + 3 more |
| To Do | "Design onboarding flow", "Set up error monitoring", "Create email templates" |
| In Progress | "Build notification system", "Refactor auth middleware" |
| Review | "Landing page redesign", "Performance profiling report" |
| Done | "Set up CI/CD pipeline", "Database schema migration", "Design system v2 tokens" |

Each card has: realistic title, varied priorities. Assignees and labels are seeded but not displayed until MVP-B.

**Seeded users:** Ayush (owner), Alice Chen, Marcus Rivera — with placeholder avatar URLs.

---

#### F7: Demo Mode Toggle

**What:** A small floating button (bottom-right corner, dev-tools style) that toggles demo modes for interview presentations.

**Modes:**

1. **Normal** — default behavior, all API calls work
2. **Simulate Network Failure** — next card move mutation returns a 500 error, triggering visible rollback + toast. After one failure, reverts to normal. This is the optimistic rollback demo moment.

**Engineering Notes:**
- Implement as a Zustand flag: `simulateFailure: boolean`
- In the API route (or fetch wrapper), check the flag and return an error response before hitting the database
- The toggle is visible only when a `NEXT_PUBLIC_DEMO_MODE=true` env var is set (hidden in production if you want, visible for interview demos)
- Later tiers add: "Large Board (500 cards)" mode for virtualization demo, "Keyboard DnD" mode with on-screen instructions

---

#### F8: TypeScript Data Model

**What:** Strict TypeScript types for every entity, API response, and mutation payload.

**Requirements:**
- No `any` anywhere in the codebase
- Drag event types fully specified (not casting to `any` in DnD handlers)
- UI state types in Zustand store are explicit interfaces

**Core Types:**

```typescript
type Priority = 'none' | 'low' | 'medium' | 'high' | 'urgent'

interface Card {
  id: string
  columnId: string
  title: string
  description: string | null
  priority: Priority
  orderIndex: number
  assigneeId: string | null
  assignee: User | null
  labels: Label[]
  createdAt: string
  updatedAt: string
}

interface Column {
  id: string
  boardId: string
  title: string
  orderIndex: number
  cards: Card[]
}

interface Board {
  id: string
  name: string
  ownerId: string
  columns: Column[]
}

// Mutation payloads — separate from entities
interface MoveCardPayload {
  cardId: string
  targetColumnId: string
  newOrderIndex: number
}

interface UpdateCardPayload {
  cardId: string
  title?: string
  description?: string | null
  priority?: Priority
  assigneeId?: string | null
  labelIds?: string[]
}
```

---

#### F9: README Draft + Deploy

**What:** Deploy MVP-A to Vercel with a basic README.

**README at this stage:**
- Project name, one-line description
- Screenshot of the board
- GIF of drag-and-drop + optimistic rollback (the main demo moment)
- Tech stack table
- Getting Started (clone, install, seed, run)

**This is the first deployable checkpoint.** From this point, the project goes on the resume and live demo link goes on applications, even while MVP-B and Tier 2 are still in progress.

---

### 5.2 MVP-B — Product Completeness

**Goal:** The board feels like a real product. All CRUD operations, full drawer editing, column management, filters. Build after MVP-A is deployed and stable.

---

#### F10: Column Management

**Create:**
- "Add Column" button (+ icon) after the last column
- Inline input appears, user types title, Enter to create

**Rename:**
- Double-click column title to edit inline

**Delete:**
- Column options menu → "Delete Column"
- If column contains cards: "This column has X tasks. Move them to [dropdown] or delete them."
- Empty column: confirmation dialog via Radix Dialog

**Reorder:**
- Columns are draggable by their header area only
- Uses the same `@dnd-kit` context with a separate `SortableContext` for columns

---

#### F11: Full Task Drawer

**What:** Expand the MVP-A drawer with all editable fields.

**Added Drawer Contents:**
- **Status** — dropdown matching column names (changing status moves the card to that column, with optimistic update)
- **Priority** — dropdown (none / low / medium / high / urgent) with color-coded badges
- **Assignee** — dropdown with avatar + name, searchable
- **Labels** — multi-select with colored chips
- **Description** — textarea with auto-resize
- **Delete button** — with confirmation modal

**Engineering Notes:**
- Each field edit triggers an individual mutation with optimistic update
- Status change = card move (same mutation as drag-and-drop, just triggered differently)
- Use Radix DropdownMenu for status/priority/assignee dropdowns

---

#### F12: Undo Actions

**What:** Destructive actions (delete card, move card) show a toast with an "Undo" button.

**Card Delete Flow:**
1. User clicks delete → card disappears immediately (optimistic)
2. Toast appears: "Task deleted. **Undo**" — visible for 5 seconds
3. If user clicks Undo within 5 seconds: card reappears, API delete is cancelled
4. If toast expires: actual DELETE request fires

**Implementation:**
- Don't send the DELETE request immediately. Store the card in a "pending deletion" queue in Zustand
- `setTimeout(5000)` → if not undone, fire the API call
- Undo: remove from pending queue, restore card to React Query cache
- This pattern is how Gmail and Linear handle deletes

**Card Move (optional):**
- After drag-and-drop: "Moved to [column]. **Undo**"
- Undo: revert to previous column/position using the snapshot from `onMutate`

---

#### F13: Filtering and Search

**What:** Users can filter the board by priority, assignee, and label. A search bar filters cards by title.

**Requirements:**
- Filter bar sits above the board, below the board title
- Filters: Priority (multi-select checkboxes), Assignee (multi-select with avatars), Label (multi-select with colored chips)
- Search: text input with debounced (300ms) filtering
- Active filters show as removable chips: "Priority: High ×" "Assignee: Ayush ×"
- "Clear all filters" button when any filter is active
- Filtered-out cards are hidden — column card counts update to reflect filtered totals
- If all cards in a column are filtered out, show empty state: "No tasks match filters"

**Engineering Notes:**
- Filter state lives in Zustand (pure UI state — not persisted to server)
- Displayed cards = derived state: `board.columns.map(col => col.cards.filter(matchesFilters))`
- Filter client-side from cached React Query data — do NOT re-fetch
- Debounce search input to avoid re-renders on every keystroke

---

#### F14: Loading, Error, and Empty States

**What:** Every async operation has proper loading, error, and empty state handling.

**Loading:**
- Board: skeleton columns with skeleton cards (shimmer animation)
- Drawer: skeleton fields
- Never show raw spinners

**Error:**
- Board fetch failure: centered error with "Retry" button
- Mutation failure: toast with error message (already handled by optimistic rollback)
- Network offline: banner at top "You're offline — changes will sync when reconnected" (stretch)

**Empty:**
- Empty board (no columns): "Get started by adding your first column" with prominent button
- Empty column: "No tasks yet" with muted icon
- Empty filter results: "No tasks match your filters" with "Clear filters" button

---

### 5.3 Tier 2 — Frontend Engineering Depth

These features transform the project from "good Kanban app" to "frontend engineering showcase." Build after MVP-B is stable.

---

#### F15: Keyboard-Accessible Drag and Drop

**What:** The entire drag-and-drop interaction works without a mouse, with screen-reader announcements.

**Why this matters:** Extremely strong resume signal. Almost zero portfolio projects implement this. Maps directly to accessibility requirements at companies like IXL (education — legal accessibility requirements).

**Requirements:**
- Focusable cards via Tab key with visible focus ring
- Space/Enter on a focused card enters "drag mode"
- Arrow keys move the card (Up/Down within column, Left/Right across columns)
- Space/Enter again drops the card
- Escape cancels, returns card to original position
- ARIA live region announces every action:
  - Pickup: "Task: Fix login bug. Picked up. Column In Progress, position 3 of 7."
  - Move: "Moved to column Review, position 1 of 4."
  - Drop: "Dropped in column Review, position 1 of 4."
  - Cancel: "Drag cancelled. Returned to In Progress, position 3 of 7."

**Engineering Notes:**
- `@dnd-kit` provides `KeyboardSensor` — configure with custom `coordinateGetter`
- `announcements` prop on `DndContext` for screen reader text
- `aria-live="assertive"` for drag announcements
- Test with VoiceOver (macOS) or NVDA (Windows) to verify

**Demo mode addition:** When "Keyboard DnD" demo mode is active, an on-screen instruction panel appears: "Tab to a card → Space to pick up → Arrow keys to move → Space to drop → Escape to cancel"

---

#### F16: Focus Management

**What:** Rigorous focus handling across all interactions.

**Requirements:**
- Opening drawer: focus moves to drawer (Radix handles this)
- Closing drawer: focus returns to the card that triggered it (requires manual `ref` tracking)
- After deleting a card: focus moves to the next card in the column, or the "Add Card" button if it was the last card
- Dropdown close: focus returns to trigger button (Radix handles this)
- Visible focus rings on ALL focusable elements: 2px solid blue-500, 2px offset
- No focus ring on mouse click (`:focus-visible` only, not `:focus`)

---

#### F17: Responsive Mobile Layout

**What:** The board transforms into a mobile-friendly layout on screens below 768px.

**Requirements:**
- Columns become horizontally swipeable — one column visible at a time
- Column selector: tab bar at the top showing column names, active column highlighted
- Cards are full-width within the column
- Task drawer becomes a bottom sheet (slides up from bottom, ~85% height)
- Touch-friendly: 44px minimum tap targets, no hover-dependent interactions
- Drag-and-drop: `TouchSensor` with `activationConstraint: { delay: 250, tolerance: 5 }` to distinguish tap from drag

**Engineering Notes:**
- Tailwind responsive prefixes: `md:flex` for desktop, single-column mobile by default
- Bottom sheet: Framer Motion `drag="y"` with snap points
- Test on actual mobile device, not just Chrome DevTools

---

#### F18: Playwright Tests for Core Flows

**What:** End-to-end tests for the critical paths.

**Flows to test:**
- Create board → add column → add cards → verify persistence after refresh
- Drag card to different column → verify it persists
- Open drawer → edit title → verify change on board
- Keyboard drag: Tab → Space → Arrow → Space → verify position
- Filter by priority → verify card count → clear → verify restoration
- Delete card → click Undo → verify card restored

---

### 5.4 Tier 3 — Advanced Polish (Stretch)

Build only if Tiers 1 and 2 are polished and deployed.

---

#### F19: Virtualized Card Lists

**What:** Columns render only the cards visible in the viewport using windowing.

**Why this is Tier 3:** Virtualization + drag-and-drop is one of the hardest integration challenges in this project. `@dnd-kit` sortable items need to reference virtualized rows, drop target measurement breaks for offscreen items, and variable card heights complicate size estimation. Get the core board perfect first.

**Requirements:**
- Use `@tanstack/react-virtual` with `estimateSize` and `measureElement`
- Overscan: 3–5 extra cards above/below viewport
- DnD still works correctly — offscreen cards are valid drop targets
- Scrolling 500 cards feels smooth

**Demo mode addition:** "Large Board" toggle seeds 500 cards into one column for performance demos.

**Validation:** Record a Chrome DevTools Performance trace. Only claim performance numbers on the resume if you have evidence.

---

#### F20: Command Palette

**What:** `Cmd+K` / `Ctrl+K` opens a searchable command palette.

**Commands:** Create task, search tasks, change status, assign, jump to board.

**Build from scratch** (not cmdk) — arrow key navigation, fuzzy search, Enter to execute, Escape to close, recent commands section.

---

#### F21: Real-Time Multi-User Sync

**What:** Board updates live when another user makes changes.

**Implementation:** Supabase Realtime (free with Supabase PostgreSQL) or Socket.IO.

**Requirements:**
- Card moves by other users animate to new position
- Toast: "Alice moved 'Fix login bug' to Review"
- Conflict handling: last-write-wins with reconciliation refetch
- Presence: avatars of users currently viewing the board (optional)

---

#### F22: Activity Log

**What:** Chronological list of changes shown in the task drawer.

**Entries:** "Ayush moved this card from To Do to In Progress — 2 hours ago", "Alice changed priority to High — yesterday"

**Engineering Notes:** Requires a separate `activity` table in the database. Log entries created server-side on each mutation. Displayed in the drawer with relative timestamps.

---

## 6. API Design

RESTful JSON API. All endpoints return consistent response shapes.

### 6.1 Response Envelope

```json
{
  "data": { ... },
  "error": null
}

// Error case:
{
  "data": null,
  "error": { "code": "NOT_FOUND", "message": "Card not found" }
}
```

### 6.2 Endpoints

#### Boards

```
GET    /api/boards              → list user's boards
POST   /api/boards              → create board { name }
GET    /api/boards/:id          → full board with columns and cards (nested)
PATCH  /api/boards/:id          → update board { name }
DELETE /api/boards/:id          → delete board and all children
```

#### Columns

```
POST   /api/boards/:boardId/columns              → create column { title }
PATCH  /api/columns/:id                           → update column { title, orderIndex }
DELETE /api/columns/:id                            → delete column (with card handling)
```

#### Cards

```
POST   /api/columns/:columnId/cards               → create card { title, priority? }
PATCH  /api/cards/:id                              → update card fields
DELETE /api/cards/:id                              → delete card
POST   /api/cards/:id/move                         → move card { targetColumnId, newOrderIndex }
```

#### Users

```
GET    /api/boards/:boardId/members                → list board members
```

### 6.3 The Move Endpoint

```
POST /api/cards/:id/move
Body: {
  "targetColumnId": "uuid",
  "newOrderIndex": 2.5
}
```

**Server logic:**
1. Validate card exists
2. Validate target column exists and belongs to the same board
3. Update card's `column_id` and `order_index` in a single UPDATE
4. Return updated card

**Demo mode hook:** If `simulateFailure` flag is active, return `{ error: { code: "SIMULATED_FAILURE", message: "Simulated network error for demo" } }` with status 500 before touching the database.

---

## 7. State Architecture

### 7.1 The Split: Server State vs. UI State

**Server State (React Query):** Everything that comes from the database — boards, columns, cards, users. Cached, refetchable, invalidatable.

**UI State (Zustand):** Everything that exists only on the client — which drawer is open, active card ID, current filters, drag state, demo mode flags. Never persisted to the server.

```
React Query manages:              Zustand manages:
├── board data                    ├── activeCardId (drawer)
├── column data                   ├── isDrawerOpen
├── card data                     ├── filters { priority, assignee, labels }
├── user/member data              ├── searchQuery
└── mutation state                ├── dragState (active item, overlay)
                                  ├── pendingDeletions (undo queue)
                                  ├── demoMode flags
                                  └── ui preferences (collapsed columns)
```

### 7.2 Zustand Store Shape

```typescript
interface BoardUIState {
  // Drawer
  activeCardId: string | null
  isDrawerOpen: boolean
  openDrawer: (cardId: string) => void
  closeDrawer: () => void

  // Filters
  filters: {
    priorities: Priority[]
    assigneeIds: string[]
    labelIds: string[]
  }
  searchQuery: string
  setFilter: (key: keyof Filters, value: string[]) => void
  setSearchQuery: (query: string) => void
  clearFilters: () => void

  // Undo queue
  pendingDeletions: Map<string, { card: Card; timeoutId: NodeJS.Timeout }>
  addPendingDeletion: (card: Card) => void
  undoDeletion: (cardId: string) => void
  confirmDeletion: (cardId: string) => void

  // Demo mode
  simulateFailure: boolean
  toggleSimulateFailure: () => void

  // Misc UI
  collapsedColumnIds: Set<string>
  toggleColumnCollapse: (columnId: string) => void
}
```

---

## 8. Component Tree

```
App
└── BoardPage
    ├── BoardHeader
    │   ├── BoardTitle (inline editable)
    │   ├── MemberAvatars
    │   └── FilterBar                          ← MVP-B
    │       ├── PriorityFilter
    │       ├── AssigneeFilter
    │       ├── LabelFilter
    │       ├── SearchInput (debounced)
    │       └── ActiveFilterChips
    │
    ├── BoardCanvas (horizontal scroll container)
    │   ├── DndContext
    │   │   ├── SortableContext (columns)       ← column sort: MVP-B
    │   │   │   ├── Column (droppable)
    │   │   │   │   ├── ColumnHeader (title, count, drag handle, menu)
    │   │   │   │   ├── SortableContext (cards)
    │   │   │   │   │   └── SortableCard (draggable)
    │   │   │   │   │       ├── CardTitle
    │   │   │   │   │       ├── PriorityBadge
    │   │   │   │   │       ├── LabelChips      ← MVP-B
    │   │   │   │   │       └── AssigneeAvatar   ← MVP-B
    │   │   │   │   └── AddCardInput (inline)
    │   │   │   └── AddColumnButton              ← MVP-B
    │   │   └── DragOverlay (floating card clone)
    │   │
    │   └── TaskDrawer (Radix Dialog + Framer Motion)
    │       ├── DrawerHeader (title inline edit, close button)
    │       ├── StatusDropdown                    ← MVP-B
    │       ├── PriorityDropdown                  ← MVP-B
    │       ├── AssigneeDropdown                  ← MVP-B
    │       ├── LabelMultiSelect                  ← MVP-B
    │       ├── DescriptionEditor                 ← MVP-B
    │       └── ActivityLog                       ← Tier 3
    │
    ├── DemoModeToggle (floating, bottom-right)
    └── ToastContainer (sonner)
```

---

## 9. Design Specifications

### 9.1 Layout

- Board background: neutral gray (slate-100)
- Column background: white, rounded-xl, subtle shadow
- Column width: 320px fixed
- Column gap: 12px
- Card gap within column: 8px
- Board padding: 24px (16px on mobile)
- Max board height: 100vh minus header, columns scroll independently

### 9.2 Card Design

- Background: white
- Border: 1px solid gray-200
- Border-radius: 8px
- Padding: 12px
- Hover: shadow-md transition
- Priority indicator: 3px left border (color matches priority)
- Priority colors: none=transparent, low=blue-400, medium=yellow-400, high=orange-500, urgent=red-500

### 9.3 Drag States

- Dragging card: scale 1.02, shadow-xl, slight rotation (2deg), opacity 0.9
- Drag placeholder: dashed border, background gray-50, same height as original card
- Valid drop zone: column background transitions to blue-50
- Invalid drop: no visual change

### 9.4 Typography

- Board title: 24px semibold
- Column title: 14px semibold, uppercase, letter-spacing 0.5px, text-gray-500
- Card title: 14px medium, text-gray-900
- Card metadata: 12px regular, text-gray-500
- Drawer title: 20px semibold
- Body text: 14px regular

### 9.5 Color System

```css
--color-bg-primary: #f8fafc       /* slate-50 — page background */
--color-bg-column: #ffffff         /* column background */
--color-bg-card: #ffffff           /* card background */
--color-border: #e2e8f0            /* slate-200 — card/column borders */
--color-text-primary: #0f172a      /* slate-900 */
--color-text-secondary: #64748b    /* slate-500 */
--color-accent: #3b82f6            /* blue-500 — interactive elements */
--color-danger: #ef4444            /* red-500 — delete actions */
```

---

## 10. Accessibility Requirements

### 10.1 Keyboard Navigation

- All interactive elements reachable via Tab
- Visible focus rings on focusable elements (`:focus-visible` only — no focus ring on mouse click)
- Escape closes any open overlay (drawer, dropdown, modal)
- Enter/Space activates buttons and menu items
- Arrow keys navigate within dropdowns and DnD context (Tier 2)

### 10.2 Screen Reader Support

- All images have alt text (avatars: "Avatar of [name]")
- Icon-only buttons use `aria-label`
- Drawer uses `role="dialog"` with `aria-labelledby` (handled by Radix Dialog)
- Column card counts: `aria-label="In Progress, 5 tasks"`
- DnD announcements via `aria-live="assertive"` (Tier 2)

### 10.3 Focus Management (Tier 2)

- Opening drawer: focus moves to drawer (Radix handles)
- Closing drawer: focus returns to triggering card (manual ref tracking)
- After card deletion: focus moves to next card or "Add Card" button
- Dropdown close: focus returns to trigger (Radix handles)

### 10.4 Resume Language — Be Honest

**Do say:** "Implemented WCAG-informed keyboard navigation, focus management, and ARIA live region announcements."

**Do NOT say:** "WCAG 2.1 AA compliant" — unless you run a real axe/Lighthouse accessibility audit and fix every issue. Claiming compliance without evidence is a risk in interviews.

---

## 11. Performance Targets

| Metric | Target | How to Validate |
|---|---|---|
| First Contentful Paint | < 1.5s | Lighthouse |
| Board render (50 cards) | < 100ms | React DevTools Profiler |
| Card drag start | < 50ms | Perceived — no delay |
| Mutation (optimistic) | 0ms perceived | Instant UI update |
| Bundle size (initial) | < 200KB gzipped | `next build` output |
| Virtualized scroll (500 cards) | No frame drops | Chrome Performance trace (Tier 3 only) |

**Rule: Only claim performance numbers on the resume if you have a recorded trace or audit to back them up.** "Optimized large boards with virtualized rendering" is safe. "Maintained 60fps at 500+ cards" requires evidence.

### 11.1 Optimization Strategies

- **Code splitting:** Task drawer loaded via `React.lazy` (not needed on initial board render)
- **Memoization:** `React.memo` on `SortableCard` — cards re-render only when their own data changes
- **Virtualization (Tier 3):** Columns with 20+ cards use `@tanstack/react-virtual`
- **Debouncing:** Search input at 300ms, description auto-save at 500ms

---

## 12. Project Structure

```
projectflow/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                    ← seed data for demo
├── src/
│   ├── app/                       ← Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx               ← board list / home
│   │   ├── board/
│   │   │   └── [id]/
│   │   │       └── page.tsx       ← board view
│   │   └── api/                   ← API routes
│   │       ├── boards/
│   │       ├── columns/
│   │       └── cards/
│   ├── components/
│   │   ├── ui/                    ← reusable primitives
│   │   │   ├── Button.tsx         ← from scratch
│   │   │   ├── Dropdown.tsx       ← wraps Radix DropdownMenu
│   │   │   ├── Drawer.tsx         ← wraps Radix Dialog + Framer Motion
│   │   │   ├── Modal.tsx          ← wraps Radix Dialog
│   │   │   ├── Badge.tsx          ← from scratch
│   │   │   ├── Avatar.tsx         ← from scratch
│   │   │   ├── Skeleton.tsx       ← from scratch
│   │   │   ├── EmptyState.tsx     ← from scratch
│   │   │   └── InlineEdit.tsx     ← from scratch
│   │   ├── board/                 ← board-specific
│   │   │   ├── BoardCanvas.tsx
│   │   │   ├── BoardHeader.tsx
│   │   │   ├── Column.tsx
│   │   │   ├── CardItem.tsx
│   │   │   ├── AddCardInput.tsx
│   │   │   ├── AddColumnButton.tsx
│   │   │   ├── FilterBar.tsx
│   │   │   ├── DragOverlay.tsx
│   │   │   └── DemoModeToggle.tsx
│   │   └── drawer/
│   │       ├── TaskDrawer.tsx
│   │       ├── StatusDropdown.tsx
│   │       ├── PriorityDropdown.tsx
│   │       └── ActivityLog.tsx
│   ├── hooks/
│   │   ├── useBoard.ts            ← React Query board data
│   │   ├── useMoveCard.ts         ← optimistic move mutation
│   │   ├── useCreateCard.ts
│   │   ├── useUpdateCard.ts
│   │   ├── useDeleteCard.ts       ← with undo/pending queue
│   │   └── useKeyboard.ts         ← keyboard shortcut handler
│   ├── stores/
│   │   └── boardUI.ts             ← Zustand store
│   ├── lib/
│   │   ├── api.ts                 ← fetch wrapper with demo mode hook
│   │   ├── fractionalIndex.ts     ← ordering math
│   │   ├── cn.ts                  ← className merge (clsx + tailwind-merge)
│   │   └── validators.ts          ← Zod schemas for API responses
│   └── types/
│       ├── board.ts
│       ├── card.ts
│       ├── column.ts
│       └── api.ts
├── public/
├── tailwind.config.ts
├── tsconfig.json (strict: true)
├── package.json
└── README.md
```

---

## 13. Implementation Timeline

### Phase 1: MVP-A — Core Demo (Days 1–12)

| Day | Focus | Checkpoint |
|---|---|---|
| 1 | Next.js setup, TS strict config, Tailwind, Prisma schema, PostgreSQL, seed script | `npm run seed` populates board |
| 2 | API routes: GET board (nested), POST card, DELETE card, POST move | All endpoints testable via curl/Postman |
| 3 | React Query setup, `useBoard` hook, board page renders columns + cards with skeletons | Board loads from API with loading states |
| 4 | Card CRUD UI: add card inline input, delete card, basic card component | Can create and delete cards |
| 5 | Component primitives: Button, Badge, Avatar, Skeleton, EmptyState | Used throughout the board |
| 6–7 | `@dnd-kit` setup: single-column card reorder, then cross-column DnD, DragOverlay | Cards drag between columns |
| 8 | Fractional index computation on drop, drag placeholder styling, auto-scroll | DnD feels polished |
| 9 | Optimistic updates: `useMoveCard` with onMutate/onError/onSettled, toast on failure | **The core demo moment works** |
| 10 | Basic task drawer: Radix Dialog + Framer Motion, inline title edit | Click card → drawer opens |
| 11 | Demo mode toggle: simulate failure button, GIF recording of rollback | Demo is recordable |
| 12 | Deploy to Vercel, write README with GIFs, push to GitHub | **MVP-A is live** |

**MVP-A checkpoint:** Board is deployed, DnD with optimistic rollback works, demo mode exists, README has GIFs. **This goes on the resume now.**

---

### Phase 2: MVP-B — Product Completeness (Days 13–22)

| Day | Focus |
|---|---|
| 13 | Column CRUD: add, rename, delete with card handling |
| 14 | Column reordering DnD |
| 15 | Full drawer: priority/status/assignee dropdowns (Radix wrappers) |
| 16 | Labels: multi-select in drawer, colored chips on cards |
| 17 | Description textarea, delete with confirmation modal |
| 18 | Undo toast for delete and move actions |
| 19 | Filter bar: priority/assignee/label filters, search, active chips |
| 20 | Loading/error/empty states across entire app |
| 21–22 | Polish pass, bug fixes, update README, re-record GIFs |

---

### Phase 3: Tier 2 — Frontend Depth (Days 23–32)

| Day | Focus |
|---|---|
| 23–24 | Keyboard-accessible DnD: KeyboardSensor, ARIA announcements, demo mode instructions |
| 25–26 | Focus management: drawer focus return, post-delete focus, focus-visible rings |
| 27–28 | Responsive mobile: swipeable columns, bottom sheet drawer, touch sensor |
| 29–30 | Playwright tests for core flows |
| 31–32 | Lighthouse audit, axe accessibility check, fix issues, update README |

---

### Phase 4: Tier 3 — Advanced (Days 33+, if time allows)

| Focus |
|---|
| Virtualization: `@tanstack/react-virtual` + DnD integration, 500-card demo mode |
| Activity log: database table, server-side logging, drawer display |
| Real-time sync: Supabase Realtime or Socket.IO |
| Command palette |
| Final README with all demo GIFs, technical decisions section, performance notes |

---

## 14. Resume Output

### After MVP-A (put on resume immediately):

**ProjectFlow — Collaborative Kanban Workspace**
*Next.js, TypeScript, Tailwind, Zustand, React Query, PostgreSQL, @dnd-kit, Prisma*

- Built a responsive task management board with drag-and-drop card reordering across columns, a task detail drawer, inline editing, and loading/error state handling.
- Implemented optimistic UI updates with automatic rollback on mutation failure using React Query's cache snapshot pattern, reducing perceived interaction latency to zero across board operations.
- Architected a server-state / UI-state split using React Query for cached API data and Zustand for client-only interaction state, avoiding common single-store anti-patterns.

### After MVP-B + Tier 2 (strongest version):

**ProjectFlow — Collaborative Kanban Workspace**
*Next.js, TypeScript, Tailwind, Zustand, React Query, PostgreSQL, @dnd-kit, Prisma, Radix UI, Playwright*

- Built a responsive project management workspace with drag-and-drop task reordering across columns, task detail drawers, inline editing, priority filters, and a composable TypeScript component library built on Radix UI primitives.
- Implemented optimistic UI updates with automatic rollback on mutation failure using React Query's cache snapshot pattern, with undo-able delete actions and toast-driven user recovery flows.
- Added keyboard-accessible drag-and-drop with ARIA live region announcements, focus trap management, and screen-reader-compatible status updates following WCAG accessibility guidelines.
- Used fractional indexing for card ordering, reducing reorder operations to single-row updates regardless of board size.
- Designed a responsive mobile experience with swipeable column navigation, bottom-sheet task details, and touch-optimized drag interactions.

---

## 15. Success Criteria

This project succeeds when:

1. **The demo milestone test passes:** A recruiter watches you drag a card, sees instant update, watches you toggle simulated failure, drag another card, and sees it roll back with a toast. That single interaction tells the story.

2. **MVP-A is deployed within 12 days** with a README that has GIFs and a live link. It goes on applications immediately, not after the project is "complete."

3. **Every Tier 1 feature works flawlessly** in the happy path. A smaller, polished ProjectFlow is better than a huge, buggy one.

4. **At least keyboard DnD or virtualization** is implemented (Tier 2) to differentiate from generic Kanban clones.

5. **The README is strong enough to forward** — an engineer at a company could send it to their team with "hey look at this candidate's project" and the GIFs sell it without needing to run the code.

6. **Resume bullets are qualitatively different** from anything else on the resume — they signal frontend depth, not full-stack breadth.

7. **Every claim on the resume is backed by evidence** — no "WCAG 2.1 AA" without an audit, no "60fps" without a trace, no inflated metrics.