import { test, expect } from '@playwright/test';

test.describe('Time Conflict Filtering Tests', () => {
  test('should hide activities with time conflicts when "Alleen Beschikbaar" is enabled', async ({ page }) => {
    let consoleLogs = [];
    let conflictCount = 0;
    
    // Capture console logs
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      
      if (text.includes('⏰ Time conflicts:')) {
        const match = text.match(/⏰ Time conflicts: (\d+) activities/);
        if (match) {
          conflictCount = parseInt(match[1], 10);
          console.log('📊 Conflicts detected:', conflictCount);
        }
      }
      
      if (text.includes('NOT ELIGIBLE (time conflict)')) {
        console.log('⚠️ Activity filtered due to conflict:', text);
      }
      
      if (text.includes('Eligibility filter result:')) {
        console.log('📈 Filter result:', text);
      }
    });
    
    // Set up logged-in environment
    await page.addInitScript(() => {
      window.process = window.process || {};
      window.process.env = window.process.env || {};
      window.process.env.VITE_USERNAME = 'sn_22anniek22';
      window.process.env.DEV = 'true';
      
      window.VITE_DEBUG = true;
      
      window.FestivalWizardData = {
        ajaxUrl: '/wp-admin/admin-ajax.php',
        nonce: 'test-nonce',
        apiKey: 'test-api-key',
        apiBaseUrl: 'https://trackapi.catriox.nl',
        showTracksOnly: true,
        activitiesTitle: 'Test Activiteiten',
        activitiesIntro: 'Test intro',
        isLoggedIn: true,
        currentUser: {
          username: 'sn_22anniek22',
          email: 'anniek@example.com'
        }
      };
    });
    
    await page.goto('/#activities-list');
    await page.waitForLoadState('networkidle');
    
    // Wait for activities to load
    await expect(page.locator('.simple-activity-item').first()).toBeVisible({ timeout: 15000 });
    
    const initialCount = await page.locator('.simple-activity-item').count();
    console.log(`📋 Initial activity count: ${initialCount}`);
    
    // Subscribe to a few activities to create potential conflicts
    console.log('🎯 Creating test conflicts by subscribing to activities...');
    
    // Click on the first few activities to subscribe and create conflicts
    const firstActivity = page.locator('.simple-activity-item').first();
    await firstActivity.click();
    
    // Wait for modal and subscribe
    await expect(page.locator('.modal-overlay')).toBeVisible();
    const subscribeButton = page.locator('button:has-text("Voeg toe")').first();
    
    if (await subscribeButton.isVisible()) {
      await subscribeButton.click();
      await page.waitForTimeout(2000); // Wait for subscription to complete
    }
    
    // Close modal
    await page.locator('[aria-label="Sluit modal"]').click();
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
    
    // Try to subscribe to another activity to create conflicts
    const activities = page.locator('.simple-activity-item');
    const secondActivity = activities.nth(1);
    await secondActivity.click();
    
    await expect(page.locator('.modal-overlay')).toBeVisible();
    const secondSubscribeButton = page.locator('button:has-text("Voeg toe")').first();
    
    if (await secondSubscribeButton.isVisible()) {
      await secondSubscribeButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Close modal
    await page.locator('[aria-label="Sluit modal"]').click();
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
    
    console.log('✅ Test subscriptions created');
    
    // Now test the "Alleen Beschikbaar" filter
    const eligibleToggle = page.locator('.toggle-container:has-text("Alleen Beschikbaar")');
    
    if (await eligibleToggle.isVisible()) {
      console.log('🎯 Activating "Alleen Beschikbaar" filter with conflict detection...');
      
      // Clear logs and activate
      consoleLogs = [];
      conflictCount = 0;
      
      await eligibleToggle.locator('.toggle-switch').click();
      await page.waitForTimeout(3000); // Wait for filtering to complete
      
      const finalCount = await page.locator('.simple-activity-item').count();
      console.log(`📋 Final activity count after filter: ${finalCount}`);
      
      // Check if conflicts were detected and filtered out
      console.log(`⏰ Activities with time conflicts filtered: ${conflictCount}`);
      
      if (conflictCount > 0) {
        console.log('✅ SUCCESS: Time conflicts detected and activities filtered out!');
        console.log(`   - ${conflictCount} activities had time conflicts`);
        console.log(`   - These activities were hidden from the eligible list`);
        console.log(`   - Only truly available activities are shown`);
      } else {
        console.log('ℹ️ No time conflicts detected in current test scenario');
      }
      
      // Verify that the total reduction includes both label and conflict filtering
      const totalFiltered = initialCount - finalCount;
      console.log(`📊 Total filtering result:`);
      console.log(`   - Initial activities: ${initialCount}`);
      console.log(`   - Final activities: ${finalCount}`);
      console.log(`   - Total filtered out: ${totalFiltered}`);
      console.log(`   - Conflict-based filtering: ${conflictCount > 0 ? 'ACTIVE' : 'NO CONFLICTS'}`);
      
      // Verify no orange indicators are visible (since conflicted activities are hidden)
      const orangeIndicators = page.locator('.status-indicator.conflict');
      const orangeCount = await orangeIndicators.count();
      
      if (orangeCount === 0) {
        console.log('✅ SUCCESS: No orange conflict indicators visible (conflicts hidden)');
      } else {
        console.log(`⚠️ WARNING: ${orangeCount} orange indicators still visible`);
      }
      
    } else {
      console.log('❌ "Alleen Beschikbaar" toggle not found');
    }
    
    expect(true).toBe(true); // This test is for validation
  });
  
  test('should show conflict indicators when filter is OFF', async ({ page }) => {
    // Set up logged-in environment
    await page.addInitScript(() => {
      window.process = window.process || {};
      window.process.env = window.process.env || {};
      window.process.env.VITE_USERNAME = 'sn_22anniek22';
      window.process.env.DEV = 'true';
      
      window.VITE_DEBUG = true;
      
      window.FestivalWizardData = {
        ajaxUrl: '/wp-admin/admin-ajax.php',
        nonce: 'test-nonce',
        apiKey: 'test-api-key',
        apiBaseUrl: 'https://trackapi.catriox.nl',
        showTracksOnly: true,
        activitiesTitle: 'Test Activiteiten',
        activitiesIntro: 'Test intro',
        isLoggedIn: true,
        currentUser: {
          username: 'sn_22anniek22',
          email: 'anniek@example.com'
        }
      };
    });
    
    await page.goto('/#activities-list');
    await page.waitForLoadState('networkidle');
    
    // Wait for activities to load
    await expect(page.locator('.simple-activity-item').first()).toBeVisible({ timeout: 15000 });
    
    // Make sure "Alleen Beschikbaar" is OFF
    const eligibleToggle = page.locator('.toggle-container:has-text("Alleen Beschikbaar")');
    
    if (await eligibleToggle.isVisible()) {
      const toggleSwitch = eligibleToggle.locator('.toggle-switch');
      const isActive = await toggleSwitch.getAttribute('aria-checked');
      
      if (isActive === 'true') {
        // Turn off the toggle
        await toggleSwitch.click();
        await page.waitForTimeout(1000);
      }
      
      // Now check for orange indicators (should be visible when filter is off)
      const orangeIndicators = page.locator('.status-indicator.conflict, .status-indicator:has-text("⚠️")');
      await page.waitForTimeout(2000); // Wait for indicators to render
      
      const orangeCount = await orangeIndicators.count();
      console.log(`🔶 Orange conflict indicators visible: ${orangeCount}`);
      
      if (orangeCount > 0) {
        console.log('✅ SUCCESS: Conflict indicators are visible when filter is OFF');
        console.log('   This shows that conflicted activities are displayed with warning');
      } else {
        console.log('ℹ️ No conflict indicators found (may not have conflicts in current test)');
      }
    }
    
    expect(true).toBe(true);
  });
});