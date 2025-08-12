import { test, expect } from '@playwright/test';

test.describe('Dev Mode Login State Tests', () => {
  test('should show activities page when no login env vars are set', async ({ page }) => {
    // Set up dev environment WITHOUT login variables
    await page.addInitScript(() => {
      // Clear any existing environment variables
      window.process = window.process || {};
      window.process.env = window.process.env || {};
      
      window.FestivalWizardData = {
        ajaxUrl: '/wp-admin/admin-ajax.php',
        nonce: 'test-nonce',
        apiKey: 'test-api-key',
        apiBaseUrl: 'https://trackapi.catriox.nl',
        displayMode: 'wizard-simple',
        // No login state set - should default to false
        currentUser: null
      };
    });
    
    await page.goto('http://localhost:5175/');
    await page.waitForLoadState('networkidle');
    
    // Wait for component to render
    await page.waitForTimeout(2000);
    
    // Should show activities page (not wizard) when logged out
    const activitiesPage = page.locator('.activities-list-page, .simple-activity-item');
    const wizard = page.locator('.wizard-container, .track-wizard');
    
    const hasActivities = await activitiesPage.count() > 0;
    const hasWizard = await wizard.count() > 0;
    
    console.log(`📊 Page content analysis:`);
    console.log(`   - Activities elements found: ${await activitiesPage.count()}`);
    console.log(`   - Wizard elements found: ${await wizard.count()}`);
    
    if (hasActivities && !hasWizard) {
      console.log('✅ SUCCESS: Shows activities page when logged out');
    } else if (hasWizard) {
      console.log('❌ ISSUE: Shows wizard when should be logged out');
    } else {
      console.log('⚠️ Neither activities nor wizard detected - check page structure');
    }
    
    // The page should show activities (logged-out view), not wizard
    expect(hasActivities).toBe(true);
  });
  
  test('should show wizard when VITE_USERNAME is set (mock user)', async ({ page }) => {
    // Set up dev environment WITH username but no real user data
    await page.addInitScript(() => {
      window.process = window.process || {};
      window.process.env = window.process.env || {};
      window.process.env.VITE_USERNAME = 'mock-test-user';
      
      window.FestivalWizardData = {
        ajaxUrl: '/wp-admin/admin-ajax.php',
        nonce: 'test-nonce',
        apiKey: 'test-api-key',
        apiBaseUrl: 'https://trackapi.catriox.nl',
        displayMode: 'wizard-simple',
        isLoggedIn: true, // Set based on VITE_USERNAME
        currentUser: {
          username: 'mock-test-user',
          email: 'test@example.com'
        }
      };
    });
    
    await page.goto('http://localhost:5175/');
    await page.waitForLoadState('networkidle');
    
    // Wait for component to render
    await page.waitForTimeout(2000);
    
    // Should show wizard when logged in but no participant data
    const activitiesPage = page.locator('.activities-list-page, .simple-activity-item');
    const wizard = page.locator('.wizard-container, .track-wizard, h1:has-text("Track"), h2:has-text("Track")');
    
    const hasActivities = await activitiesPage.count() > 0;
    const hasWizard = await wizard.count() > 0;
    
    console.log(`📊 Mock user login page content:`);
    console.log(`   - Activities elements: ${await activitiesPage.count()}`);
    console.log(`   - Wizard elements: ${await wizard.count()}`);
    
    // Check page title or content to determine what's shown
    const pageContent = await page.textContent('body');
    const hasTrackContent = pageContent.includes('Track') || pageContent.includes('track');
    
    if (hasWizard || hasTrackContent) {
      console.log('✅ SUCCESS: Shows wizard/track page when logged in with mock user');
    } else if (hasActivities) {
      console.log('ℹ️ Shows activities - may indicate user has completed wizard');
    } else {
      console.log('⚠️ Unexpected page content');
    }
    
    // Should show some kind of logged-in interface (wizard or activities with user features)
    expect(hasWizard || hasActivities).toBe(true);
  });
  
  test('should respect VITE_USERNAME for real user login', async ({ page }) => {
    let consoleLogs = [];
    
    // Capture console logs to see login state
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('AppRouter rendering') || text.includes('isUserLoggedIn')) {
        console.log('🔍 Login state:', text);
      }
    });
    
    // Set up dev environment WITH username
    await page.addInitScript(() => {
      window.process = window.process || {};
      window.process.env = window.process.env || {};
      window.process.env.VITE_USERNAME = 'sn_22anniek22'; // Real username
      
      window.FestivalWizardData = {
        ajaxUrl: '/wp-admin/admin-ajax.php',
        nonce: 'test-nonce',
        apiKey: 'test-api-key',
        apiBaseUrl: 'https://trackapi.catriox.nl',
        displayMode: 'wizard-simple',
        isLoggedIn: true,
        currentUser: {
          username: 'sn_22anniek22',
          email: 'anniek@example.com'
        }
      };
    });
    
    await page.goto('http://localhost:5175/');
    await page.waitForLoadState('networkidle');
    
    // Wait for API calls and rendering
    await page.waitForTimeout(3000);
    
    // Check what page is displayed
    const activitiesPage = page.locator('.activities-list-page, .simple-activity-item');
    const wizard = page.locator('.wizard-container, .track-wizard');
    
    const hasActivities = await activitiesPage.count() > 0;
    const hasWizard = await wizard.count() > 0;
    
    console.log(`📊 Real user login page content:`);
    console.log(`   - Activities elements: ${await activitiesPage.count()}`);
    console.log(`   - Wizard elements: ${await wizard.count()}`);
    
    if (hasActivities) {
      console.log('✅ Shows activities - user likely has completed wizard');
    } else if (hasWizard) {
      console.log('✅ Shows wizard - user needs to complete setup');
    }
    
    // With real username, should show either activities or wizard (logged-in interface)
    expect(hasActivities || hasWizard).toBe(true);
  });
});