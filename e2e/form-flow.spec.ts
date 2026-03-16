import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('should show login form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('[data-karma-test-id="email-input"]')).toBeVisible()
    await expect(page.locator('[data-karma-test-id="password-input"]')).toBeVisible()
  })
})

test.describe('API - unauthorized access', () => {
  test('should reject unauthenticated forms API', async ({ request }) => {
    const res = await request.get('/api/forms')
    expect(res.status()).toBe(401)
  })

  test('should reject unauthenticated responses API', async ({ request }) => {
    const res = await request.get('/api/responses')
    expect(res.status()).toBe(401)
  })
})

test.describe('Public form', () => {
  test('should return 404 for invalid public token', async ({ request }) => {
    const res = await request.get('/api/forms/public/invalid-token')
    expect(res.status()).toBe(404)
  })
})

test.describe('Security', () => {
  test('should not execute XSS in login page', async ({ page }) => {
    await page.goto('/login')
    const alerts: string[] = []
    page.on('dialog', d => { alerts.push(d.message()); d.dismiss() })
    await page.locator('[data-karma-test-id="email-input"]').fill('<script>alert("xss")</script>@test.com')
    await page.locator('[data-karma-test-id="password-input"]').fill('password123')
    await page.locator('[data-karma-test-id="submit-btn"]').click()
    await page.waitForTimeout(2000)
    expect(alerts).toHaveLength(0)
  })
})
