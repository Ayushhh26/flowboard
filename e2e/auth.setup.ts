import { test as setup, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const authFile = path.join(__dirname, '.auth/user.json')

setup('authenticate', async ({ page }) => {
  const email = process.env.PLAYWRIGHT_EMAIL
  const password = process.env.PLAYWRIGHT_PASSWORD

  if (!email || !password) {
    throw new Error('Set PLAYWRIGHT_EMAIL and PLAYWRIGHT_PASSWORD to run E2E tests')
  }

  fs.mkdirSync(path.dirname(authFile), { recursive: true })

  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL('/', { timeout: 15_000 })

  await page.context().storageState({ path: authFile })
})
