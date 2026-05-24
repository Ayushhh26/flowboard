import { expect, type Page } from '@playwright/test'

/** Wait for the board canvas (filters + columns) to be ready. */
export async function expectBoardReady(page: Page) {
  await expect(page.getByRole('searchbox', { name: 'Search tasks' })).toBeVisible({
    timeout: 15_000,
  })
}

/**
 * Open a board: use PLAYWRIGHT_BOARD_ID if set, otherwise the first board on the home page.
 */
export async function gotoBoard(page: Page, boardId?: string) {
  if (boardId) {
    await page.goto(`/board/${boardId}`)
    const is404 = await page
      .getByRole('heading', { name: '404' })
      .isVisible({ timeout: 2_000 })
      .catch(() => false)

    if (is404) {
      throw new Error(
        [
          `Board not found: ${boardId}`,
          'That ID may be wrong, or it belongs to a different account.',
          'Fix: copy the UUID from a board URL while signed in as PLAYWRIGHT_EMAIL,',
          'or remove PLAYWRIGHT_BOARD_ID from .env.local to auto-use your first board.',
        ].join('\n')
      )
    }
  } else {
    await page.goto('/')
    const firstBoard = page.locator('a[href^="/board/"]').first()
    await expect(
      firstBoard,
      'No boards on home page — create one while signed in as PLAYWRIGHT_EMAIL'
    ).toBeVisible({ timeout: 15_000 })
    await firstBoard.click()
  }

  await expectBoardReady(page)
}
