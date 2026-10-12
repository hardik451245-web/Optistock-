import { test, expect } from '@playwright/test';

test.describe('Cashier Dashboard Control & Hit-Testing Tests', () => {

  test('All cashier controls respond to clicks with working functionality', async ({ page }) => {
    test.setTimeout(90000);
    const consoleMessages = [];
    const pageErrors = [];

    page.on('console', (msg) => consoleMessages.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // Login as cashier
    await page.goto('/');
    await page.fill('input[type="email"]', 'cashier@optistock.com');
    await page.fill('input[type="password"]', 'cashier123');
    await page.click('button[type="submit"]');

    // Wait for cashier dashboard
    await page.waitForURL('**/cashier');
    await page.waitForSelector('.spatial-viewport', { state: 'visible' });
    await page.waitForTimeout(1500);

    async function getElementAtCenter(locator) {
      const box = await locator.boundingBox();
      if (!box) return { elementDesc: 'NO_BOUNDING_BOX', cx: 0, cy: 0 };
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      const desc = await page.evaluate(({ x, y }) => {
        const el = document.elementFromPoint(x, y);
        if (!el) return 'NULL_ELEMENT';
        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : '';
        const cls = el.className && typeof el.className === 'string'
          ? `.${el.className.trim().split(/\s+/).filter(Boolean).join('.')}`
          : '';
        return `${tag}${id}${cls}`;
      }, { x: cx, y: cy });
      return { elementDesc: desc, cx, cy, box };
    }

    const results = [];

    // 1. Search box
    const searchInput = page.locator('.spatial-search-box .spatial-search-input');
    const searchHit = await getElementAtCenter(searchInput);
    let searchEffect = 'no';
    await page.mouse.click(searchHit.cx, searchHit.cy);
    await searchInput.fill('Balaji');
    await page.waitForTimeout(400);
    const searchVal = await searchInput.inputValue();
    const searchFilteredTiles = await page.locator('.product-tile-3d').count();
    const allTileTexts = await page.locator('.product-tile-3d').allTextContents();
    const matchesSearch = allTileTexts.length > 0 && allTileTexts.every(t => t.toLowerCase().includes('balaji'));
    if (searchVal === 'Balaji' && searchFilteredTiles > 0 && matchesSearch) {
      searchEffect = 'yes';
    }
    expect(searchEffect).toBe('yes');
    results.push({ control: 'search box', elementAtClick: searchHit.elementDesc, effect: searchEffect });

    // Clear search for next tests
    await searchInput.fill('');
    await page.waitForTimeout(300);

    // 2. Category chips
    const categoryChips = page.locator('.spatial-chip');
    const chipCount = await categoryChips.count();
    let chipHitDesc = 'NO_CHIPS';
    let chipEffect = 'no';
    if (chipCount > 1) {
      const dairyChip = page.locator('.spatial-chip:has-text("Dairy")').first();
      const hit = await getElementAtCenter(dairyChip);
      chipHitDesc = hit.elementDesc;
      await page.mouse.click(hit.cx, hit.cy);
      await page.waitForTimeout(400);
      const isDairyActive = await dairyChip.evaluate(el => el.classList.contains('active'));
      const dairyTileCount = await page.locator('.product-tile-3d').count();
      const dairyCategories = await page.locator('.product-tile-3d span:has-text("Dairy")').count();
      if (isDairyActive && dairyTileCount > 0 && dairyTileCount === dairyCategories) {
        chipEffect = 'yes';
      }
      expect(chipEffect).toBe('yes');
    }
    results.push({ control: 'category chips', elementAtClick: chipHitDesc, effect: chipEffect });

    // Reset category to ALL
    await page.locator('.spatial-chip:has-text("ALL")').click();
    await page.waitForTimeout(300);

    // 3. "+" add button on product tile
    const inStockTile = page.locator('.product-tile-3d:has(button[title="Add to Bill"])').first();
    const inStockAddBtn = inStockTile.locator('button[title="Add to Bill"]');
    const addHit = await getElementAtCenter(inStockAddBtn);
    let addEffect = 'no';
    const tileProductName = (await inStockTile.locator('h3').innerText()).trim();

    await page.mouse.click(addHit.cx, addHit.cy);
    await page.waitForTimeout(500);

    const cartItems = page.locator('.panel-bill .bill-item-card');
    const cartCount = await cartItems.count();
    const cartItemName = await cartItems.first().locator('strong').first().innerText();
    const initialPayableText = await page.locator('.spatial-ornament-bar div:has-text("PAYABLE TOTAL") + div').innerText();

    if (cartCount === 1 && cartItemName === tileProductName) {
      addEffect = 'yes';
    }
    expect(addEffect).toBe('yes');
    results.push({ control: '"+" add', elementAtClick: addHit.elementDesc, effect: addEffect });

    // 4. Quantity plus and minus (and respect stock limit)
    const qtyButtons = page.locator('.panel-bill .bill-qty-btn');
    const minusBtn = qtyButtons.nth(0);
    const plusBtn = qtyButtons.nth(1);
    const hitPlus = await getElementAtCenter(plusBtn);
    let qtyEffect = 'no';

    // Click plus
    await page.mouse.click(hitPlus.cx, hitPlus.cy);
    await page.waitForTimeout(300);
    const qtyAfterPlus = (await page.locator('.panel-bill .bill-item-qty').first().innerText()).trim();

    // Check total changed
    const payableTextAfterPlus = await page.locator('.spatial-ornament-bar div:has-text("PAYABLE TOTAL") + div').innerText();
    expect(payableTextAfterPlus).not.toBe(initialPayableText);

    // Test minus back to 1
    const hitMinus = await getElementAtCenter(minusBtn);
    await page.mouse.click(hitMinus.cx, hitMinus.cy);
    await page.waitForTimeout(300);
    const qtyAfterMinus = (await page.locator('.panel-bill .bill-item-qty').first().innerText()).trim();
    if (qtyAfterPlus === '2' && qtyAfterMinus === '1') {
      qtyEffect = 'yes';
    }
    expect(qtyEffect).toBe('yes');
    results.push({ control: 'quantity plus and minus', elementAtClick: hitPlus.elementDesc, effect: qtyEffect });

    // 5. Remove line
    const removeBtn = page.locator('.panel-bill button[title="Remove item"]').first();
    const removeHit = await getElementAtCenter(removeBtn);
    let removeEffect = 'no';
    await page.mouse.click(removeHit.cx, removeHit.cy);
    await page.waitForTimeout(300);
    const cartCountAfterRemove = await page.locator('.panel-bill .bill-item-card').count();
    if (cartCountAfterRemove === 0) {
      removeEffect = 'yes';
    }
    expect(removeEffect).toBe('yes');
    results.push({ control: 'remove line', elementAtClick: removeHit.elementDesc, effect: removeEffect });

    // 6. Find Alts
    let outOfStockTile = page.locator('.product-tile-3d:has-text("Find Alts")').first();
    if (await outOfStockTile.count() === 0) {
      outOfStockTile = page.locator('.product-tile-3d:has-text("0 in stock")').first();
    }
    let findAltsHitDesc = 'NO_OUT_OF_STOCK';
    let findAltsEffect = 'no';
    if (await outOfStockTile.count() > 0) {
      await outOfStockTile.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const hit = await getElementAtCenter(outOfStockTile);
      findAltsHitDesc = hit.elementDesc;
      await page.mouse.click(hit.cx, hit.cy);
      await page.waitForTimeout(800);
      const helperText = await page.locator('.panel-helper').innerText();
      if (helperText.includes('OUT OF STOCK') || helperText.includes('RECOMMENDED')) {
        findAltsEffect = 'yes';
      }
      expect(findAltsEffect).toBe('yes');
    }
    results.push({ control: 'Find Alts', elementAtClick: findAltsHitDesc, effect: findAltsEffect });

    // Add in-stock product again for Pay and Bill
    const freshTile = page.locator('.product-tile-3d:has(button[title="Add to Bill"])').first();
    await freshTile.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const freshAddBtn = freshTile.locator('button[title="Add to Bill"]');
    const freshHit = await getElementAtCenter(freshAddBtn);
    const itemStockTextBeforePay = await freshTile.locator('.stock-chip').innerText();
    const itemStockBeforePay = parseInt(itemStockTextBeforePay, 10);
    const freshName = (await freshTile.locator('h3').innerText()).trim();

    await page.mouse.click(freshHit.cx, freshHit.cy);
    await page.waitForTimeout(400);

    // 7. Pay and Bill
    const payBtn = page.locator('.spatial-ornament-bar .ornament-pay-btn');
    const payHit = await getElementAtCenter(payBtn);
    let payEffect = 'no';
    await page.mouse.click(payHit.cx, payHit.cy);
    await page.waitForTimeout(1500);

    const receiptModal = page.locator('.printable-receipt');
    expect(await receiptModal.isVisible()).toBe(true);

    // Close receipt
    await page.click('button:has-text("+ Start New Bill")');
    await page.waitForTimeout(1000);

    // Confirm shelf stock dropped
    const updatedTile = page.locator(`.product-tile-3d:has-text("${freshName}")`).first();
    await updatedTile.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const updatedStockText = await updatedTile.locator('.stock-chip').innerText();
    const updatedStock = parseInt(updatedStockText, 10);
    expect(updatedStock).toBe(itemStockBeforePay - 1);
    payEffect = 'yes';
    results.push({ control: 'Pay and Bill', elementAtClick: payHit.elementDesc, effect: payEffect });

    // 8. Log out
    const logoutBtn = page.locator('header button:has-text("Log out")');
    const logoutHit = await getElementAtCenter(logoutBtn);
    let logoutEffect = 'no';
    await page.mouse.click(logoutHit.cx, logoutHit.cy);
    await page.waitForTimeout(800);
    if (page.url().endsWith('/') || page.url().includes('login')) {
      logoutEffect = 'yes';
    }
    expect(logoutEffect).toBe('yes');
    results.push({ control: 'Log out', elementAtClick: logoutHit.elementDesc, effect: logoutEffect });

    console.log('\n=== CONTROL HIT TEST RESULTS AFTER FIX ===');
    console.table(results);
    console.log('=== CONSOLE ERRORS ===', consoleMessages.filter(m => m.startsWith('[error]')));
    console.log('=== PAGE ERRORS ===', pageErrors);
    console.log('===========================================\n');
  });

  test('Auto refresh after 35s keeps search text and cart state intact', async ({ page }) => {
    test.setTimeout(60000);
    // Login
    await page.goto('/');
    await page.fill('input[type="email"]', 'cashier@optistock.com');
    await page.fill('input[type="password"]', 'cashier123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/cashier');
    await page.waitForSelector('.spatial-viewport', { state: 'visible' });
    await page.waitForTimeout(1500);

    // Set search query
    const searchInput = page.locator('.spatial-search-box .spatial-search-input');
    await searchInput.fill('Milk');

    // Add item to cart
    const firstTile = page.locator('.product-tile-3d:has(button[title="Add to Bill"])').first();
    await firstTile.locator('button[title="Add to Bill"]').click();
    await page.waitForTimeout(500);

    const initialCartCount = await page.locator('.panel-bill .bill-item-card').count();
    expect(initialCartCount).toBe(1);
    const initialItemName = await page.locator('.panel-bill .bill-item-card strong').first().innerText();

    console.log('Waiting 35 seconds to test auto-refresh persistence...');
    await page.waitForTimeout(35000);

    // Verify search query survived
    const searchValAfter = await searchInput.inputValue();
    expect(searchValAfter).toBe('Milk');

    // Verify cart survived
    const cartCountAfter = await page.locator('.panel-bill .bill-item-card').count();
    expect(cartCountAfter).toBe(1);
    const itemNameAfter = await page.locator('.panel-bill .bill-item-card strong').first().innerText();
    expect(itemNameAfter).toBe(initialItemName);

    console.log('Search text and cart state survived 35s auto-refresh successfully.');
  });
});
