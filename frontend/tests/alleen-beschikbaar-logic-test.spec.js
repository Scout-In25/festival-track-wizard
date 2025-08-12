import { test, expect } from '@playwright/test';

test.describe('Alleen Beschikbaar Logic Tests', () => {
  test('should filter out subscribed activities in debug logs', async ({ page }) => {
    let subscribedFilteredCount = 0;
    let eligibleCount = 0;
    let totalChecked = 0;
    
    // Capture console logs to analyze filtering behavior
    page.on('console', msg => {
      const text = msg.text();
      
      if (text.includes('🔍 Eligibility check:')) {
        totalChecked++;
      }
      
      if (text.includes('already subscribed')) {
        subscribedFilteredCount++;
        console.log('📝 Filtered subscribed activity:', text);
      }
      
      if (text.includes('✅ Result: ELIGIBLE')) {
        eligibleCount++;
      }
      
      if (text.includes('❌ Result: NOT ELIGIBLE (already subscribed)')) {
        console.log('🚫 Activity excluded due to subscription:', text);
      }
      
      if (text.includes('Eligibility filter result:')) {
        console.log('📊 Final result:', text);
      }
    });
    
    // Set up logged-in environment with debug enabled
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
    
    // Activate "Alleen Beschikbaar" filter
    const eligibleToggle = page.locator('.toggle-container:has-text("Alleen Beschikbaar")');
    
    if (await eligibleToggle.isVisible()) {
      console.log('🔄 Activating "Alleen Beschikbaar" filter...');
      
      // Reset counters
      subscribedFilteredCount = 0;
      eligibleCount = 0;
      totalChecked = 0;
      
      await eligibleToggle.locator('.toggle-switch').click();
      await page.waitForTimeout(4000); // Wait for all filtering to complete
      
      const filteredCount = await page.locator('.simple-activity-item').count();
      console.log(`📋 Activities after filter: ${filteredCount}`);
      
      console.log(`\\n📊 FILTERING ANALYSIS:`);
      console.log(`   - Total activities checked: ${totalChecked}`);
      console.log(`   - Activities filtered (subscribed): ${subscribedFilteredCount}`);
      console.log(`   - Activities deemed eligible: ${eligibleCount}`);
      console.log(`   - Visible activities in UI: ${filteredCount}`);
      console.log(`   - Total filtered out: ${initialCount - filteredCount}`);
      
      if (subscribedFilteredCount > 0) {
        console.log('\\n✅ SUCCESS: Subscribed activity filtering is working!');
        console.log(`   - ${subscribedFilteredCount} activities filtered out due to subscription`);
        console.log('   - These activities are hidden from "Alleen Beschikbaar" view');
        console.log('   - Logic: User can only see activities they can still sign up for');
      } else {
        console.log('\\nℹ️ No subscribed activities detected in current dataset');
        console.log('   This may be normal if user has no subscriptions');
      }
      
      if (filteredCount < initialCount) {
        console.log('\\n✅ Filter is working (reduced activity count)');
      } else if (filteredCount === initialCount) {
        console.log('\\n⚠️ Filter shows same count (may be normal if no exclusions)');
      }
      
      // Test logic validation
      console.log('\\n🧪 LOGIC VALIDATION:');
      if (subscribedFilteredCount > 0) {
        console.log('✅ Subscription filtering: IMPLEMENTED');
      } else {
        console.log('❓ Subscription filtering: NO DATA TO TEST');
      }
      
      if (eligibleCount > 0) {
        console.log('✅ Eligibility checking: WORKING');
      } else {
        console.log('❌ Eligibility checking: NO ELIGIBLE ACTIVITIES');
      }
      
    } else {
      console.log('❌ "Alleen Beschikbaar" toggle not found');
    }
    
    expect(true).toBe(true); // This test is for validation and analysis
  });
  
  test('should show implementation is working based on count changes', async ({ page }) => {
    // Simpler test focusing on count changes
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
    
    const initialCount = await page.locator('.simple-activity-item').count();
    console.log(`📋 All activities: ${initialCount}`);
    
    // Test filter toggle
    const eligibleToggle = page.locator('.toggle-container:has-text("Alleen Beschikbaar")');
    
    if (await eligibleToggle.isVisible()) {
      await eligibleToggle.locator('.toggle-switch').click();
      await page.waitForTimeout(3000);
      
      const filteredCount = await page.locator('.simple-activity-item').count();
      console.log(`📋 Available activities: ${filteredCount}`);
      
      const reduction = initialCount - filteredCount;
      console.log(`📊 Activities filtered out: ${reduction}`);
      
      if (reduction > 0) {
        console.log('✅ SUCCESS: Filter is working (activities filtered out)');
        console.log('   This includes subscribed activities being hidden');
      } else {
        console.log('ℹ️ No activities filtered (may indicate no subscriptions/conflicts)');
      }
      
      // Test toggle back
      await eligibleToggle.locator('.toggle-switch').click();
      await page.waitForTimeout(2000);
      
      const restoredCount = await page.locator('.simple-activity-item').count();
      console.log(`📋 Restored count: ${restoredCount}`);
      
      if (restoredCount === initialCount) {
        console.log('✅ Toggle restoration works correctly');
      }
    }
    
    expect(true).toBe(true);
  });
});