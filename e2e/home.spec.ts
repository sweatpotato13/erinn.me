import { expect, test } from '@playwright/test';

test.describe('Homepage Tests', () => {
  test('Homepage loads correctly', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Check if page is loaded
    await expect(page).toHaveTitle(/Erinn/);
    
    // Check if page content is displayed correctly
    await expect(page.locator('main')).toBeVisible();
  });
  
  test('Navigation works correctly', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Check if navigation header element exists
    await expect(page.locator('header.navbar')).toBeVisible();
    
    // Check if navigation cards are displayed
    await expect(page.locator('a[href="/auction"]')).toBeVisible();
    await expect(page.locator('a[href="/npc-shop"]')).toBeVisible();
    await expect(page.locator('a[href="/dungeon"]')).toBeVisible();
    await expect(page.locator('a[href="/horn"]')).toBeVisible();
    
    // Test clicking the auction link
    const auctionLink = page.locator('a[href="/auction"]');
    await auctionLink.click();
    
    // Check if URL has changed after clicking
    await expect(page).toHaveURL(/auction/);
  });
}); 