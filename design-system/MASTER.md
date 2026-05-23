# FlowBoard Design System (Master)

## Pattern
Minimal Swiss-style SaaS dashboard. Content-first kanban; clear hierarchy, generous whitespace.

## Typography
- **Font:** Plus Jakarta Sans (via `next/font`)
- **Headings:** semibold, slate-900
- **Body:** regular/medium, slate-700
- **Muted:** slate-500–600 (never gray-400 for body)

## Colors
| Role | Hex | Tailwind |
|------|-----|----------|
| Primary | #4F46E5 | indigo-600 |
| Primary hover | #4338CA | indigo-700 |
| Focus ring | #6366F1 | indigo-500 |
| Background | #F8FAFC | slate-50 |
| Surface | #FFFFFF | white |
| Text | #0F172A | slate-900 |
| Muted text | #475569 | slate-600 |
| Border | #E2E8F0 | slate-200 |

Priority and role colors: see `src/lib/ui-colors.ts`.

## Effects
- Transitions: 150–200ms, `ease-out`
- Shadows: `shadow-sm` cards, `shadow-md` on hover
- No layout-shifting scale on hover
- `prefers-reduced-motion` respected in `globals.css`

## Interaction
- `cursor-pointer` on all clickable cards/links
- Visible `focus-visible` rings (indigo)
- SVG icons only (no emoji icons)
