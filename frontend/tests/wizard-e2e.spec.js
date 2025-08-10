import { test, expect } from '@playwright/test';

test.describe('Festival Track Wizard E2E', () => {
  // Helper function to wait for page to be fully loaded
  const waitForPageLoad = async (page) => {
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.activities-list-page')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.simple-activity-item').first()).toBeVisible({ timeout: 15000 });
  };
  test('should load wizard and verify activities are displayed', async ({ page }) => {
    // Navigate to the base URL
    await page.goto('/');

    // Wait for the page to load - since VITE_DEV_AUTH_MODE=not_logged_in and VITE_SHOW_TRACKS_ONLY=true
    // we should see the activities list page
    await waitForPageLoad(page);

    // Verify that activities are loaded by checking for activity items
    // Based on the code, in simple view they use .simple-activity-item
    const activityItems = page.locator('.simple-activity-item');
    
    // Verify multiple activities are loaded
    const activityCount = await activityItems.count();
    expect(activityCount).toBeGreaterThan(0);
    
    // Log the number of activities found
    console.log(`Found ${activityCount} activities loaded`);

    // Verify activity items have essential content
    const firstActivity = activityItems.first();
    
    // Check for activity title
    await expect(firstActivity.locator('.simple-activity-title')).toBeVisible();
    
    // Verify the title has actual text content
    const title = await firstActivity.locator('.simple-activity-title').textContent();
    
    expect(title).toBeTruthy();
    
    console.log(`First activity: "${title}"`);
  });

  test('should handle view mode toggle', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Find the calendar view toggle
    const calendarToggle = page.locator('.toggle-container:has-text("Kalender Weergave")');
    await expect(calendarToggle).toBeVisible();
    
    // Click the toggle to switch to calendar view
    await calendarToggle.locator('.toggle-switch').click();
    
    // Wait for view to change
    await page.waitForTimeout(500);
    
    // Verify we now have calendar view with day sections
    const daySections = page.locator('.day-section');
    await expect(daySections.first()).toBeVisible({ timeout: 5000 });
    
    // Verify activities are shown with time
    const activityWithTime = page.locator('.simple-activity-item .activity-time');
    await expect(activityWithTime.first()).toBeVisible();
    
    const timeText = await activityWithTime.first().textContent();
    expect(timeText).toMatch(/\d{2}:\d{2}/); // Should match time format HH:MM
  });

  test('should open activity details modal when clicking an activity', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Wait for activities to load
    const activityItems = page.locator('.simple-activity-item');

    // Click the first activity
    await activityItems.first().click();
    
    // Wait for modal to open - the modal uses .modal-backdrop as the overlay
    const modal = page.locator('.modal-backdrop');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Check for activity details in the modal - the title is an h2 within the modal
    const modalTitle = modal.locator('h2');
    await expect(modalTitle).toBeVisible();
    
    const titleText = await modalTitle.textContent();
    expect(titleText).toBeTruthy();
    console.log(`Modal opened for activity: "${titleText}"`);
    
    // Close the modal by clicking the close button (SVG icon)
    const closeButton = modal.locator('button[aria-label="Sluit modal"]');
    await expect(closeButton).toBeVisible();
    await closeButton.click();
    
    // Verify modal is closed
    await expect(modal).not.toBeVisible();
  });

  test('should display filter toggles appropriately based on login state', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Based on current .env config (VITE_DEV_AUTH_MODE=not_logged_in, VITE_USERNAME commented out)
    // User is NOT logged in, so only calendar toggle should be visible
    const myScheduleToggle = page.locator('.toggle-container:has-text("Mijn Schema")');
    const eligibleOnlyToggle = page.locator('.toggle-container:has-text("Alleen Beschikbaar")');
    const calendarToggle = page.locator('.toggle-container:has-text("Kalender Weergave")');
    
    // Calendar toggle should always be visible
    await expect(calendarToggle).toBeVisible({ timeout: 5000 });
    
    // For non-logged in users, personal toggles should not be visible
    await expect(myScheduleToggle).not.toBeVisible();
    await expect(eligibleOnlyToggle).not.toBeVisible();
    
    console.log('✓ Filter toggles correctly displayed for non-logged-in user');
  });

  test('should handle read-only mode for non-logged-in users', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Wait for activities to load
    const activityItems = page.locator('.simple-activity-item');
    
    console.log('✓ Activities loaded successfully');

    // Step 1: Verify no subscription-related toggles are visible for non-logged users
    const eligibleOnlyToggle = page.locator('.toggle-container:has-text("Alleen Beschikbaar")');
    const myScheduleToggle = page.locator('.toggle-container:has-text("Mijn Schema")');
    
    await expect(eligibleOnlyToggle).not.toBeVisible();
    await expect(myScheduleToggle).not.toBeVisible();
    
    console.log('✓ Subscription toggles correctly hidden for non-logged users');

    // Step 2: Open activity modal and verify no subscription buttons
    const firstActivity = activityItems.first();
    const firstActivityName = await firstActivity.locator('.simple-activity-title').textContent();
    console.log(`Opening activity: "${firstActivityName}"`);
    
    await firstActivity.click();

    // Step 3: Verify modal opens but without subscription functionality
    const modal = page.locator('.modal-backdrop');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Verify activity details are shown
    const modalTitle = modal.locator('h2');
    await expect(modalTitle).toBeVisible();
    
    const titleText = await modalTitle.textContent();
    expect(titleText).toBeTruthy();
    console.log(`Modal opened for activity: "${titleText}"`);
    
    // Step 4: Verify no subscription buttons are present (read-only mode)
    const subscribeButton = modal.locator('button:has-text("Schrijf je in")');
    const unsubscribeButton = modal.locator('button:has-text("Schrijf je uit")');
    
    // These buttons should not be visible for non-logged users
    await expect(subscribeButton).not.toBeVisible();
    await expect(unsubscribeButton).not.toBeVisible();
    
    console.log('✓ Subscription buttons correctly hidden in read-only mode');

    // Step 5: Verify status indicators are not shown for non-logged users
    const statusIndicators = page.locator('.status-indicator');
    const statusCount = await statusIndicators.count();
    expect(statusCount).toBe(0);
    
    console.log('✓ Status indicators correctly hidden for non-logged users');

    // Step 6: Close the modal
    const closeButton = modal.locator('button[aria-label="Sluit modal"]');
    await expect(closeButton).toBeVisible();
    await closeButton.click();
    
    // Verify modal is closed
    await expect(modal).not.toBeVisible();
    
    console.log('✅ Read-only mode test completed successfully!');
  });
});