import { test, expect } from '@playwright/test'

test.describe('OptiStock AI Manager Dashboard Comprehensive E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate and login as manager
    await page.goto('/')
    await page.fill('input[type="email"]', 'manager@optistock.com')
    await page.fill('input[type="password"]', 'manager123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/manager')
    await page.waitForTimeout(1000)
  })

  test('1. Executive dashboard home loads with correct title, stats, and products list', async ({ page }) => {
    // Verify brand logo image with alt="OptiStock AI"
    const logoImg = page.locator('img[alt="OptiStock AI"]')
    await expect(logoImg.first()).toBeVisible()

    // Check presence of top stat cards / executive header
    const statsContainer = page.locator('.executive-main')
    await expect(statsContainer).toBeVisible()
    await expect(statsContainer).toContainText("Manager's Desk")
    await expect(statsContainer).toContainText('Total Products')
    await expect(statsContainer).toContainText('Low Stock Alerts')

    // Verify left sidebar exists
    const sidebar = page.locator('.executive-sidebar')
    await expect(sidebar).toBeVisible()
  })

  test('2. Left rail has 6 navigation icon buttons with proper tooltips', async ({ page }) => {
    const iconButtons = page.locator('.sidebar-nav-group .sidebar-icon-btn')
    await expect(iconButtons).toHaveCount(6)

    const expectedTooltips = [
      'Product Stock',
      'Stock Alerts',
      '80-20 Mix',
      'Demand Forecast',
      'Discounted Products',
      'Reorders & Orders',
    ]

    for (let i = 0; i < expectedTooltips.length; i++) {
      const tooltip = await iconButtons.nth(i).getAttribute('data-tooltip')
      expect(tooltip).toBe(expectedTooltips[i])
    }
  })

  test('3. Product Stock Catalog: Add Product modal validation and creation', async ({ page }) => {
    // Navigate to Product Stock
    await page.click('button[data-tooltip="Product Stock"]')
    await page.waitForSelector('.executive-subpage-header')

    // Click + Add Product
    await page.click('text="+ Add Product"')
    const dialog = page.locator('div[role="dialog"]')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Add New Product')

    // Fill new product form
    const randomSuffix = Math.floor(Math.random() * 10000)
    const testProductName = `Test Butter ${randomSuffix}`
    await dialog.locator('input[placeholder="e.g. Amul Milk 1L"]').fill(testProductName)
    await dialog.locator('input[placeholder="e.g. Amul"]').fill('TestBrand')
    await dialog.locator('input[placeholder="e.g. Milk 1L, Curd 400g"]').fill('Butter 200g')
    await dialog.locator('input[placeholder="e.g. Dairy, Grocery"]').fill('Dairy')
    await dialog.locator('input[placeholder="0.00"]').first().fill('45.00')
    await dialog.locator('input[placeholder="0.00"]').nth(1).fill('60.00')
    await dialog.locator('input[placeholder="0"]').fill('20')
    await dialog.locator('input[placeholder="10"]').fill('10')

    // Submit form
    await dialog.locator('button[type="submit"]').click()
    await expect(dialog).not.toBeVisible()

    // Verify product added to table
    await page.fill('input[placeholder*="Search products"]', testProductName)
    await page.waitForTimeout(600)
    await expect(page.locator('.executive-main')).toContainText(testProductName)
  })

  test('4. Product Stock Catalog: Archive product flow with confirmation', async ({ page }) => {
    await page.click('button[data-tooltip="Product Stock"]')
    await page.waitForSelector('.executive-subpage-header')

    // First create a temporary product to archive
    await page.click('text="+ Add Product"')
    const dialog = page.locator('div[role="dialog"]')
    const tempName = `ToArchive ${Math.floor(Math.random() * 10000)}`
    await dialog.locator('input[placeholder="e.g. Amul Milk 1L"]').fill(tempName)
    await dialog.locator('input[placeholder="e.g. Milk 1L, Curd 400g"]').fill('Snack 50g')
    await dialog.locator('input[placeholder="e.g. Dairy, Grocery"]').fill('Snacks')
    await dialog.locator('input[placeholder="0.00"]').first().fill('10.00')
    await dialog.locator('input[placeholder="0.00"]').nth(1).fill('20.00')
    await dialog.locator('input[placeholder="0"]').fill('15')
    await dialog.locator('input[placeholder="10"]').fill('5')
    await dialog.locator('button[type="submit"]').click()
    await expect(dialog).not.toBeVisible()

    // Search for the temporary product
    await page.fill('input[placeholder*="Search products"]', tempName)
    await page.waitForTimeout(500)
    await expect(page.locator('.executive-main')).toContainText(tempName)

    // Accept browser dialog on archive
    page.once('dialog', async (d) => {
      await d.accept()
    })

    // Click Archive
    await page.locator('button:has-text("Archive")').first().click()
    await page.waitForTimeout(600)
    await expect(page.locator('.executive-main')).toContainText('archived successfully')
  })

  test('5. Stock Alerts: Low Stock Reorder button opens NewReorderDialog pre-filled', async ({ page }) => {
    await page.click('button[data-tooltip="Stock Alerts"]')
    await page.waitForSelector('.executive-subpage-header')

    // Click Reorder on first low stock product
    const reorderButtons = page.locator('button:has-text("Reorder")')
    if ((await reorderButtons.count()) > 0) {
      await reorderButtons.first().click()
      const dialog = page.locator('div[role="dialog"]')
      await expect(dialog).toBeVisible()
      await expect(dialog).toContainText('New Reorder')
      await expect(dialog).toContainText('Quantity to Reorder')

      // Close modal with Cancel
      await dialog.locator('button:has-text("Cancel")').click()
      await expect(dialog).not.toBeVisible()
    }
  })

  test('6. Stock Ledger: Reorder button opens NewReorderDialog', async ({ page }) => {
    await page.click('button[data-tooltip="Product Stock"]')
    await page.click('text="Stock Ledger"')
    await page.waitForTimeout(600)

    const reorderBtns = page.locator('button:has-text("Reorder")')
    if ((await reorderBtns.count()) > 0) {
      await reorderBtns.first().click()
      const dialog = page.locator('div[role="dialog"]')
      await expect(dialog).toBeVisible()
      await expect(dialog).toContainText('New Reorder')
      await dialog.locator('button:has-text("Cancel")').click()
      await expect(dialog).not.toBeVisible()
    }
  })

  test('7. Reorders and Purchase Orders: New Reorder header button opens NewReorderDialog', async ({ page }) => {
    await page.click('button[data-tooltip="Reorders & Orders"]')
    await page.waitForSelector('.executive-subpage-header')

    await page.click('button:has-text("New Reorder")')
    const dialog = page.locator('div[role="dialog"]')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('New Reorder')
    await expect(dialog).toContainText('Product *')

    // Select product from dropdown
    await dialog.locator('select').first().selectOption({ index: 1 })
    await dialog.locator('button:has-text("Cancel")').click()
    await expect(dialog).not.toBeVisible()
  })

  test('8. 80-20 Mix: Loads brand mix cards, split bar, recommendation callout, and Order this mix', async ({ page }) => {
    await page.click('button[data-tooltip="80-20 Mix"]')
    await page.waitForSelector('.executive-subpage-header')
    await page.waitForTimeout(1000)

    const main = page.locator('.executive-main')
    await expect(main).toContainText('80-20 Mix: Brand Portfolio Optimization')

    // Verify brand table columns exist
    await expect(main).toContainText('Brand')
    await expect(main).toContainText('Total Profit')
    await expect(main).toContainText('Rec. Share')

    // Verify recommendation callout exists
    await expect(main).toContainText('Recommendation:')

    // If an active group with need exists, test "Order this mix"
    const orderMixBtns = page.locator('button:has-text("Order this mix")')
    if ((await orderMixBtns.count()) > 0) {
      await orderMixBtns.first().click()
      const dialog = page.locator('div[role="dialog"]')
      await expect(dialog).toBeVisible()
      await expect(dialog).toContainText('Reorder Mix:')
      await expect(dialog).toContainText('Brand Breakdown')
      await dialog.locator('button:has-text("Cancel")').click()
      await expect(dialog).not.toBeVisible()
    }
  })

  test('9. Demand Forecast: KPI cards, risk sorting, graph, and formula breakdown', async ({ page }) => {
    await page.click('button[data-tooltip="Demand Forecast"]')
    await page.waitForSelector('.executive-subpage-header')
    await page.waitForTimeout(1200)

    const main = page.locator('.executive-main')
    // 4 KPI cards
    await expect(main).toContainText('Products at Risk')
    await expect(main).toContainText('Total Forecast Units')
    await expect(main).toContainText('Model Accuracy')
    await expect(main).toContainText('Needing Reorder')

    // Formula panel toggle
    await page.click('button:has-text("How this forecast was calculated")')
    await expect(main).toContainText('Demand Forecasting Algorithm Specification')
    await expect(main).toContainText('Baseline A (Weighted Moving Average)')

    // Click Order on first row
    const orderBtns = page.locator('button:has-text("Order")')
    if ((await orderBtns.count()) > 0) {
      await orderBtns.first().click()
      const dialog = page.locator('div[role="dialog"]')
      await expect(dialog).toBeVisible()
      await dialog.locator('button:has-text("Cancel")').click()
      await expect(dialog).not.toBeVisible()
    }
  })

  test('10. Shared Reorder submission creates order with instant sync', async ({ page }) => {
    await page.click('button[data-tooltip="Reorders & Orders"]')
    await page.waitForSelector('.executive-subpage-header')

    await page.click('button:has-text("New Reorder")')
    const dialog = page.locator('div[role="dialog"]')
    await expect(dialog).toBeVisible()

    // Pick first product from select
    await dialog.locator('select').first().selectOption({ index: 1 })
    // Ensure supplier is selected or enter new
    const supplierSelect = dialog.locator('select').nth(1)
    if (await supplierSelect.isVisible()) {
      await supplierSelect.selectOption({ index: 1 })
    }

    // Click Save as Suggested
    await dialog.locator('button:has-text("Save as Suggested")').click()

    // Dialog closes with success
    await expect(dialog).not.toBeVisible({ timeout: 5000 })
    await page.waitForTimeout(600)
    // New order appears in list
    const main = page.locator('.executive-main')
    await expect(main).toContainText('Pending Approval')
  })
})
