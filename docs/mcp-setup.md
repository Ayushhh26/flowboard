# FlowBoard MCP setup

Connect Cursor, Claude Code, or Claude Desktop to your FlowBoard via the **stdio MCP server** in `packages/mcp-server`. The server calls your FlowBoard HTTP API with a **personal API token** (same permissions as your user in the browser).

## Prerequisites

1. FlowBoard running locally (`npm run dev`) or deployed (set `FLOWBOARD_BASE_URL` to your host).
2. An **API token** from the app: user menu → **API tokens** → Create token. Copy the `fb_...` value once; it is not shown again.
3. A **board UUID** from the URL: `/board/<board-id>`.

## Build the server

From the repo root:

```bash
npm install
npm run mcp:build
```

## Cursor configuration

Add to `.cursor/mcp.json` (project) or Cursor Settings → MCP:

```json
{
  "mcpServers": {
    "flowboard": {
      "command": "node",
      "args": ["/absolute/path/to/flowboard/packages/mcp-server/dist/index.js"],
      "env": {
        "FLOWBOARD_BASE_URL": "http://localhost:3000",
        "FLOWBOARD_API_TOKEN": "fb_your_token_here",
        "FLOWBOARD_BOARD_ID": "your-board-uuid"
      }
    }
  }
}
```

Use the **absolute path** to `dist/index.js` on your machine.

## Claude Code

Same env vars; point the MCP entry at `node` + `packages/mcp-server/dist/index.js`.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FLOWBOARD_API_TOKEN` | Yes | `fb_...` token from the app |
| `FLOWBOARD_BASE_URL` | No | Default `http://localhost:3000` |
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
  "http://localhost:3000/api/boards/$BOARD_ID" | head -c 200
```

## Troubleshooting

- **401 Unauthorized** — Token revoked, wrong token, or missing `Authorization: Bearer`.
- **404 Board not found** — Wrong `FLOWBOARD_BOARD_ID` or token user is not a member.
- **MCP server exits immediately** — Run `node packages/mcp-server/dist/index.js` in a terminal; stderr shows missing `FLOWBOARD_API_TOKEN`.
- **Production** — Set `FLOWBOARD_BASE_URL` to your Vercel URL; create a token on the deployed app.

`create_card_from_text` calls `POST /api/boards/:id/cards/from-text` on your FlowBoard server, which runs the same parse pipeline as the browser Smart Add and then inserts the card in one transaction. If `GROQ_API_KEY` is not set on the server it returns `AI_UNAVAILABLE`.
