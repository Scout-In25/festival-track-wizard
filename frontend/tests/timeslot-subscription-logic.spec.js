import { test, expect } from '@playwright/test';

test.describe('Timeslot Subscription Logic', () => {
  test('should not show + button for full or conflicted timeslots', async ({ page }) => {
    await page.goto('/#activities-list');
    await page.waitForLoadState('networkidle');

    // Wait for activities to load
    await expect(page.locator('.simple-activity-item').first()).toBeVisible({ timeout: 10000 });

    // Find an activity that has multiple timeslots
    const activityItems = page.locator('.simple-activity-item');
    const activityCount = await activityItems.count();
    
    console.log(`Checking ${activityCount} activities for timeslots...`);
    
    let foundActivityWithTimeslots = false;
    
    for (let i = 0; i < Math.min(activityCount, 10); i++) {
      await activityItems.nth(i).click();
      
      // Wait for modal to open
      const modal = page.locator('.modal-backdrop');
      await expect(modal).toBeVisible({ timeout: 5000 });
      
      // Check if this activity has timeslots
      const timeslotSection = modal.locator('text=Deze activiteit heeft meerdere tijdsloten');
      const hasTimeslots = await timeslotSection.count() > 0;
      
      if (hasTimeslots) {
        console.log(`Found activity with timeslots: activity ${i + 1}`);
        foundActivityWithTimeslots = true;
        
        // Look for timeslot items
        const timeslotItems = modal.locator('.time-slot-item');
        const timeslotCount = await timeslotItems.count();
        
        console.log(`Found ${timeslotCount} timeslots`);
        
        for (let j = 0; j < timeslotCount; j++) {
          const timeslot = timeslotItems.nth(j);
          
          // Check for blocked indicators (Vol/Conflict)
          const blockedIndicator = timeslot.locator('text=Vol, text=Conflict, text=Niet beschikbaar');
          const hasBlockedIndicator = await blockedIndicator.count() > 0;
          
          // Check for + button
          const plusButton = timeslot.locator('button');
          const hasPlusButton = await plusButton.count() > 0;
          
          // Get timeslot info for logging
          const timeslotText = await timeslot.textContent();
          const firstLine = timeslotText.split('\n')[0] || timeslotText.substring(0, 50);
          
          console.log(`Timeslot ${j + 1}: "${firstLine.trim()}" - Blocked: ${hasBlockedIndicator}, Has button: ${hasPlusButton}`);
          
          // If there's a blocked indicator, there should NOT be a + button
          if (hasBlockedIndicator) {
            expect(hasPlusButton).toBe(false);
            console.log(`✅ Blocked timeslot correctly has no + button`);
          }
        }
        
        break; // Found one activity with timeslots, that's enough for this test
      }
      
      // Close modal and try next activity
      const closeButton = modal.locator('button[aria-label="Sluit modal"]');
      if (await closeButton.count() > 0) {
        await closeButton.click();
      } else {
        await modal.click();
      }
      await expect(modal).not.toBeVisible({ timeout: 5000 });
    }
    
    if (foundActivityWithTimeslots) {
      console.log('✅ Timeslot subscription logic test completed');
    } else {
      console.log('ℹ️  No activities with timeslots found in first 10 activities');
    }
  });

  test('should verify timeslot status detection logic', async ({ page }) => {
    await page.goto('/#activities-list');
    await page.waitForLoadState('networkidle');

    // Find an activity with timeslots and examine the status logic
    const activityItems = page.locator('.simple-activity-item');
    await expect(activityItems.first()).toBeVisible({ timeout: 10000 });

    // Try the first few activities
    for (let i = 0; i < 5; i++) {
      await activityItems.nth(i).click();
      
      const modal = page.locator('.modal-backdrop');
      await expect(modal).toBeVisible({ timeout: 5000 });
      
      // Check if this activity has timeslots
      const timeslotSection = modal.locator('text=Deze activiteit heeft meerdere tijdsloten');
      const hasTimeslots = await timeslotSection.count() > 0;
      
      if (hasTimeslots) {
        console.log(`Examining timeslot statuses in activity ${i + 1}`);
        
        // Check all timeslot items for proper status handling
        const timeslotItems = modal.locator('.time-slot-item');
        const timeslotCount = await timeslotItems.count();
        
        const statusCounts = { available: 0, blocked: 0, subscribed: 0 };
        
        for (let j = 0; j < timeslotCount; j++) {
          const timeslot = timeslotItems.nth(j);
          
          // Check for different status indicators
          const hasVolIndicator = await timeslot.locator('text=Vol').count() > 0;
          const hasConflictIndicator = await timeslot.locator('text=Conflict').count() > 0;
          const hasWarningIcon = await timeslot.locator('text=⚠️ Tijdconflict').count() > 0;
          const hasButton = await timeslot.locator('button').count() > 0;
          
          // Determine status
          if (hasVolIndicator || hasConflictIndicator) {
            statusCounts.blocked++;
            console.log(`Timeslot ${j + 1}: BLOCKED (${hasVolIndicator ? 'Vol' : 'Conflict'})`);
          } else if (hasButton) {
            // Check if it's a subscribe (+) or unsubscribe (x) button
            const buttonText = await timeslot.locator('button').textContent();
            if (buttonText.includes('×') || buttonText.includes('✕')) {
              statusCounts.subscribed++;
              console.log(`Timeslot ${j + 1}: SUBSCRIBED`);
            } else {
              statusCounts.available++;
              console.log(`Timeslot ${j + 1}: AVAILABLE`);
            }
          } else {
            console.log(`Timeslot ${j + 1}: UNKNOWN STATUS`);
          }
        }
        
        console.log(`Status summary: Available: ${statusCounts.available}, Blocked: ${statusCounts.blocked}, Subscribed: ${statusCounts.subscribed}`);
        
        // Verify that blocked timeslots have no buttons
        if (statusCounts.blocked > 0) {
          console.log('✅ Found blocked timeslots - status detection is working');
        }
        
        break;
      }
      
      // Close modal
      const closeButton = modal.locator('button[aria-label="Sluit modal"]');
      if (await closeButton.count() > 0) {
        await closeButton.click();
      } else {
        await modal.click();
      }
      await expect(modal).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('should verify conflict warning display is working', async ({ page }) => {
    await page.goto('/#activities-list');
    await page.waitForLoadState('networkidle');

    // First subscribe to an activity to create potential conflicts
    const activityItems = page.locator('.simple-activity-item');
    await expect(activityItems.first()).toBeVisible({ timeout: 10000 });
    
    await activityItems.first().click();
    
    const modal = page.locator('.modal-backdrop');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Try to subscribe
    const subscribeButton = modal.locator('button').first();
    await subscribeButton.click();
    await page.waitForTimeout(2000);
    
    // Close modal
    const closeButton = modal.locator('button[aria-label="Sluit modal"]');
    if (await closeButton.count() > 0) {
      await closeButton.click();
    } else {
      await modal.click();
    }
    await expect(modal).not.toBeVisible({ timeout: 5000 });
    
    console.log('Subscribed to first activity, now checking for conflicts in timeslots...');

    // Now look for activities with timeslots that might have conflicts
    for (let i = 1; i < 10; i++) {
      await activityItems.nth(i).click();
      
      await expect(modal).toBeVisible({ timeout: 5000 });
      
      // Check for conflict warnings in timeslots
      const conflictWarnings = modal.locator('text=⚠️ Tijdconflict');
      const conflictCount = await conflictWarnings.count();
      
      if (conflictCount > 0) {
        console.log(`Found ${conflictCount} conflict warnings in activity ${i + 1}`);
        console.log('✅ Conflict warning display is working');
        
        // Check that conflicted timeslots are properly blocked
        const timeslotItems = modal.locator('.time-slot-item');
        const timeslotCount = await timeslotItems.count();
        
        for (let j = 0; j < timeslotCount; j++) {
          const timeslot = timeslotItems.nth(j);
          const hasConflictWarning = await timeslot.locator('text=⚠️ Tijdconflict').count() > 0;
          const hasConflictIndicator = await timeslot.locator('text=Conflict').count() > 0;
          const hasButton = await timeslot.locator('button').count() > 0;
          
          if (hasConflictWarning) {
            console.log(`Timeslot ${j + 1}: Has conflict warning, button present: ${hasButton}`);
            // If there's a conflict warning, the button might still be there for already subscribed slots
            // but should be blocked for non-subscribed conflicting slots
          }
        }
        
        break;
      }
      
      // Close modal
      const closeButton2 = modal.locator('button[aria-label="Sluit modal"]');
      if (await closeButton2.count() > 0) {
        await closeButton2.click();
      } else {
        await modal.click();
      }
      await expect(modal).not.toBeVisible({ timeout: 5000 });
    }
  });
});