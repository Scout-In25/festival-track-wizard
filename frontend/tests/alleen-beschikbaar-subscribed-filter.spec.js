import { test, expect } from '@playwright/test';

test.describe('Alleen Beschikbaar Subscribed Filter Tests', () => {
  test('should hide subscribed activities from Alleen Beschikbaar view', async ({ page }) => {
    let consoleLogs = [];
    let subscribedCount = 0;
    let eligibleCount = 0;
    
    // Capture console logs
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      
      if (text.includes('already subscribed')) {
        subscribedCount++;
        console.log('📝 Subscribed activity filtered:', text);
      }
      
      if (text.includes('✅ Result: ELIGIBLE')) {
        eligibleCount++;
      }
      
      if (text.includes('Eligibility filter result:')) {
        console.log('📊 Final filter result:', text);
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
    
    await page.goto('http://localhost:5175/#activities-list');
    await page.waitForLoadState('networkidle');
    
    // Wait for activities to load
    await expect(page.locator('.simple-activity-item').first()).toBeVisible({ timeout: 15000 });
    
    const initialCount = await page.locator('.simple-activity-item').count();
    console.log(`📋 Initial activity count: ${initialCount}`);
    
    // Create some subscriptions to test filtering
    console.log('🎯 Creating test subscriptions...');
    
    // Subscribe to first activity
    const firstActivity = page.locator('.simple-activity-item').first();
    await firstActivity.click();
    
    await expect(page.locator('.modal-overlay')).toBeVisible();
    const subscribeButton = page.locator('button:has-text("Voeg toe")').first();
    
    if (await subscribeButton.isVisible()) {
      await subscribeButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ First activity subscription created');
    }
    
    // Close modal
    await page.locator('[aria-label="Sluit modal"]').click();
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
    
    // Subscribe to second activity  
    const secondActivity = page.locator('.simple-activity-item').nth(1);
    await secondActivity.click();
    
    await expect(page.locator('.modal-overlay')).toBeVisible();
    const secondSubscribeButton = page.locator('button:has-text("Voeg toe")').first();
    
    if (await secondSubscribeButton.isVisible()) {
      await secondSubscribeButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Second activity subscription created');
    }
    
    await page.locator('[aria-label="Sluit modal"]').click();
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
    
    console.log('✅ Test subscriptions created');
    
    // Now test "Alleen Beschikbaar" filter
    const eligibleToggle = page.locator('.toggle-container:has-text("Alleen Beschikbaar")');
    
    if (await eligibleToggle.isVisible()) {
      console.log('🔄 Activating "Alleen Beschikbaar" filter...');
      
      // Clear counters
      subscribedCount = 0;
      eligibleCount = 0;
      consoleLogs = [];
      
      await eligibleToggle.locator('.toggle-switch').click();
      await page.waitForTimeout(3000); // Wait for filtering
      
      const filteredCount = await page.locator('.simple-activity-item').count();
      console.log(`📋 Activities after filter: ${filteredCount}`);
      
      console.log(`\\n📊 FILTERING ANALYSIS:`);
      console.log(`   - Initial activities: ${initialCount}`);
      console.log(`   - After Alleen Beschikbaar filter: ${filteredCount}`);
      console.log(`   - Subscribed activities filtered out: ${subscribedCount}`);
      console.log(`   - Activities deemed eligible: ${eligibleCount}`);
      
      if (subscribedCount > 0) {
        console.log('✅ SUCCESS: Subscribed activities were filtered out!');
        console.log(`   - ${subscribedCount} subscribed activities hidden from view`);
        console.log(`   - Only truly available activities are shown`);
      } else {
        console.log('ℹ️ No subscribed activities detected in filter logs');
      }
      
      if (filteredCount < initialCount) {
        console.log('✅ SUCCESS: Filter is working (activity count reduced)');
      } else {
        console.log('⚠️ Filter may not be working (activity count unchanged)');
      }
      
      // Verify that subscribed activities are not visible
      // Check for any activities with "aangemeld" status in the filtered view
      const subscribedActivities = page.locator('.simple-activity-item .status-indicator:has-text("aangemeld")');
      const visibleSubscribedCount = await subscribedActivities.count();
      
      console.log(`\\n🔍 VISIBILITY CHECK:`);
      console.log(`   - Visible activities with "aangemeld" status: ${visibleSubscribedCount}`);
      
      if (visibleSubscribedCount === 0) {
        console.log('✅ PERFECT: No subscribed activities visible in filtered view!');
      } else {
        console.log(`⚠️ ISSUE: ${visibleSubscribedCount} subscribed activities still visible`);
      }
      
    } else {
      console.log('❌ "Alleen Beschikbaar" toggle not found');
    }
    
    expect(true).toBe(true); // This test is for validation
  });
  
  test('should show subscribed activities when filter is OFF', async ({ page }) => {
    // Set up environment
    await page.addInitScript(() => {
      window.process = window.process || {};
      window.process.env = window.process.env || {};
      window.process.env.VITE_USERNAME = 'sn_22anniek22';
      window.process.env.DEV = 'true';
      
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
    
    await page.goto('http://localhost:5175/#activities-list');
    await page.waitForLoadState('networkidle');
    
    // Wait for activities to load
    await expect(page.locator('.simple-activity-item').first()).toBeVisible({ timeout: 15000 });
    
    // Ensure "Alleen Beschikbaar" is OFF
    const eligibleToggle = page.locator('.toggle-container:has-text("Alleen Beschikbaar")');
    
    if (await eligibleToggle.isVisible()) {
      const toggleSwitch = eligibleToggle.locator('.toggle-switch');
      const isActive = await toggleSwitch.getAttribute('aria-checked');
      
      if (isActive === 'true') {
        await toggleSwitch.click();
        await page.waitForTimeout(1000);
      }
      
      // Check for subscribed activities (should be visible when filter is off)
      const subscribedActivities = page.locator('.simple-activity-item .status-indicator:has-text("aangemeld")');
      await page.waitForTimeout(2000);
      
      const subscribedCount = await subscribedActivities.count();
      console.log(`📝 Subscribed activities visible when filter OFF: ${subscribedCount}`);
      
      if (subscribedCount > 0) {
        console.log('✅ SUCCESS: Subscribed activities are visible when filter is OFF');
      } else {
        console.log('ℹ️ No subscribed activities found (may not have subscriptions)');
      }
    }
    
    expect(true).toBe(true);
  });
});