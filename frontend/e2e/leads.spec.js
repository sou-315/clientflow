import { test, expect } from '@playwright/test'
import { config } from 'dotenv'

config({ path: '.env.e2e' })

const EMAIL = process.env.E2E_EMAIL
const PASSWORD = process.env.E2E_PASSWORD

test.describe('Leads — full flow', () => {
  test.beforeEach(async ({ page }) => {
    if (!EMAIL || !PASSWORD) {
      throw new Error('E2E_EMAIL / E2E_PASSWORD not set. Check frontend/.env.e2e')
    }

    await page.goto('/login')
    await page.fill('#email', EMAIL)
    await page.fill('#password', PASSWORD)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('logs in and lands on the dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard')
  })

  test('navigates to Leads and sees the table', async ({ page }) => {
    await page.click('text=Leads')
    await expect(page).toHaveURL(/\/leads/)
    await expect(page.locator('h1')).toContainText('Leads')
  })

  test('creates a new lead, sees it in the table, then deletes it', async ({ page }) => {
    const testLeadName = `E2E Test Lead ${Date.now()}`

    await page.goto('/leads')
    await page.click('text=New Lead')

    await expect(page.locator('h2:has-text("New lead")')).toBeVisible()

    await page.fill('#lead-name', testLeadName)
    await page.fill('#lead-email', 'e2e-test@example.com')
    await page.selectOption('#lead-status', 'New')

    await page.click('button:has-text("Create lead")')

    await expect(page.locator('h2:has-text("New lead")')).not.toBeVisible()
    const tableRow = page.locator('td', { hasText: testLeadName })
    await expect(tableRow).toBeVisible()

    await tableRow.click()
    const panel = page.locator('.lead-panel')
    await expect(panel).toBeVisible()
    await expect(panel).toContainText(testLeadName)

    // Handle the native confirm() dialog that fires on Delete
    page.once('dialog', (dialog) => dialog.accept())
    await page.click('button:has-text("Delete")')

    await expect(panel).not.toBeVisible()
    await expect(page.locator('td', { hasText: testLeadName })).not.toBeVisible()
  })

  test('shows a validation error when creating a lead with no name', async ({ page }) => {
    await page.goto('/leads')
    await page.click('text=New Lead')

    await page.click('button:has-text("Create lead")')

    await expect(page.locator('text=Name is required.')).toBeVisible()
  })

  test('search filters the leads table', async ({ page }) => {
    await page.goto('/leads')

    await page.fill('input[placeholder*="Search by name"]', 'zzz_no_such_lead_zzz')

    await expect(page.locator('text=No leads found.')).toBeVisible({ timeout: 3000 })
  })
})
