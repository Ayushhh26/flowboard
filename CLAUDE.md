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
