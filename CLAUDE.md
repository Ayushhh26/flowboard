# FlowBoard

## What This Is
A Kanban workspace built as a frontend engineering portfolio project.
The goal is frontend depth: drag-and-drop, optimistic updates, accessibility, component architecture.

## Stack
- Next.js (App Router), TypeScript (strict), Tailwind CSS
- Zustand (UI state), TanStack React Query (server state)
- @dnd-kit (drag-and-drop), Framer Motion (animations)
- Radix UI (accessible primitives for Dialog, Dropdown)
- Prisma + PostgreSQL (Supabase), sonner (toasts)

## Key Architecture Decisions
- Server state (React Query) and UI state (Zustand) are strictly separated. Never put API data in Zustand.
- Optimistic updates use React Query's onMutate/onError/onSettled pattern with cache snapshots.
- Card ordering uses fractional indexing (floats), not integer reindexing.
- Radix UI provides headless accessible behavior; we build styled wrappers on top.
- Simple components (Button, Badge, Avatar, Skeleton, InlineEdit) are built from scratch.

## Project Structure
- `src/app/` — Next.js App Router pages and API routes
- `src/components/ui/` — reusable primitives (Button, Drawer, Modal, etc.)
- `src/components/board/` — board-specific components (Column, CardItem, etc.)
- `src/components/drawer/` — task detail drawer components
- `src/hooks/` — custom React hooks (useBoard, useMoveCard, etc.)
- `src/stores/` — Zustand stores
- `src/lib/` — utilities (api.ts, fractionalIndex.ts, cn.ts, validators.ts)
- `src/types/` — shared TypeScript types
- `prisma/` — schema and seed script

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript type check
- `npx prisma db push` — sync schema to DB
- `npx prisma db seed` — seed demo data
- `npx prisma studio` — visual DB browser

## Code Style
- TypeScript strict mode. No `any` anywhere. No `as` casts unless absolutely necessary.
- Use `interface` over `type` for object shapes.
- Use `cn()` utility (clsx + tailwind-merge) for conditional classNames.
- Components use `forwardRef` when they wrap DOM elements.
- All interactive elements must be keyboard accessible.
- Use `:focus-visible` for focus rings, never `:focus`.

## IMPORTANT
- Do NOT install shadcn/ui or any full component library. We build our own wrappers.
- Do NOT use localStorage or sessionStorage for server data or core app state. Only use browser storage for optional UI preferences if explicitly requested.
- Do NOT create feature-specific CSS files. Use Tailwind utility classes. globals.css is allowed for Tailwind setup, CSS variables, and base styles.
- Do NOT use `useEffect` for data fetching. Use React Query.
- For visible board mutations (card move, create, delete, title edit, status change), ALWAYS implement optimistic updates with rollback. Normal server-confirmed mutations are fine for admin actions like creating a board.
- Use named exports for reusable components and hooks. Use default exports only where Next.js requires them (page.tsx, layout.tsx).

## References
- @docs/PRD.md for full feature specification
- @prisma/schema.prisma for data model