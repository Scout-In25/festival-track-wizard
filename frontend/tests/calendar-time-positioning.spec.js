import { test, expect } from '@playwright/test';

test.describe('Calendar Time Positioning and Styling', () => {
  test('should verify time appears before title and title is not bold', async ({ page }) => {
    await page.goto('/#activities-list');
    await page.waitForLoadState('networkidle');

    // Switch to calendar view
    const calendarToggle = page.locator('.toggle-container:has-text("Kalender Weergave")');
    await calendarToggle.locator('.toggle-switch').click();
    await page.waitForTimeout(1000);

    // Get the first activity in calendar view
    const firstActivity = page.locator('.day-section .simple-activity-item').first();
    await expect(firstActivity).toBeVisible({ timeout: 5000 });

    // Check the order of elements within the activity header
    const activityHeader = firstActivity.locator('.simple-activity-header');
    
    // Get all child elements to verify order
    const children = await activityHeader.evaluateAll(headers => {
      return headers.map(header => {
        const children = Array.from(header.children);
        return children.map(child => ({
          className: child.className,
          textContent: child.textContent.trim(),
          tagName: child.tagName
        }));
      });
    });

    if (children.length > 0 && children[0].length > 0) {
      console.log('Activity header children order:');
      children[0].forEach((child, index) => {
        console.log(`  ${index + 1}: ${child.tagName}.${child.className} = "${child.textContent}"`);
      });

      // The first element should be the time (activity-time class)
      const firstElement = children[0][0];
      expect(firstElement.className).toContain('activity-time');
      console.log('✅ Time appears first in the activity header');

      // Check for activity title element
      const titleElement = children[0].find(child => child.className.includes('simple-activity-title'));
      if (titleElement) {
        console.log(`Activity title found: "${titleElement.textContent}"`);
      }
    }

    // Check font weight of activity title
    const activityTitle = firstActivity.locator('.simple-activity-title');
    const fontWeight = await activityTitle.evaluate(element => {
      return window.getComputedStyle(element).fontWeight;
    });

    console.log(`Activity title font weight: ${fontWeight}`);
    
    // Font weight should be normal (400) or lighter, not bold (700)
    expect(parseInt(fontWeight)).toBeLessThanOrEqual(400);
    console.log('✅ Activity title is not bold');

    // Check that time has proper margin
    const timeElement = firstActivity.locator('.activity-time');
    const marginRight = await timeElement.evaluate(element => {
      return window.getComputedStyle(element).marginRight;
    });

    console.log(`Time element margin right: ${marginRight}`);
    expect(marginRight).toBe('8px');
    console.log('✅ Time element has correct right margin');
  });

  test('should verify the visual layout order', async ({ page }) => {
    await page.goto('/#activities-list');
    await page.waitForLoadState('networkidle');

    // Switch to calendar view
    const calendarToggle = page.locator('.toggle-container:has-text("Kalender Weergave")');
    await calendarToggle.locator('.toggle-switch').click();
    await page.waitForTimeout(1000);

    // Get text content of the first activity to verify order
    const firstActivityHeader = page.locator('.day-section .simple-activity-header').first();
    const headerText = await firstActivityHeader.textContent();
    
    console.log(`First activity header text: "${headerText}"`);
    
    // Should start with time format (HH:MM-HH:MM)
    expect(headerText).toMatch(/^\d{2}:\d{2}-\d{2}:\d{2}/);
    console.log('✅ Activity header starts with time format');

    // Check individual elements exist in correct order
    const timeElement = firstActivityHeader.locator('.activity-time');
    const titleElement = firstActivityHeader.locator('.simple-activity-title');
    
    await expect(timeElement).toBeVisible();
    await expect(titleElement).toBeVisible();
    
    // Get positions to verify time comes before title
    const timeBox = await timeElement.boundingBox();
    const titleBox = await titleElement.boundingBox();
    
    if (timeBox && titleBox) {
      console.log(`Time position: x=${timeBox.x}, Title position: x=${titleBox.x}`);
      expect(timeBox.x).toBeLessThan(titleBox.x);
      console.log('✅ Time appears to the left of the title');
    }
  });
});