# @flowboard/mcp-server

A stdio [Model Context Protocol](https://modelcontextprotocol.io/) server that exposes a [FlowBoard](https://github.com/Ayushhh26/flowboard) Kanban board to AI agents like Cursor, Claude Code, and Claude Desktop.

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

`create_card_from_text` requires `GROQ_API_KEY` to be set on the FlowBoard server. The other tools work without it.

## Configuration

The server reads three environment variables:

| Variable | Required | Default |
|----------|----------|---------|
| `FLOWBOARD_API_TOKEN` | Yes | — |
| `FLOWBOARD_BASE_URL` | No | `http://localhost:3000` |
| `FLOWBOARD_BOARD_ID` | No\* | — |

\*If unset, every tool call must include `boardId` as an argument.

Create the token from the FlowBoard UI: **user menu → API tokens → Create token**. The plaintext is shown once.

## Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "flowboard": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/flowboard/packages/mcp-server/dist/index.js"],
      "env": {
        "FLOWBOARD_BASE_URL": "http://localhost:3000",
        "FLOWBOARD_API_TOKEN": "fb_...",
        "FLOWBOARD_BOARD_ID": "your-board-uuid"
      }
    }
  }
}
```

Restart Cursor (or refresh MCP from Settings → MCP) and the `flowboard` server appears with its tools.

## Claude Code / Claude Desktop

Same env vars; point the entry at `node` + the absolute path to `dist/index.js`.

## Local build

From the FlowBoard repo root:

```bash
npm install
npm run mcp:build
```

This produces `packages/mcp-server/dist/index.js`. The server is also wired as a `bin`, so `npm link` or a future `npm publish` makes `flowboard-mcp` available on `PATH`.

## Tests

```bash
npm run mcp:test
```

Mocked HTTP — no live FlowBoard server required.

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

The MCP package has **no Prisma**, no Supabase keys, and no awareness of the database. It only knows how to call your FlowBoard HTTP API.

## License

MIT — see the [FlowBoard repo](https://github.com/Ayushhh26/flowboard) for details.
