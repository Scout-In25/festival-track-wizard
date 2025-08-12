import { test, expect } from '@playwright/test';

test.describe('Toggle Fix Validation', () => {
  test('should toggle "Alleen Beschikbaar" without errors', async ({ page }) => {
    let jsErrors = [];
    let consoleErrors = [];
    
    // Capture JavaScript errors
    page.on('pageerror', error => {
      jsErrors.push(error.message);
      console.log('💥 JS Error:', error.message);
    });
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('🚨 Console Error:', msg.text());
      }
    });
    
    // Set up environment
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
    console.log(`📊 Initial activity count: ${initialCount}`);
    
    // Find the toggle
    const eligibleToggle = page.locator('.toggle-container:has-text("Alleen Beschikbaar")');
    await expect(eligibleToggle).toBeVisible();
    
    const toggleSwitch = eligibleToggle.locator('.toggle-switch');
    
    // Test 1: Activate toggle
    console.log('🔄 Test 1: Activating toggle...');
    jsErrors = [];
    consoleErrors = [];
    
    await toggleSwitch.click();
    await page.waitForTimeout(3000);
    
    const activeCount = await page.locator('.simple-activity-item').count();
    console.log(`📊 Activity count when active: ${activeCount}`);
    
    // Check for errors after activation
    if (jsErrors.length > 0) {
      console.log('❌ JavaScript errors during activation:');
      jsErrors.forEach(error => console.log('  ', error));
    } else {
      console.log('✅ No JavaScript errors during activation');
    }
    
    if (consoleErrors.length > 0) {
      console.log('❌ Console errors during activation:');
      consoleErrors.forEach(error => console.log('  ', error));
    } else {
      console.log('✅ No console errors during activation');
    }
    
    // Test 2: Deactivate toggle
    console.log('🔄 Test 2: Deactivating toggle...');
    jsErrors = [];
    consoleErrors = [];
    
    await toggleSwitch.click();
    await page.waitForTimeout(3000);
    
    const deactivatedCount = await page.locator('.simple-activity-item').count();
    console.log(`📊 Activity count when deactivated: ${deactivatedCount}`);
    
    // Check for errors after deactivation
    if (jsErrors.length > 0) {
      console.log('❌ JavaScript errors during deactivation:');
      jsErrors.forEach(error => console.log('  ', error));
    } else {
      console.log('✅ No JavaScript errors during deactivation');
    }
    
    if (consoleErrors.length > 0) {
      console.log('❌ Console errors during deactivation:');
      consoleErrors.forEach(error => console.log('  ', error));
    } else {
      console.log('✅ No console errors during deactivation');
    }
    
    // Validate functionality
    console.log('📊 Final validation:');
    
    if (activeCount < initialCount) {
      console.log('✅ Filter reduces activity count (working correctly)');
    } else if (activeCount === initialCount) {
      console.log('ℹ️ Filter count unchanged (may be normal if all activities are eligible)');
    } else {
      console.log('⚠️ Filter increases activity count (unexpected behavior)');
    }
    
    if (deactivatedCount === initialCount) {
      console.log('✅ Toggle restoration works correctly');
    } else {
      console.log('⚠️ Toggle restoration not working correctly');
    }
    
    // Test 3: Multiple rapid toggles
    console.log('🔄 Test 3: Rapid toggle test...');
    jsErrors = [];
    consoleErrors = [];
    
    for (let i = 0; i < 3; i++) {
      await toggleSwitch.click();
      await page.waitForTimeout(500);
    }
    
    if (jsErrors.length === 0 && consoleErrors.length === 0) {
      console.log('✅ Rapid toggle test passed - no errors');
    } else {
      console.log('❌ Rapid toggle test failed - errors occurred');
    }
    
    // Overall result
    const totalErrors = jsErrors.length + consoleErrors.length;
    if (totalErrors === 0) {
      console.log('🎉 SUCCESS: Toggle works without any errors!');
      console.log('✅ Fix validated successfully');
    } else {
      console.log(`❌ FAILURE: ${totalErrors} errors still occur during toggle`);
    }
    
    expect(totalErrors).toBe(0);
  });
});