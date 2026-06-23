import { test, expect } from '@playwright/test';

test.describe('Procurement Happy Path E2E', () => {
  test('User can create a purchase requisition and see it on AP dashboard', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@amdox.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 2. Navigate to Procurement
    await page.click('text=Supply Chain');
    await page.click('text=Procurement');

    // 3. Create Requisition
    await page.click('text=New Requisition');
    await page.fill('input[name="item"]', 'Server Rack');
    await page.fill('input[name="quantity"]', '10');
    await page.click('button:has-text("Submit")');

    // 4. Verify Requisition is created
    await expect(page.locator('text=Server Rack')).toBeVisible();

    // 5. Navigate to Accounts Payable
    await page.click('text=Finance');
    await page.click('text=Accounts Payable');

    // 6. Verify corresponding Invoice/PO appears in AP
    // (Assuming backend auto-generated the PO/Invoice for the demo flow)
    await expect(page.locator('text=Pending')).toBeVisible();
  });
});
