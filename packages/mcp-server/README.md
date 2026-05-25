# flowboard-mcp-server

[![npm](https://img.shields.io/npm/v/flowboard-mcp-server.svg)](https://www.npmjs.com/package/flowboard-mcp-server)
[![license](https://img.shields.io/npm/l/flowboard-mcp-server.svg)](./LICENSE)

A stdio [Model Context Protocol](https://modelcontextprotocol.io/) server that exposes a [FlowBoard](https://flowboard-kapp.vercel.app) Kanban board to AI agents like Cursor, Claude Code, and Claude Desktop.

The server talks to FlowBoard over its public HTTP API with a **personal API token** — no database access, no shared secrets, the same permissions you have in the browser.

## Tools

| Tool | What it does |
|------|--------------|
| `get_board` | Full board snapshot (columns, cards, labels, members) |
| `get_board_summary` | Aggregates: counts by column / priority, urgent card list |
| `search_cards` | Filter by title text, priority, assignee, labels |
| `create_card` | Create a card in a column; optional description, assignee, labels |
| `create_card_from_text` | Natural language → card (parser-backed Smart Add, server-side) |
| `move_card` | Move a card between columns; auto-appends if `newOrderIndex` is omitted |

## Before you install

You need two things from the [live FlowBoard app](https://flowboard-kapp.vercel.app):

1. **An API token.** Sign in → user menu → **API tokens** → **Create token**. The plaintext `fb_...` is shown once; copy it now.
2. **A board UUID.** Open a board; copy the UUID from the URL: `/board/<uuid>`.

That's it — no clone, no install, no database.

## Cursor

Paste this into `.cursor/mcp.json` (project) or your user-level Cursor MCP config:

```json
{
  "mcpServers": {
    "flowboard": {
      "command": "npx",
      "args": ["-y", "flowboard-mcp-server"],
      "env": {
        "FLOWBOARD_API_TOKEN": "fb_...",
        "FLOWBOARD_BOARD_ID": "your-board-uuid"
      }
    }
  }
}
```

Restart Cursor (or refresh MCP from Settings → MCP) and the `flowboard` server appears with its tools. The server defaults to `https://flowboard-kapp.vercel.app`, so you don't need `FLOWBOARD_BASE_URL` unless you're running your own backend.

## Claude Code / Claude Desktop

Same env vars; same `npx -y flowboard-mcp-server` command. See your client's MCP config docs for the exact JSON shape.

## Environment variables

| Variable | Required | Default |
|----------|----------|---------|
| `FLOWBOARD_API_TOKEN` | Yes | — |
| `FLOWBOARD_BOARD_ID` | No\* | — |
| `FLOWBOARD_BASE_URL` | No | `https://flowboard-kapp.vercel.app` |

\*If unset, every tool call must include `boardId` as an argument.

## Architecture

```text
┌──────────┐    stdio   ┌──────────────┐    HTTP + Bearer    ┌──────────────┐
│ Cursor / │ ─────────▶ │ this package │ ─────────────────▶ │ FlowBoard    │
│ Claude   │            │ McpServer    │                     │ Next.js API  │
└──────────┘            └──────────────┘                     └──────┬───────┘
                                                                    │
                                                              ┌─────▼──────┐
                                                              │ PostgreSQL │
                                                              └────────────┘
```

The MCP package has **no Prisma**, no Supabase keys, and no awareness of the database. It only knows how to call the FlowBoard HTTP API with your Bearer token.

## Advanced: pointing at your own FlowBoard

If you're [self-hosting FlowBoard](https://github.com/Ayushhh26/flowboard) or running it locally, set `FLOWBOARD_BASE_URL` to override the default:

```json
"env": {
  "FLOWBOARD_BASE_URL": "http://localhost:3000",
  "FLOWBOARD_API_TOKEN": "fb_...",
  "FLOWBOARD_BOARD_ID": "your-board-uuid"
}
```

To test a local build of *this package* in Cursor without publishing, clone the [FlowBoard repo](https://github.com/Ayushhh26/flowboard) and point `args` at the absolute `dist/index.js`:

```json
"command": "node",
"args": ["/absolute/path/to/flowboard/packages/mcp-server/dist/index.js"]
```

## Troubleshooting

| Symptom | Cause |
|---------|-------|
| `401 UNAUTHORIZED` | Token revoked, expired, or wrong; create a new one in the FlowBoard UI |
| `404 Board not found` | Wrong `FLOWBOARD_BOARD_ID` or your user has no access to that board |
| `AI_UNAVAILABLE` (only for `create_card_from_text`) | `GROQ_API_KEY` not set on the FlowBoard server (the live demo has it set) |
| MCP server exits immediately | Run the same command in a terminal; stderr shows the missing env var |

## License

[MIT](./LICENSE) © 2026 Ayush
