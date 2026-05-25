export type FlowboardConfig = {
  baseUrl: string
  apiToken: string
  defaultBoardId?: string
}

export function loadConfig(): FlowboardConfig {
  const apiToken = process.env.FLOWBOARD_API_TOKEN?.trim()
  if (!apiToken) {
    throw new Error('FLOWBOARD_API_TOKEN is required (create one in FlowBoard → user menu → API tokens)')
  }

  const baseUrl = (process.env.FLOWBOARD_BASE_URL ?? 'https://flowboard-kapp.vercel.app').replace(/\/$/, '')
  const defaultBoardId = process.env.FLOWBOARD_BOARD_ID?.trim() || undefined

  return { baseUrl, apiToken, defaultBoardId }
}

export function resolveBoardId(argBoardId: string | undefined, defaultBoardId?: string): string {
  const boardId = argBoardId ?? defaultBoardId
  if (!boardId) {
    throw new Error(
      'boardId is required (pass as a tool argument or set FLOWBOARD_BOARD_ID in the MCP server env)'
    )
  }
  return boardId
}
