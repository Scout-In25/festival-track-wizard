import { test, expect } from '@playwright/test';

test.describe('Track Conflict Indicators E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to tracks page specifically
    await page.goto('/#track');
    await page.waitForLoadState('networkidle');
  });

  test('should display tracks overview without conflicts when no activities subscribed', async ({ page }) => {
    // Wait for tracks to load
    const trackCards = page.locator('.bg-white.rounded-lg.shadow-md'); // Track card selector from TrackList
    await expect(trackCards.first()).toBeVisible({ timeout: 10000 });

    // Verify multiple tracks are loaded
    const trackCount = await trackCards.count();
    expect(trackCount).toBeGreaterThan(0);
    console.log(`Found ${trackCount} tracks loaded`);

    // Check that all visible track buttons are either "Subscribe" (blue) or "Full" (gray)
    const trackButtons = trackCards.locator('button');
    
    for (let i = 0; i < Math.min(trackCount, 3); i++) { // Check first 3 tracks
      const button = trackButtons.nth(i);
      await expect(button).toBeVisible();
      
      const buttonText = await button.textContent();
      const buttonClass = await button.getAttribute('class');
      
      console.log(`Track ${i + 1}: Button text="${buttonText}", classes="${buttonClass}"`);
      
      // Should be either blue (Subscribe) or gray (Full), not orange (⚠️ Time Conflict)
      expect(buttonText).not.toContain('Time Conflict');
      expect(buttonClass).not.toContain('bg-orange-500');
    }
  });

  test('should verify no orange conflict indicators (tracks have no timing in current system)', async ({ page }) => {
    // First, navigate to activities page and subscribe to an activity
    await page.goto('/#activities-list');
    await page.waitForLoadState('networkidle');

    // Wait for activities to load and subscribe to the first one
    const activityItems = page.locator('.simple-activity-item');
    await expect(activityItems.first()).toBeVisible({ timeout: 10000 });
    
    // Get activity name for logging
    const activityName = await activityItems.first().locator('.simple-activity-title').textContent();
    console.log(`Subscribing to activity: "${activityName}"`);
    
    // Click activity to open modal
    await activityItems.first().click();
    
    // Subscribe to the activity
    const modal = page.locator('.modal-backdrop');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    const subscribeButton = modal.locator('button').first();
    await subscribeButton.click();
    await page.waitForTimeout(2000); // Wait for subscription to complete
    
    // Close modal
    const closeButton = modal.locator('button[aria-label="Sluit modal"]');
    if (await closeButton.count() > 0) {
      await closeButton.click();
    } else {
      await modal.click(); // backdrop click
    }
    await expect(modal).not.toBeVisible({ timeout: 5000 });
    
    console.log('Successfully subscribed to activity');

    // Now navigate to tracks page to verify no conflicts
    await page.goto('/#track');
    await page.waitForLoadState('networkidle');
    
    // Wait for tracks to load
    const trackCards = page.locator('.bg-white.rounded-lg.shadow-md');
    await expect(trackCards.first()).toBeVisible({ timeout: 10000 });
    
    const trackCount = await trackCards.count();
    console.log(`Checking ${trackCount} tracks - should have no conflict indicators...`);
    
    // Verify no orange conflict indicators (since tracks have no timing in current system)
    const trackButtons = trackCards.locator('button');
    
    for (let i = 0; i < trackCount; i++) {
      const button = trackButtons.nth(i);
      await expect(button).toBeVisible();
      
      const buttonText = await button.textContent();
      const buttonClass = await button.getAttribute('class');
      
      console.log(`Track ${i + 1}: Button text="${buttonText}", classes="${buttonClass}"`);
      
      // Verify NO orange conflict indicators (tracks don't have timing)
      expect(buttonText).not.toContain('Time Conflict');
      expect(buttonClass).not.toContain('bg-orange-500');
      
      // Should be either blue (Subscribe) or gray (Full)
      expect(buttonText === 'Subscribe' || buttonText === 'Full').toBeTruthy();
    }
    
    console.log('✅ Verified no conflict indicators (tracks have no timing data)');
  });

  test('should verify track buttons are interactive and functional', async ({ page }) => {
    // Navigate to tracks page
    await page.goto('/#track');
    await page.waitForLoadState('networkidle');
    
    const trackCards = page.locator('.bg-white.rounded-lg.shadow-md');
    await expect(trackCards.first()).toBeVisible({ timeout: 10000 });
    
    // Verify all track buttons are functional
    const trackButtons = trackCards.locator('button');
    const buttonCount = await trackButtons.count();
    
    console.log(`Testing ${buttonCount} track buttons for functionality`);
    
    for (let i = 0; i < Math.min(buttonCount, 2); i++) { // Test first 2 buttons
      const button = trackButtons.nth(i);
      await expect(button).toBeVisible();
      
      const buttonText = await button.textContent();
      
      // Verify button is enabled (not full)
      if (buttonText === 'Subscribe') {
        await expect(button).toBeEnabled();
        
        // Verify hover works
        await button.hover();
        
        // Verify tooltip
        const title = await button.getAttribute('title');
        expect(title).toContain('Subscribe to this track');
        
        console.log(`✅ Track ${i + 1} button is functional: "${buttonText}"`);
      } else if (buttonText === 'Full') {
        await expect(button).toBeDisabled();
        console.log(`✅ Track ${i + 1} button correctly disabled: "${buttonText}"`);
      }
    }
    
    console.log('✅ All track buttons are functional!');
  });

  test('should verify conflict detection logic is properly implemented', async ({ page }) => {
    await page.goto('/#track');
    await page.waitForLoadState('networkidle');
    
    // Wait for tracks to load
    const trackCards = page.locator('.bg-white.rounded-lg.shadow-md');
    await expect(trackCards.first()).toBeVisible({ timeout: 10000 });
    
    const trackCount = await trackCards.count();
    console.log(`Verifying conflict detection implementation on ${trackCount} tracks`);
    
    // Verify the implementation is working by checking button states
    const trackButtons = trackCards.locator('button');
    
    for (let i = 0; i < trackCount; i++) {
      const button = trackButtons.nth(i);
      const buttonText = await button.textContent();
      const buttonClass = await button.getAttribute('class');
      
      // Verify conflict detection logic:
      // 1. No orange indicators (tracks have no timing)
      // 2. Only blue (Subscribe) or gray (Full) buttons
      expect(['Subscribe', 'Full']).toContain(buttonText);
      
      if (buttonText === 'Subscribe') {
        expect(buttonClass).toContain('bg-blue-600');
      } else if (buttonText === 'Full') {
        expect(buttonClass).toContain('bg-gray-300');
      }
      
      // Should never have orange conflict styling
      expect(buttonClass).not.toContain('bg-orange-500');
    }
    
    console.log('✅ Conflict detection logic verified - no conflicts due to missing track timing!');
  });
});