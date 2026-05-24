import { test, expect } from '@playwright/test'
import { gotoBoard } from './helpers'

const boardId = process.env.PLAYWRIGHT_BOARD_ID

// Tests share one board — run serially to avoid cross-test interference.
test.describe.configure({ mode: 'serial' })

test.describe('Board flows', () => {
  test.beforeEach(async ({ page }) => {
    await gotoBoard(page, boardId)
  })

  test('loads board with columns', async ({ page }) => {
    await expect(page.getByText('+ Add a card').first()).toBeVisible()
  })

  test('creates a card and persists after refresh', async ({ page }) => {
    const title = `E2E card ${Date.now()}`
    await page.getByText('+ Add a card').first().click()
    await page.getByPlaceholder('Card title...').fill(title)

    const createResponse = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' &&
        /\/api\/columns\/[^/]+\/cards$/.test(new URL(res.url()).pathname) &&
        res.ok()
    )
    await page.getByRole('button', { name: 'Add card' }).click()
    await createResponse

    await expect(page.getByText(title)).toBeVisible()
    await page.reload()
    await expect(page.getByText(title)).toBeVisible({ timeout: 15_000 })
  })

  test('opens drawer and edits title', async ({ page }) => {
    const card = page.locator('[id^="card-"]').first()
    await expect(card).toBeVisible({ timeout: 15_000 })
    const originalTitle = (await card.innerText()).split('\n')[0].trim()
    const updatedTitle = `${originalTitle} E2E`

    await card.click()
    const drawer = page.getByRole('dialog')
    await expect(drawer).toBeVisible()

    // InlineEdit: click title, replace draft (select-all on focus would clobber partial typing)
    await drawer.getByRole('button', { name: originalTitle }).click()
    const titleInput = drawer.locator('input').first()
    await titleInput.fill(updatedTitle)
    await titleInput.press('Enter')

    const patchResponse = page.waitForResponse(
      (res) =>
        res.request().method() === 'PATCH' &&
        /\/api\/cards\/[^/]+$/.test(new URL(res.url()).pathname) &&
        res.ok()
    )
    await patchResponse

    await expect(drawer.getByRole('button', { name: updatedTitle })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
    await expect(page.getByText(updatedTitle)).toBeVisible()
  })

  test('filters by priority and clears', async ({ page }) => {
    await page.getByRole('button', { name: 'High', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Clear filters' })).toBeVisible()
    await page.getByRole('button', { name: 'Clear filters' }).click()
    await expect(page.getByRole('button', { name: 'Clear filters' })).toBeHidden()
  })

  test('keyboard drag pickup and cancel', async ({ page }) => {
    const card = page.locator('[id^="card-"]').first()
    await expect(card).toBeVisible({ timeout: 15_000 })
    await card.focus()
    await page.keyboard.press('Space')
    await page.keyboard.press('Escape')
    await expect(card).toBeVisible()
  })
})
