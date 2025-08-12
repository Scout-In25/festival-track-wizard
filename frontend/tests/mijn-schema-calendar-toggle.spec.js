import { test, expect } from '@playwright/test';

test.describe('Mijn Schema Calendar Toggle Tests', () => {
  test('should enable calendar view when "Mijn Schema" is activated', async ({ page }) => {
    let consoleLogs = [];
    
    // Capture console logs for debugging
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('Mijn Schema') || text.includes('Kalender')) {
        console.log('📱 Toggle event:', text);
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
    
    console.log('✅ Page loaded successfully');
    
    // Find the toggles
    const mijnSchemaToggle = page.locator('.toggle-container:has-text("Mijn Schema")');
    const kalenderToggle = page.locator('.toggle-container:has-text("Kalender Weergave")');
    
    await expect(mijnSchemaToggle).toBeVisible();
    await expect(kalenderToggle).toBeVisible();
    
    // Check initial states
    const mijnSchemaSwitch = mijnSchemaToggle.locator('.toggle-switch');
    const kalenderSwitch = kalenderToggle.locator('.toggle-switch');
    
    const initialMijnSchema = await mijnSchemaSwitch.getAttribute('aria-checked');
    const initialKalender = await kalenderSwitch.getAttribute('aria-checked');
    
    console.log(`📊 Initial states - Mijn Schema: ${initialMijnSchema}, Kalender: ${initialKalender}`);
    
    // Test: Activate "Mijn Schema" toggle
    console.log('🔄 Activating "Mijn Schema" toggle...');
    await mijnSchemaSwitch.click();
    await page.waitForTimeout(1000); // Wait for state updates
    
    // Check states after activation
    const afterMijnSchema = await mijnSchemaSwitch.getAttribute('aria-checked');
    const afterKalender = await kalenderSwitch.getAttribute('aria-checked');
    
    console.log(`📊 After activation - Mijn Schema: ${afterMijnSchema}, Kalender: ${afterKalender}`);
    
    // Validate results
    if (afterMijnSchema === 'true') {
      console.log('✅ Mijn Schema toggle activated successfully');
    } else {
      console.log('❌ Mijn Schema toggle failed to activate');
    }
    
    if (afterKalender === 'true') {
      console.log('✅ SUCCESS: Kalender Weergave automatically enabled!');
    } else {
      console.log('❌ ISSUE: Kalender Weergave was not automatically enabled');
    }
    
    // Test deactivation behavior  
    console.log('🔄 Deactivating "Mijn Schema" toggle...');
    await mijnSchemaSwitch.click();
    await page.waitForTimeout(1000);
    
    const finalMijnSchema = await mijnSchemaSwitch.getAttribute('aria-checked');
    const finalKalender = await kalenderSwitch.getAttribute('aria-checked');
    
    console.log(`📊 Final states - Mijn Schema: ${finalMijnSchema}, Kalender: ${finalKalender}`);
    
    // Summary
    console.log('\\n📋 TEST SUMMARY:');
    console.log(`   - Initial: Mijn Schema=${initialMijnSchema}, Kalender=${initialKalender}`);
    console.log(`   - After activation: Mijn Schema=${afterMijnSchema}, Kalender=${afterKalender}`);
    console.log(`   - After deactivation: Mijn Schema=${finalMijnSchema}, Kalender=${finalKalender}`);
    
    if (afterMijnSchema === 'true' && afterKalender === 'true') {
      console.log('🎉 SUCCESS: Mijn Schema correctly enables Kalender Weergave!');
    } else {
      console.log('❌ FAILURE: Behavior needs adjustment');
    }
    
    // Expect the calendar view to be enabled when Mijn Schema is active
    expect(afterMijnSchema).toBe('true');
    expect(afterKalender).toBe('true');
  });
  
  test('should allow manual calendar toggle when Mijn Schema is off', async ({ page }) => {
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
    
    // Find toggles
    const mijnSchemaToggle = page.locator('.toggle-container:has-text("Mijn Schema")');
    const kalenderToggle = page.locator('.toggle-container:has-text("Kalender Weergave")');
    
    const mijnSchemaSwitch = mijnSchemaToggle.locator('.toggle-switch');
    const kalenderSwitch = kalenderToggle.locator('.toggle-switch');
    
    // Ensure Mijn Schema is OFF
    const mijnSchemaState = await mijnSchemaSwitch.getAttribute('aria-checked');
    if (mijnSchemaState === 'true') {
      await mijnSchemaSwitch.click();
      await page.waitForTimeout(500);
    }
    
    // Test manual calendar toggle when Mijn Schema is off
    console.log('🔄 Testing manual calendar toggle...');
    
    const initialKalender = await kalenderSwitch.getAttribute('aria-checked');
    console.log(`📊 Initial Kalender state: ${initialKalender}`);
    
    await kalenderSwitch.click();
    await page.waitForTimeout(500);
    
    const afterToggleKalender = await kalenderSwitch.getAttribute('aria-checked');
    console.log(`📊 After toggle Kalender state: ${afterToggleKalender}`);
    
    if (afterToggleKalender !== initialKalender) {
      console.log('✅ Manual calendar toggle works independently');
    } else {
      console.log('❌ Manual calendar toggle failed');
    }
    
    expect(afterToggleKalender).not.toBe(initialKalender);
  });
});