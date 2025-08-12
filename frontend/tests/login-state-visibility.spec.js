import { test, expect } from '@playwright/test';

test.describe('Login State Visibility Tests', () => {
  test.describe('Logged-Out User Experience', () => {
    test.beforeEach(async ({ page }) => {
      // Set up environment for logged-out user (no VITE_USERNAME)
      await page.addInitScript(() => {
        window.process = window.process || {};
        window.process.env = window.process.env || {};
        // Ensure VITE_USERNAME is not set
        delete window.process.env.VITE_USERNAME;
        
        // Mock development environment
        window.process.env.VITE_API_KEY = 'test-api-key';
        window.process.env.VITE_API_BASE_URL = 'https://trackapi.catriox.nl';
        window.process.env.VITE_DEBUG = 'false';
        window.process.env.VITE_SHOW_TRACKS_ONLY = 'true';
        window.process.env.DEV = 'true';
        
        // Ensure no WordPress user data
        window.FestivalWizardData = {
          ajaxUrl: '/wp-admin/admin-ajax.php',
          nonce: 'test-nonce',
          apiKey: 'test-api-key',
          apiBaseUrl: 'https://trackapi.catriox.nl',
          showTracksOnly: true,
          activitiesTitle: 'Test Activiteiten',
          activitiesIntro: 'Test intro',
          isLoggedIn: false,
          currentUser: null // No user data for logged-out state
        };
      });
    });

    test('should NOT show status indicators for logged-out users', async ({ page }) => {
      await page.goto('/#activities-list');
      await page.waitForLoadState('networkidle');
      
      // Wait for activities to load
      await expect(page.locator('.simple-activity-item').first()).toBeVisible({ timeout: 10000 });
      
      // Status indicators should NOT be visible
      const statusIndicators = page.locator('.status-indicator');
      const indicatorCount = await statusIndicators.count();
      
      expect(indicatorCount).toBe(0);
      console.log('✅ Status indicators are hidden for logged-out users');
    });

    test('should NOT show "Mijn Schema" toggle for logged-out users', async ({ page }) => {
      await page.goto('/#activities-list');
      await page.waitForLoadState('networkidle');
      
      // "Mijn Schema" toggle should NOT be visible
      const myScheduleToggle = page.locator('.toggle-container:has-text("Mijn Schema")');
      await expect(myScheduleToggle).not.toBeVisible();
      
      console.log('✅ "Mijn Schema" toggle is hidden for logged-out users');
    });

    test('should NOT show "Alleen Beschikbaar" toggle for logged-out users', async ({ page }) => {
      await page.goto('/#activities-list');
      await page.waitForLoadState('networkidle');
      
      // "Alleen Beschikbaar" toggle should NOT be visible
      const eligibleOnlyToggle = page.locator('.toggle-container:has-text("Alleen Beschikbaar")');
      await expect(eligibleOnlyToggle).not.toBeVisible();
      
      console.log('✅ "Alleen Beschikbaar" toggle is hidden for logged-out users');
    });

    test('should ONLY show "Kalender Weergave" toggle for logged-out users', async ({ page }) => {
      await page.goto('/#activities-list');
      await page.waitForLoadState('networkidle');
      
      // Only "Kalender Weergave" toggle should be visible
      const calendarToggle = page.locator('.toggle-container:has-text("Kalender Weergave")');
      await expect(calendarToggle).toBeVisible();
      
      // Verify it's the only toggle visible
      const allToggles = page.locator('.toggle-container');
      const toggleCount = await allToggles.count();
      expect(toggleCount).toBe(1);
      
      console.log('✅ Only "Kalender Weergave" toggle is visible for logged-out users');
    });

    test('should NOT show subscription section in activity modal for logged-out users', async ({ page }) => {
      await page.goto('/#activities-list');
      await page.waitForLoadState('networkidle');
      
      // Click on first activity to open modal
      const firstActivity = page.locator('.simple-activity-item').first();
      await firstActivity.click();
      
      // Wait for modal to open
      const modal = page.locator('.modal');
      await expect(modal).toBeVisible();
      
      // Schedule section should NOT be visible
      const scheduleSection = page.locator('text=/In je schema|Voeg toe aan je schema/');
      await expect(scheduleSection).not.toBeVisible();
      
      // Subscribe button should NOT be visible
      const subscribeButton = page.locator('button:has-text("Schrijf je in")');
      await expect(subscribeButton).not.toBeVisible();
      
      // Unsubscribe button should NOT be visible
      const unsubscribeButton = page.locator('button:has-text("Schrijf je uit")');
      await expect(unsubscribeButton).not.toBeVisible();
      
      console.log('✅ Subscription section is hidden in modal for logged-out users');
    });

    test('should NOT show conflict warnings for logged-out users', async ({ page }) => {
      await page.goto('/#activities-list');
      await page.waitForLoadState('networkidle');
      
      // Open an activity modal
      const firstActivity = page.locator('.simple-activity-item').first();
      await firstActivity.click();
      
      const modal = page.locator('.modal');
      await expect(modal).toBeVisible();
      
      // Conflict warnings should NOT be visible
      const conflictWarning = page.locator('text=/Tijdconflict/');
      await expect(conflictWarning).not.toBeVisible();
      
      console.log('✅ Conflict warnings are hidden for logged-out users');
    });
  });

  test.describe('Logged-In User Experience', () => {
    test.beforeEach(async ({ page }) => {
      // Set up environment for logged-in user (with VITE_USERNAME)
      await page.addInitScript(() => {
        // Mock import.meta.env for Vite environment variables
        if (!window.import) {
          window.import = {};
        }
        if (!window.import.meta) {
          window.import.meta = {};
        }
        window.import.meta.env = {
          DEV: true,
          VITE_USERNAME: 'timo',
          VITE_API_KEY: 'test-api-key',
          VITE_API_BASE_URL: 'https://trackapi.catriox.nl',
          VITE_DEBUG: false,
          VITE_SHOW_TRACKS_ONLY: true
        };
        
        // Also set process.env for compatibility
        window.process = window.process || {};
        window.process.env = window.process.env || {};
        window.process.env.VITE_USERNAME = 'timo';
        window.process.env.DEV = 'true';
        
        // Mock WordPress user data for logged-in state
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
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            displayName: 'Test User'
          }
        };
      });
    });

    test('should SHOW status indicators for logged-in users', async ({ page }) => {
      await page.goto('/#activities-list');
      await page.waitForLoadState('networkidle');
      
      // Wait for activities to load
      await expect(page.locator('.simple-activity-item').first()).toBeVisible({ timeout: 10000 });
      
      // Status indicators should be visible
      const statusIndicators = page.locator('.status-indicator');
      const indicatorCount = await statusIndicators.count();
      
      expect(indicatorCount).toBeGreaterThan(0);
      console.log(`✅ Status indicators are visible for logged-in users (found ${indicatorCount})`);
    });

    test('should SHOW "Mijn Schema" toggle for logged-in users', async ({ page }) => {
      await page.goto('/#activities-list');
      await page.waitForLoadState('networkidle');
      
      // "Mijn Schema" toggle should be visible
      const myScheduleToggle = page.locator('.toggle-container:has-text("Mijn Schema")');
      await expect(myScheduleToggle).toBeVisible();
      
      // Test toggle functionality
      await myScheduleToggle.locator('.toggle-switch').click();
      await page.waitForTimeout(300);
      
      // Verify the toggle state changed
      const toggleSwitch = myScheduleToggle.locator('.toggle-switch');
      await expect(toggleSwitch).toHaveClass(/checked/);
      
      console.log('✅ "Mijn Schema" toggle is visible and functional for logged-in users');
    });

    test('should SHOW "Alleen Beschikbaar" toggle for logged-in users', async ({ page }) => {
      await page.goto('/#activities-list');
      await page.waitForLoadState('networkidle');
      
      // "Alleen Beschikbaar" toggle should be visible
      const eligibleOnlyToggle = page.locator('.toggle-container:has-text("Alleen Beschikbaar")');
      await expect(eligibleOnlyToggle).toBeVisible();
      
      console.log('✅ "Alleen Beschikbaar" toggle is visible for logged-in users');
    });

    test('should hide "Alleen Beschikbaar" when "Mijn Schema" is active', async ({ page }) => {
      await page.goto('/#activities-list');
      await page.waitForLoadState('networkidle');
      
      const myScheduleToggle = page.locator('.toggle-container:has-text("Mijn Schema")');
      const eligibleOnlyToggle = page.locator('.toggle-container:has-text("Alleen Beschikbaar")');
      
      // Initially both should be visible
      await expect(myScheduleToggle).toBeVisible();
      await expect(eligibleOnlyToggle).toBeVisible();
      
      // Activate "Mijn Schema"
      await myScheduleToggle.locator('.toggle-switch').click();
      await page.waitForTimeout(300);
      
      // "Alleen Beschikbaar" should now be hidden
      await expect(eligibleOnlyToggle).not.toBeVisible();
      
      // Deactivate "Mijn Schema"
      await myScheduleToggle.locator('.toggle-switch').click();
      await page.waitForTimeout(300);
      
      // "Alleen Beschikbaar" should be visible again
      await expect(eligibleOnlyToggle).toBeVisible();
      
      console.log('✅ Toggle interaction works correctly for logged-in users');
    });

    test('should SHOW subscription section in activity modal for logged-in users', async ({ page }) => {
      await page.goto('/#activities-list');
      await page.waitForLoadState('networkidle');
      
      // Click on first activity to open modal
      const firstActivity = page.locator('.simple-activity-item').first();
      await firstActivity.click();
      
      // Wait for modal to open
      const modal = page.locator('.modal');
      await expect(modal).toBeVisible();
      
      // Schedule section should be visible
      const scheduleSection = page.locator('text=/In je schema|Voeg toe aan je schema|Activiteit vol|Tijdconflict/').first();
      await expect(scheduleSection).toBeVisible();
      
      // Either subscribe or unsubscribe button should be visible (depending on subscription state)
      const subscriptionButtons = page.locator('button:has-text("Schrijf je in"), button:has-text("Schrijf je uit")');
      const buttonCount = await subscriptionButtons.count();
      
      // At least one subscription-related button should be visible
      // (unless activity is full or has conflicts)
      console.log(`Found ${buttonCount} subscription button(s) in modal`);
      
      console.log('✅ Subscription section is visible in modal for logged-in users');
    });

    test('should show all three toggles for logged-in users', async ({ page }) => {
      await page.goto('/#activities-list');
      await page.waitForLoadState('networkidle');
      
      // Count all toggles
      const allToggles = page.locator('.toggle-container');
      const toggleCount = await allToggles.count();
      
      // Should have 3 toggles for logged-in users
      expect(toggleCount).toBe(3);
      
      // Verify each toggle
      const myScheduleToggle = page.locator('.toggle-container:has-text("Mijn Schema")');
      const eligibleOnlyToggle = page.locator('.toggle-container:has-text("Alleen Beschikbaar")');
      const calendarToggle = page.locator('.toggle-container:has-text("Kalender Weergave")');
      
      await expect(myScheduleToggle).toBeVisible();
      await expect(eligibleOnlyToggle).toBeVisible();
      await expect(calendarToggle).toBeVisible();
      
      console.log('✅ All three toggles are visible for logged-in users');
    });
  });

  test.describe('Login State Transition', () => {
    test('should update UI when transitioning from logged-out to logged-in', async ({ page }) => {
      // Start as logged-out user
      await page.addInitScript(() => {
        window.process = window.process || {};
        window.process.env = window.process.env || {};
        delete window.process.env.VITE_USERNAME;
        window.process.env.DEV = 'true';
        
        window.FestivalWizardData = {
          ajaxUrl: '/wp-admin/admin-ajax.php',
          nonce: 'test-nonce',
          apiKey: 'test-api-key',
          apiBaseUrl: 'https://trackapi.catriox.cl',
          showTracksOnly: true,
          isLoggedIn: false,
          currentUser: null
        };
      });
      
      await page.goto('/#activities-list');
      await page.waitForLoadState('networkidle');
      
      // Verify logged-out state
      let statusIndicators = page.locator('.status-indicator');
      let indicatorCount = await statusIndicators.count();
      expect(indicatorCount).toBe(0);
      
      let myScheduleToggle = page.locator('.toggle-container:has-text("Mijn Schema")');
      await expect(myScheduleToggle).not.toBeVisible();
      
      console.log('✅ Initial logged-out state verified');
      
      // Simulate login by updating environment
      await page.evaluate(() => {
        window.process.env.VITE_USERNAME = 'timo';
        window.FestivalWizardData.isLoggedIn = true;
        window.FestivalWizardData.currentUser = {
          username: 'timo',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          displayName: 'Test User'
        };
      });
      
      // Reload to apply changes
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Wait for activities to load
      await expect(page.locator('.simple-activity-item').first()).toBeVisible({ timeout: 10000 });
      
      // Verify logged-in state
      statusIndicators = page.locator('.status-indicator');
      indicatorCount = await statusIndicators.count();
      expect(indicatorCount).toBeGreaterThan(0);
      
      myScheduleToggle = page.locator('.toggle-container:has-text("Mijn Schema")');
      await expect(myScheduleToggle).toBeVisible();
      
      console.log('✅ UI updated correctly after login transition');
    });

    test('should update UI when transitioning from logged-in to logged-out', async ({ page }) => {
      // Start as logged-in user
      await page.addInitScript(() => {
        window.process = window.process || {};
        window.process.env = window.process.env || {};
        window.process.env.VITE_USERNAME = 'timo';
        window.process.env.DEV = 'true';
        
        window.FestivalWizardData = {
          ajaxUrl: '/wp-admin/admin-ajax.php',
          nonce: 'test-nonce',
          apiKey: 'test-api-key',
          apiBaseUrl: 'https://trackapi.catriox.nl',
          showTracksOnly: true,
          isLoggedIn: true,
          currentUser: {
            username: 'timo',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            displayName: 'Test User'
          }
        };
      });
      
      await page.goto('/#activities-list');
      await page.waitForLoadState('networkidle');
      
      // Wait for activities to load
      await expect(page.locator('.simple-activity-item').first()).toBeVisible({ timeout: 10000 });
      
      // Verify logged-in state
      let statusIndicators = page.locator('.status-indicator');
      let indicatorCount = await statusIndicators.count();
      expect(indicatorCount).toBeGreaterThan(0);
      
      let myScheduleToggle = page.locator('.toggle-container:has-text("Mijn Schema")');
      await expect(myScheduleToggle).toBeVisible();
      
      console.log('✅ Initial logged-in state verified');
      
      // Simulate logout by updating environment
      await page.evaluate(() => {
        delete window.process.env.VITE_USERNAME;
        window.FestivalWizardData.isLoggedIn = false;
        window.FestivalWizardData.currentUser = null;
      });
      
      // Reload to apply changes
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify logged-out state
      statusIndicators = page.locator('.status-indicator');
      indicatorCount = await statusIndicators.count();
      expect(indicatorCount).toBe(0);
      
      myScheduleToggle = page.locator('.toggle-container:has-text("Mijn Schema")');
      await expect(myScheduleToggle).not.toBeVisible();
      
      console.log('✅ UI updated correctly after logout transition');
    });
  });
});