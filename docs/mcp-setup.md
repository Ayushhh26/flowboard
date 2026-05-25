# FlowBoard MCP setup

Connect Cursor, Claude Code, or Claude Desktop to your FlowBoard via the **stdio MCP server** in `packages/mcp-server`. The server calls your FlowBoard HTTP API with a **personal API token** (same permissions as your user in the browser).

## Prerequisites

From the [live FlowBoard app](https://flowboard-kapp.vercel.app):

1. An **API token**: user menu → **API tokens** → Create token. Copy the `fb_...` value once; it is not shown again.
2. A **board UUID** from the URL: `/board/<board-id>`.

(If you're self-hosting FlowBoard or running it locally, point `FLOWBOARD_BASE_URL` at your own host — see the "Local backend" section below.)

## Cursor configuration

The recommended path is **`npx`** — no clone or build needed:

```json
{
  "mcpServers": {
    "flowboard": {
      "command": "npx",
      "args": ["-y", "flowboard-mcp-server"],
      "env": {
        "FLOWBOARD_API_TOKEN": "fb_your_token_here",
        "FLOWBOARD_BOARD_ID": "your-board-uuid"
      }
    }
  }
}
```

Add it to `.cursor/mcp.json` (project) or Cursor Settings → MCP. The MCP server defaults to `https://flowboard-kapp.vercel.app`, so no `FLOWBOARD_BASE_URL` is needed.

### Local backend

If you've cloned this repo and are running FlowBoard locally (`npm run dev`):

```json
"env": {
  "FLOWBOARD_BASE_URL": "http://localhost:3000",
  "FLOWBOARD_API_TOKEN": "fb_your_token_here",
  "FLOWBOARD_BOARD_ID": "your-board-uuid"
}
```

### Running from a local checkout of the MCP package itself

If you're developing the MCP server itself:

```bash
npm install
npm run mcp:build
```

Then point Cursor at the absolute `dist/index.js`:

```json
{
  "mcpServers": {
    "flowboard": {
      "command": "node",
      "args": ["/absolute/path/to/flowboard/packages/mcp-server/dist/index.js"]
    }
  }
}
```

## Claude Code

Same env vars; point the MCP entry at `node` + `packages/mcp-server/dist/index.js`.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FLOWBOARD_API_TOKEN` | Yes | `fb_...` token from the app |
| `FLOWBOARD_BASE_URL` | No | Default `https://flowboard-kapp.vercel.app` |
| `FLOWBOARD_BOARD_ID` | No* | Default board for tools that accept optional `boardId` |

\*If unset, pass `boardId` on each tool call.

## Tools

| Tool | Description |
|------|-------------|
| `get_board` | Full board snapshot (columns, cards, labels) |
| `get_board_summary` | Counts by column/priority + urgent list |
| `search_cards` | Filter by text, priority, assignee, labels |
| `create_card` | Create in a column; optional description, assignee, labels |
| `create_card_from_text` | Natural language → card (Smart Add parser, server-side create) |
| `move_card` | Move between columns; omit `newOrderIndex` to append |

**Tip for agents:** Call `get_board` first to learn column IDs and titles before `create_card` or `move_card`.

## Verify with curl (API token)

```bash
export FLOWBOARD_API_TOKEN="fb_..."
export BOARD_ID="your-board-uuid"

curl -s -H "Authorization: Bearer $FLOWBOARD_API_TOKEN" \
  "https://flowboard-kapp.vercel.app/api/boards/$BOARD_ID" | head -c 200
```

## Troubleshooting

- **401 Unauthorized** — Token revoked, wrong token, or missing `Authorization: Bearer`.
- **404 Board not found** — Wrong `FLOWBOARD_BOARD_ID` or token user is not a member.
- **MCP server exits immediately** — Run `npx -y flowboard-mcp-server` directly in a terminal; stderr shows the missing env var.
- **Self-hosting** — Set `FLOWBOARD_BASE_URL` to your own host (or `http://localhost:3000` for local dev) and create a token there.

`create_card_from_text` calls `POST /api/boards/:id/cards/from-text` on your FlowBoard server, which runs the same parse pipeline as the browser Smart Add and then inserts the card in one transaction. If `GROQ_API_KEY` is not set on the server it returns `AI_UNAVAILABLE`.
