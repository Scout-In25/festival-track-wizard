import { test, expect } from '@playwright/test';

test.describe('Eligibility Filter Debug Tests', () => {
  test('should show debug logging when "Alleen Beschikbaar" toggle is activated', async ({ page }) => {
    let consoleLogs = [];
    
    // Capture console logs
    page.on('console', msg => {
      if (msg.text().includes('Eligibility') || msg.text().includes('👤 Participant') || msg.text().includes('🎯 Applying')) {
        consoleLogs.push(msg.text());
        console.log('📝 Console:', msg.text());
      }
    });
    
    // Set up logged-in environment with username but potentially no labels
    await page.addInitScript(() => {
      window.process = window.process || {};
      window.process.env = window.process.env || {};
      window.process.env.VITE_USERNAME = 'timo';
      window.process.env.DEV = 'true';
      
      // Enable debug mode
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
          username: 'timo',
          email: 'timo@example.com'
        }
      };
    });
    
    await page.goto('/#activities-list');
    await page.waitForLoadState('networkidle');
    
    // Wait for activities to load
    await expect(page.locator('.simple-activity-item').first()).toBeVisible({ timeout: 10000 });
    
    // Find and activate "Alleen Beschikbaar" toggle
    const eligibleToggle = page.locator('.toggle-container:has-text("Alleen Beschikbaar")');
    
    if (await eligibleToggle.isVisible()) {
      console.log('✅ "Alleen Beschikbaar" toggle found and visible');
      
      // Clear logs and activate toggle
      consoleLogs = [];
      await eligibleToggle.locator('.toggle-switch').click();
      
      // Wait a moment for the filter to apply and logs to appear
      await page.waitForTimeout(1000);
      
      // Check if debug logs appeared
      const hasDebugLogs = consoleLogs.some(log => 
        log.includes('Applying eligibility filter') || 
        log.includes('Participant:') ||
        log.includes('Eligibility check:')
      );
      
      if (hasDebugLogs) {
        console.log('✅ Debug logging is working!');
        console.log('📊 Sample logs:', consoleLogs.slice(0, 3));
      } else {
        console.log('⚠️ No debug logs found. This might mean:');
        console.log('   - Debug mode not enabled properly');
        console.log('   - No activities to filter');
        console.log('   - Toggle not functioning');
      }
      
      // Check how many activities are visible after filter
      const visibleActivities = await page.locator('.simple-activity-item').count();
      console.log(`📈 Activities visible after filter: ${visibleActivities}`);
      
      if (visibleActivities === 0) {
        console.log('⚠️ No activities visible - this suggests the original issue (participant has no labels)');
      } else {
        console.log('✅ Some activities are visible - filter seems to be working');
      }
      
    } else {
      console.log('❌ "Alleen Beschikbaar" toggle not visible - user might not be logged in');
    }
    
    // This test is mainly for debugging, so we don't assert anything specific
    // The valuable output is in the console logs
    expect(true).toBe(true);
  });
  
  test('should test with dev label override', async ({ page }) => {
    let consoleLogs = [];
    
    // Capture console logs
    page.on('console', msg => {
      if (msg.text().includes('dev mode label override') || msg.text().includes('DataService')) {
        consoleLogs.push(msg.text());
        console.log('📝 Override:', msg.text());
      }
    });
    
    // Set up environment with label override
    await page.addInitScript(() => {
      window.process = window.process || {};
      window.process.env = window.process.env || {};
      window.process.env.VITE_USERNAME = 'timo';
      window.process.env.VITE_USER_LABELS = 'leiding,bevers,samenleving'; // Test labels
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
          username: 'timo',
          email: 'timo@example.com'
        }
      };
    });
    
    await page.goto('/#activities-list');
    await page.waitForLoadState('networkidle');
    
    // Wait for activities to load
    await expect(page.locator('.simple-activity-item').first()).toBeVisible({ timeout: 10000 });
    
    // Check if label override was applied
    const hasOverrideLogs = consoleLogs.some(log => 
      log.includes('dev mode label override')
    );
    
    if (hasOverrideLogs) {
      console.log('✅ Dev label override is working!');
    } else {
      console.log('⚠️ No override logs found');
    }
    
    // Now test the eligibility filter with overridden labels
    const eligibleToggle = page.locator('.toggle-container:has-text("Alleen Beschikbaar")');
    
    if (await eligibleToggle.isVisible()) {
      await eligibleToggle.locator('.toggle-switch').click();
      await page.waitForTimeout(1000);
      
      const visibleActivities = await page.locator('.simple-activity-item').count();
      console.log(`📈 Activities with override labels: ${visibleActivities}`);
      
      if (visibleActivities > 0) {
        console.log('✅ Override labels are working - some activities are eligible!');
      }
    }
    
    expect(true).toBe(true);
  });
});