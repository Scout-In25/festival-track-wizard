import { test, expect } from '@playwright/test';

test.describe('Core Login Visibility Tests - Fast', () => {
  test.describe('Logged-Out State (VITE_USERNAME not set)', () => {
    test('status indicators should be hidden', async ({ page }) => {
      await page.goto('/#activities-list');
      await page.waitForLoadState('networkidle');
      
      // Wait for activities to load
      await expect(page.locator('.simple-activity-item').first()).toBeVisible({ timeout: 10000 });
      
      // Status indicators should NOT be visible
      const statusIndicators = page.locator('.status-indicator');
      const indicatorCount = await statusIndicators.count();
      
      expect(indicatorCount).toBe(0);
      console.log('✅ Status indicators correctly hidden for logged-out users');
    });

    test('user-specific toggles should be hidden', async ({ page }) => {
      await page.goto('/#activities-list');
      await page.waitForLoadState('networkidle');
      
      // "Mijn Schema" toggle should NOT be visible
      const myScheduleToggle = page.locator('.toggle-container:has-text("Mijn Schema")');
      await expect(myScheduleToggle).not.toBeVisible();
      
      // "Alleen Beschikbaar" toggle should NOT be visible
      const eligibleOnlyToggle = page.locator('.toggle-container:has-text("Alleen Beschikbaar")');
      await expect(eligibleOnlyToggle).not.toBeVisible();
      
      // Only "Kalender Weergave" toggle should be visible
      const calendarToggle = page.locator('.toggle-container:has-text("Kalender Weergave")');
      await expect(calendarToggle).toBeVisible();
      
      console.log('✅ User-specific toggles correctly hidden for logged-out users');
    });
  });

  test.describe('Manual Test Instructions', () => {
    test('instructions for testing logged-in state', async ({ page }) => {
      // This test just provides instructions
      console.log('');
      console.log('🔧 TO TEST LOGGED-IN STATE:');
      console.log('   1. Edit frontend/.env and uncomment: VITE_USERNAME=timo');
      console.log('   2. Wait for dev server to reload (watch mode)');
      console.log('   3. Refresh browser');
      console.log('   4. Verify:');
      console.log('      • Status indicators (colored dots) appear next to activities');
      console.log('      • "Mijn Schema" toggle is visible');
      console.log('      • "Alleen Beschikbaar" toggle is visible');
      console.log('      • All 3 toggles are visible total');
      console.log('      • Activity modals show subscription sections');
      console.log('   5. Comment out VITE_USERNAME again to return to logged-out state');
      console.log('');
      
      // Always pass this test
      expect(true).toBe(true);
    });
  });
});