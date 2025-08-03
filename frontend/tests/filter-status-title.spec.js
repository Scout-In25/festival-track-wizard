import { test, expect } from '@playwright/test';

test.describe('Filter Status Title Toggle', () => {
  test('should show "Uniek" when calendar toggle is off (simple view) and "Volledig" when calendar toggle is on', async ({ page }) => {
    await page.goto('/#activities-list');
    await page.waitForLoadState('networkidle');

    // Wait for page to load
    await expect(page.locator('.simple-activity-item').first()).toBeVisible({ timeout: 10000 });

    // Check initial state (should be simple view = "Uniek")
    const statusTitle = page.locator('.filter-status-title');
    await expect(statusTitle).toBeVisible();
    
    const initialTitle = await statusTitle.textContent();
    console.log(`Initial filter status title: "${initialTitle}"`);
    expect(initialTitle).toBe('Uniek');
    console.log('✅ Simple view shows "Uniek"');

    // Find and toggle the calendar view
    const calendarToggle = page.locator('.toggle-container:has-text("Kalender Weergave")');
    await expect(calendarToggle).toBeVisible();
    
    await calendarToggle.locator('.toggle-switch').click();
    await page.waitForTimeout(500);

    // Check the title after switching to calendar view
    const calendarTitle = await statusTitle.textContent();
    console.log(`Calendar view filter status title: "${calendarTitle}"`);
    expect(calendarTitle).toBe('Volledig');
    console.log('✅ Calendar view shows "Volledig"');

    // Toggle back to simple view
    await calendarToggle.locator('.toggle-switch').click();
    await page.waitForTimeout(500);

    // Check the title returns to "Uniek"
    const backToSimpleTitle = await statusTitle.textContent();
    console.log(`Back to simple view filter status title: "${backToSimpleTitle}"`);
    expect(backToSimpleTitle).toBe('Uniek');
    console.log('✅ Back to simple view shows "Uniek" again');

    console.log('✅ Filter status title toggles correctly based on calendar view state');
  });

  test('should preserve title behavior with other filters active', async ({ page }) => {
    await page.goto('/#activities-list');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.simple-activity-item').first()).toBeVisible({ timeout: 10000 });

    const statusTitle = page.locator('.filter-status-title');

    // Test "Alleen Beschikbaar" filter
    const eligibleToggle = page.locator('.toggle-container:has-text("Alleen Beschikbaar")');
    if (await eligibleToggle.count() > 0) {
      await eligibleToggle.locator('.toggle-switch').click();
      await page.waitForTimeout(500);
      
      const eligibleTitle = await statusTitle.textContent();
      console.log(`With "Alleen Beschikbaar" active: "${eligibleTitle}"`);
      expect(eligibleTitle).toBe('Beschikbaar');
      console.log('✅ "Alleen Beschikbaar" filter overrides calendar state');

      // Turn off the filter
      await eligibleToggle.locator('.toggle-switch').click();
      await page.waitForTimeout(500);
    }

    // Test "Mijn Schema" filter if available
    const myScheduleToggle = page.locator('.toggle-container:has-text("Mijn Schema")');
    if (await myScheduleToggle.count() > 0) {
      await myScheduleToggle.locator('.toggle-switch').click();
      await page.waitForTimeout(500);
      
      const scheduleTitle = await statusTitle.textContent();
      console.log(`With "Mijn Schema" active: "${scheduleTitle}"`);
      expect(scheduleTitle).toBe('Mijn Schema');
      console.log('✅ "Mijn Schema" filter overrides calendar state');

      // Turn off the filter
      await myScheduleToggle.locator('.toggle-switch').click();
      await page.waitForTimeout(500);
    }

    // After turning off other filters, should return to calendar-based state
    const finalTitle = await statusTitle.textContent();
    console.log(`Final state (should depend on calendar view): "${finalTitle}"`);
    // Should be either "Uniek" (simple view) or "Volledig" (calendar view)
    expect(['Uniek', 'Volledig']).toContain(finalTitle);
    console.log('✅ Returns to calendar-based title after other filters are off');
  });

  test('should verify title changes happen immediately on toggle', async ({ page }) => {
    await page.goto('/#activities-list');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.simple-activity-item').first()).toBeVisible({ timeout: 10000 });

    const statusTitle = page.locator('.filter-status-title');
    const calendarToggle = page.locator('.toggle-container:has-text("Kalender Weergave")');

    // Perform multiple quick toggles to test responsiveness
    for (let i = 0; i < 3; i++) {
      console.log(`\n--- Toggle cycle ${i + 1} ---`);
      
      // Start in simple view
      let currentTitle = await statusTitle.textContent();
      if (currentTitle !== 'Uniek') {
        await calendarToggle.locator('.toggle-switch').click();
        await page.waitForTimeout(200);
      }
      
      currentTitle = await statusTitle.textContent();
      console.log(`Simple view: "${currentTitle}"`);
      expect(currentTitle).toBe('Uniek');
      
      // Switch to calendar view
      await calendarToggle.locator('.toggle-switch').click();
      await page.waitForTimeout(200);
      
      currentTitle = await statusTitle.textContent();
      console.log(`Calendar view: "${currentTitle}"`);
      expect(currentTitle).toBe('Volledig');
    }

    console.log('✅ Title changes respond immediately to toggles');
  });
});