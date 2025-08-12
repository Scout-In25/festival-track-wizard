import { test, expect } from '@playwright/test';

test.describe('Track Filter Reset Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up environment for logged-in user
    await page.addInitScript(() => {
      window.process = window.process || {};
      window.process.env = window.process.env || {};
      
      // Mock logged-in development environment
      window.process.env.VITE_USERNAME = 'test-user';
      window.process.env.VITE_API_KEY = 'test-api-key';
      window.process.env.VITE_API_BASE_URL = 'https://trackapi.catriox.nl';
      window.process.env.VITE_DEBUG = 'false';
      window.process.env.VITE_SHOW_TRACKS_ONLY = 'true';
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
          id: 123,
          username: 'test-user',
          email: 'test@example.com'
        }
      };
    });
  });

  test('should reset track filter to "Alle tracks" when "Mijn Schema" is activated', async ({ page }) => {
    await page.goto('/#activities-list');
    await page.waitForLoadState('networkidle');
    
    // Wait for tracks to load
    const trackDropdown = page.locator('#track-dropdown');
    await expect(trackDropdown).toBeVisible({ timeout: 10000 });
    
    // Verify track dropdown has options
    const trackOptions = trackDropdown.locator('option');
    const optionCount = await trackOptions.count();
    
    if (optionCount > 1) {
      // Select a specific track (not "Alle tracks")
      await trackDropdown.selectOption({ index: 1 });
      
      // Verify a specific track is selected
      const selectedValue = await trackDropdown.inputValue();
      expect(selectedValue).not.toBe('');
      
      console.log('✅ Selected a specific track:', selectedValue);
      
      // Now activate "Mijn Schema" toggle
      const myScheduleToggle = page.locator('.toggle-container:has-text("Mijn Schema")');
      await expect(myScheduleToggle).toBeVisible();
      
      await myScheduleToggle.locator('.toggle-switch').click();
      await page.waitForTimeout(300);
      
      // Verify track filter is reset to "Alle tracks" (empty value)
      const resetValue = await trackDropdown.inputValue();
      expect(resetValue).toBe('');
      
      console.log('✅ Track filter reset to "Alle tracks" when "Mijn Schema" activated');
    } else {
      console.log('ℹ️ No specific tracks available to test with');
    }
  });

  test('should keep track filter unchanged when "Mijn Schema" is deactivated', async ({ page }) => {
    await page.goto('/#activities-list');
    await page.waitForLoadState('networkidle');
    
    const trackDropdown = page.locator('#track-dropdown');
    await expect(trackDropdown).toBeVisible({ timeout: 10000 });
    
    const myScheduleToggle = page.locator('.toggle-container:has-text("Mijn Schema")');
    await expect(myScheduleToggle).toBeVisible();
    
    // Activate "Mijn Schema" first
    await myScheduleToggle.locator('.toggle-switch').click();
    await page.waitForTimeout(300);
    
    // Verify it's reset to "Alle tracks"
    let currentValue = await trackDropdown.inputValue();
    expect(currentValue).toBe('');
    
    // Deactivate "Mijn Schema"
    await myScheduleToggle.locator('.toggle-switch').click();
    await page.waitForTimeout(300);
    
    // Verify track filter remains at "Alle tracks"
    currentValue = await trackDropdown.inputValue();
    expect(currentValue).toBe('');
    
    console.log('✅ Track filter remains unchanged when "Mijn Schema" is deactivated');
  });
});