#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { loadConfig } from './config.js'
import { registerFlowboardTools } from './tools.js'

async function main() {
  const config = loadConfig()

  const server = new McpServer({
    name: 'flowboard',
    version: '0.1.0',
  })

  registerFlowboardTools(server, config)

  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
