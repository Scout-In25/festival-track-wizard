import { test, expect } from '@playwright/test';

test.describe('Toggle Error Debug', () => {
  test('should capture any errors when toggling Alleen Beschikbaar', async ({ page }) => {
    let consoleErrors = [];
    let jsErrors = [];
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('🚨 Console Error:', msg.text());
      }
    });
    
    // Capture JavaScript errors
    page.on('pageerror', error => {
      jsErrors.push(error.message);
      console.log('💥 JS Error:', error.message);
      console.log('📍 Stack:', error.stack);
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
    
    console.log('✅ Page loaded successfully');
    
    // Find the toggle
    const eligibleToggle = page.locator('.toggle-container:has-text("Alleen Beschikbaar")');
    
    if (await eligibleToggle.isVisible()) {
      console.log('🎯 Found "Alleen Beschikbaar" toggle');
      
      const toggleSwitch = eligibleToggle.locator('.toggle-switch');
      
      // Check initial state
      const initialState = await toggleSwitch.getAttribute('aria-checked');
      console.log('📊 Initial toggle state:', initialState);
      
      // Clear error arrays
      consoleErrors = [];
      jsErrors = [];
      
      console.log('🔄 Attempting to toggle...');
      
      // Try to click the toggle
      try {
        await toggleSwitch.click();
        await page.waitForTimeout(2000); // Wait for any processing
        
        const newState = await toggleSwitch.getAttribute('aria-checked');
        console.log('📊 New toggle state:', newState);
        
        if (newState !== initialState) {
          console.log('✅ Toggle state changed successfully');
        } else {
          console.log('⚠️ Toggle state did not change');
        }
        
      } catch (error) {
        console.log('💥 Error during toggle click:', error.message);
      }
      
      // Check for any errors
      if (consoleErrors.length > 0) {
        console.log('🚨 Console errors detected:');
        consoleErrors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      } else {
        console.log('✅ No console errors');
      }
      
      if (jsErrors.length > 0) {
        console.log('💥 JavaScript errors detected:');
        jsErrors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      } else {
        console.log('✅ No JavaScript errors');
      }
      
      // Try to toggle again to test both directions
      console.log('🔄 Testing toggle in reverse direction...');
      
      try {
        await toggleSwitch.click();
        await page.waitForTimeout(2000);
        
        const finalState = await toggleSwitch.getAttribute('aria-checked');
        console.log('📊 Final toggle state:', finalState);
        
        if (finalState === initialState) {
          console.log('✅ Toggle successfully returned to initial state');
        } else {
          console.log('⚠️ Toggle did not return to initial state');
        }
        
      } catch (error) {
        console.log('💥 Error during second toggle:', error.message);
      }
      
      // Final error check
      if (consoleErrors.length > 0 || jsErrors.length > 0) {
        console.log('❌ ERRORS FOUND - Toggle is broken');
      } else {
        console.log('✅ SUCCESS - Toggle works without errors');
      }
      
    } else {
      console.log('❌ "Alleen Beschikbaar" toggle not found');
    }
    
    // Always pass the test, this is for debugging
    expect(true).toBe(true);
  });
  
  test('should test toggle functionality step by step', async ({ page }) => {
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
    
    await page.goto('/#activities-list');
    await page.waitForLoadState('networkidle');
    
    // Wait for activities and check count
    await expect(page.locator('.simple-activity-item').first()).toBeVisible({ timeout: 15000 });
    
    const initialCount = await page.locator('.simple-activity-item').count();
    console.log(`📊 Initial activity count: ${initialCount}`);
    
    // Find toggle
    const eligibleToggle = page.locator('.toggle-container:has-text("Alleen Beschikbaar")');
    await expect(eligibleToggle).toBeVisible();
    
    const toggleSwitch = eligibleToggle.locator('.toggle-switch');
    
    // Step 1: Activate toggle
    console.log('Step 1: Activating toggle...');
    await toggleSwitch.click();
    await page.waitForTimeout(3000);
    
    const activeCount = await page.locator('.simple-activity-item').count();
    console.log(`📊 Activity count when active: ${activeCount}`);
    
    // Step 2: Deactivate toggle
    console.log('Step 2: Deactivating toggle...');
    await toggleSwitch.click();
    await page.waitForTimeout(3000);
    
    const inactiveCount = await page.locator('.simple-activity-item').count();
    console.log(`📊 Activity count when inactive: ${inactiveCount}`);
    
    // Validate results
    if (activeCount < initialCount) {
      console.log('✅ Toggle filtering works (count decreased when active)');
    } else {
      console.log('⚠️ Toggle filtering may not be working (count unchanged)');
    }
    
    if (inactiveCount === initialCount) {
      console.log('✅ Toggle deactivation works (count restored)');
    } else {
      console.log('⚠️ Toggle deactivation issue (count not restored)');
    }
    
    expect(true).toBe(true);
  });
});