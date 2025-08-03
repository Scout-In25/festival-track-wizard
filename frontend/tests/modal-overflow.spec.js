import { test, expect } from '@playwright/test';

test.describe('Modal Body Overflow Fix', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#activities-list');
    await page.waitForLoadState('networkidle');
  });

  test('should properly restore body overflow after modal close via close button', async ({ page }) => {
    // Check initial body overflow state
    const initialOverflow = await page.evaluate(() => {
      return document.body.style.overflow;
    });
    console.log('Initial body overflow:', initialOverflow);

    // Open modal by clicking an activity
    const activityItems = page.locator('.simple-activity-item');
    await expect(activityItems.first()).toBeVisible({ timeout: 10000 });
    await activityItems.first().click();

    // Verify modal is open and body overflow is hidden
    const modal = page.locator('.modal-backdrop');
    await expect(modal).toBeVisible({ timeout: 5000 });

    const overflowDuringModal = await page.evaluate(() => {
      return document.body.style.overflow;
    });
    console.log('Body overflow while modal is open:', overflowDuringModal);
    expect(overflowDuringModal).toBe('hidden');

    // Close modal via close button
    const closeButton = modal.locator('button[aria-label="Sluit modal"]');
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    // Wait for modal to close
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Check that body overflow is restored
    const finalOverflow = await page.evaluate(() => {
      return document.body.style.overflow;
    });
    console.log('Final body overflow after modal close:', finalOverflow);
    
    // Should be restored to initial state (empty string or original value)
    expect(finalOverflow).toBe(initialOverflow);
    console.log('✅ Body overflow properly restored after close button click');
  });

  test('should properly restore body overflow after modal close via backdrop click', async ({ page }) => {
    // Check initial body overflow state
    const initialOverflow = await page.evaluate(() => {
      return document.body.style.overflow;
    });

    // Open modal
    const activityItems = page.locator('.simple-activity-item');
    await expect(activityItems.first()).toBeVisible({ timeout: 10000 });
    await activityItems.first().click();

    // Verify modal is open and body overflow is hidden
    const modal = page.locator('.modal-backdrop');
    await expect(modal).toBeVisible({ timeout: 5000 });

    const overflowDuringModal = await page.evaluate(() => {
      return document.body.style.overflow;
    });
    expect(overflowDuringModal).toBe('hidden');

    // Close modal via backdrop click
    await modal.click();

    // Wait for modal to close
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Check that body overflow is restored
    const finalOverflow = await page.evaluate(() => {
      return document.body.style.overflow;
    });
    
    expect(finalOverflow).toBe(initialOverflow);
    console.log('✅ Body overflow properly restored after backdrop click');
  });

  test('should properly restore body overflow after modal close via ESC key', async ({ page }) => {
    // Check initial body overflow state
    const initialOverflow = await page.evaluate(() => {
      return document.body.style.overflow;
    });

    // Open modal
    const activityItems = page.locator('.simple-activity-item');
    await expect(activityItems.first()).toBeVisible({ timeout: 10000 });
    await activityItems.first().click();

    // Verify modal is open and body overflow is hidden
    const modal = page.locator('.modal-backdrop');
    await expect(modal).toBeVisible({ timeout: 5000 });

    const overflowDuringModal = await page.evaluate(() => {
      return document.body.style.overflow;
    });
    expect(overflowDuringModal).toBe('hidden');

    // Close modal via ESC key
    await page.keyboard.press('Escape');

    // Wait for modal to close
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Check that body overflow is restored
    const finalOverflow = await page.evaluate(() => {
      return document.body.style.overflow;
    });
    
    expect(finalOverflow).toBe(initialOverflow);
    console.log('✅ Body overflow properly restored after ESC key press');
  });

  test('should handle multiple modal open/close cycles correctly', async ({ page }) => {
    const initialOverflow = await page.evaluate(() => {
      return document.body.style.overflow;
    });

    const activityItems = page.locator('.simple-activity-item');
    await expect(activityItems.first()).toBeVisible({ timeout: 10000 });

    // Perform multiple open/close cycles
    for (let i = 0; i < 3; i++) {
      console.log(`\n--- Cycle ${i + 1} ---`);
      
      // Open modal
      await activityItems.first().click();
      
      const modal = page.locator('.modal-backdrop');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Verify body overflow is hidden
      const overflowDuringModal = await page.evaluate(() => {
        return document.body.style.overflow;
      });
      expect(overflowDuringModal).toBe('hidden');
      console.log(`Cycle ${i + 1}: Modal open, overflow = '${overflowDuringModal}'`);

      // Close modal (alternate between different methods)
      if (i === 0) {
        // Close with button
        const closeButton = modal.locator('button[aria-label="Sluit modal"]');
        await closeButton.click();
      } else if (i === 1) {
        // Close with ESC
        await page.keyboard.press('Escape');
      } else {
        // Close with backdrop
        await modal.click();
      }

      await expect(modal).not.toBeVisible({ timeout: 5000 });

      // Check overflow is restored
      const finalOverflow = await page.evaluate(() => {
        return document.body.style.overflow;
      });
      expect(finalOverflow).toBe(initialOverflow);
      console.log(`Cycle ${i + 1}: Modal closed, overflow = '${finalOverflow}'`);

      // Small delay between cycles
      await page.waitForTimeout(500);
    }

    console.log('✅ Multiple modal cycles completed successfully');
  });

  test('should restore body overflow even if page navigation happens while modal is open', async ({ page }) => {
    const initialOverflow = await page.evaluate(() => {
      return document.body.style.overflow;
    });

    // Open modal
    const activityItems = page.locator('.simple-activity-item');
    await expect(activityItems.first()).toBeVisible({ timeout: 10000 });
    await activityItems.first().click();

    const modal = page.locator('.modal-backdrop');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify modal is open and body overflow is hidden
    const overflowDuringModal = await page.evaluate(() => {
      return document.body.style.overflow;
    });
    expect(overflowDuringModal).toBe('hidden');

    // Navigate away while modal is open (simulates unexpected navigation)
    await page.goto('/#track');
    await page.waitForLoadState('networkidle');

    // Check that body overflow is restored after navigation
    const finalOverflow = await page.evaluate(() => {
      return document.body.style.overflow;
    });
    
    // Should be restored (due to unmount cleanup effect)
    expect(finalOverflow).toBe(initialOverflow);
    console.log('✅ Body overflow restored after navigation while modal was open');
  });
});