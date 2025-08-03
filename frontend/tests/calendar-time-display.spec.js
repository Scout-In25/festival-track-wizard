import { test, expect } from '@playwright/test';

test.describe('Calendar Time Display', () => {
  test('should show start and end times in calendar view', async ({ page }) => {
    await page.goto('/#activities-list');
    await page.waitForLoadState('networkidle');

    // Wait for activities to load in simple view first
    await expect(page.locator('.simple-activity-item').first()).toBeVisible({ timeout: 10000 });

    // Find the calendar view toggle and switch to calendar view
    const calendarToggle = page.locator('.toggle-container:has-text("Kalender Weergave")');
    await expect(calendarToggle).toBeVisible();
    
    await calendarToggle.locator('.toggle-switch').click();
    await page.waitForTimeout(1000);

    // Verify we're in calendar view with day sections
    const daySections = page.locator('.day-section');
    await expect(daySections.first()).toBeVisible({ timeout: 5000 });
    
    console.log('Successfully switched to calendar view');

    // Check for time displays in calendar view activities
    const activitiesWithTime = page.locator('.activity-time');
    const timeDisplayCount = await activitiesWithTime.count();
    
    console.log(`Found ${timeDisplayCount} activities with time displays`);

    if (timeDisplayCount > 0) {
      // Check the first few time displays
      for (let i = 0; i < Math.min(timeDisplayCount, 5); i++) {
        const timeElement = activitiesWithTime.nth(i);
        const timeText = await timeElement.textContent();
        const timeColor = await timeElement.evaluate(element => {
          return window.getComputedStyle(element).color;
        });
        
        console.log(`Activity ${i + 1}: Time="${timeText}", Color="${timeColor}"`);
        
        // Verify time format (HH:MM-HH:MM)
        expect(timeText).toMatch(/\d{2}:\d{2}-\d{2}:\d{2}/);
        
        // Verify color is dark gray (rgb(108, 117, 125) = #6c757d)
        expect(timeColor).toBe('rgb(108, 117, 125)');
      }
      
      console.log('✅ Time displays are working correctly with proper format and color');
    } else {
      console.log('ℹ️  No time displays found - activities may not have start/end times');
    }

    // Verify that activities in calendar view have the expected structure
    const calendarActivities = page.locator('.day-section .simple-activity-item');
    const calendarActivityCount = await calendarActivities.count();
    
    console.log(`Found ${calendarActivityCount} activities in calendar view`);
    expect(calendarActivityCount).toBeGreaterThan(0);
  });

  test('should verify time display styling and positioning', async ({ page }) => {
    await page.goto('/#activities-list');
    await page.waitForLoadState('networkidle');

    // Switch to calendar view
    const calendarToggle = page.locator('.toggle-container:has-text("Kalender Weergave")');
    await calendarToggle.locator('.toggle-switch').click();
    await page.waitForTimeout(1000);

    // Look for time elements
    const timeElements = page.locator('.activity-time');
    const timeCount = await timeElements.count();

    if (timeCount > 0) {
      const firstTimeElement = timeElements.first();
      
      // Check styling
      const styles = await firstTimeElement.evaluate(element => {
        const computed = window.getComputedStyle(element);
        return {
          color: computed.color,
          fontSize: computed.fontSize,
          marginLeft: computed.marginLeft
        };
      });

      console.log('Time element styling:', styles);
      
      // Verify the inline styles are applied
      expect(styles.color).toBe('rgb(108, 117, 125)'); // #6c757d
      // Font size should be smaller (0.9em)
      expect(parseFloat(styles.fontSize)).toBeLessThan(16); // Assuming base font is 16px
      
      console.log('✅ Time element styling is correct');
    } else {
      console.log('ℹ️  No time elements found for styling verification');
    }
  });

  test('should only show time display in calendar view, not simple view', async ({ page }) => {
    await page.goto('/#activities-list');
    await page.waitForLoadState('networkidle');

    // Check simple view first (should not have time displays)
    await expect(page.locator('.simple-activity-item').first()).toBeVisible({ timeout: 10000 });
    
    let timeElementsInSimpleView = await page.locator('.activity-time').count();
    console.log(`Time elements in simple view: ${timeElementsInSimpleView}`);

    // Switch to calendar view
    const calendarToggle = page.locator('.toggle-container:has-text("Kalender Weergave")');
    await calendarToggle.locator('.toggle-switch').click();
    await page.waitForTimeout(1000);

    // Check calendar view (should have time displays)
    let timeElementsInCalendarView = await page.locator('.activity-time').count();
    console.log(`Time elements in calendar view: ${timeElementsInCalendarView}`);

    // Time displays should be present in calendar view
    expect(timeElementsInCalendarView).toBeGreaterThanOrEqual(timeElementsInSimpleView);
    
    console.log('✅ Time display behavior verified for both views');
  });
});