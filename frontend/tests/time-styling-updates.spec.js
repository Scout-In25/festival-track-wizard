import { test, expect } from '@playwright/test';

test.describe('Time Element Styling Updates', () => {
  test('should verify time element has correct styling: min-width 90px, font-weight 400, font-size 0.9rem', async ({ page }) => {
    await page.goto('/#activities-list');
    await page.waitForLoadState('networkidle');

    // Switch to calendar view
    const calendarToggle = page.locator('.toggle-container:has-text("Kalender Weergave")');
    await calendarToggle.locator('.toggle-switch').click();
    await page.waitForTimeout(1000);

    // Get the first time element
    const timeElement = page.locator('.activity-time').first();
    await expect(timeElement).toBeVisible({ timeout: 5000 });

    // Check all the styling properties
    const styles = await timeElement.evaluate(element => {
      const computed = window.getComputedStyle(element);
      return {
        minWidth: computed.minWidth,
        fontWeight: computed.fontWeight,
        fontSize: computed.fontSize,
        marginRight: computed.marginRight,
        display: computed.display,
        color: computed.color
      };
    });

    console.log('Time element computed styles:', styles);

    // Verify each style property
    expect(styles.minWidth).toBe('90px');
    console.log('✅ Min-width is 90px');

    expect(styles.fontWeight).toBe('400');
    console.log('✅ Font-weight is 400');

    // Font size should be 0.9rem (approximately 14.4px if base is 16px)
    const fontSizeValue = parseFloat(styles.fontSize);
    expect(fontSizeValue).toBeGreaterThan(14);
    expect(fontSizeValue).toBeLessThan(15);
    console.log(`✅ Font-size is correct: ${styles.fontSize}`);

    expect(styles.marginRight).toBe('8px');
    console.log('✅ Margin-right is 8px');

    expect(styles.display).toBe('inline-block');
    console.log('✅ Display is inline-block');

    expect(styles.color).toBe('rgb(108, 117, 125)');
    console.log('✅ Color is correct dark gray');

    console.log('✅ All time element styling is correct!');
  });

  test('should verify min-width creates consistent alignment', async ({ page }) => {
    await page.goto('/#activities-list');
    await page.waitForLoadState('networkidle');

    // Switch to calendar view
    const calendarToggle = page.locator('.toggle-container:has-text("Kalender Weergave")');
    await calendarToggle.locator('.toggle-switch').click();
    await page.waitForTimeout(1000);

    // Get multiple time elements to check consistency
    const timeElements = page.locator('.activity-time');
    const timeCount = Math.min(await timeElements.count(), 5);

    console.log(`Checking width consistency across ${timeCount} time elements...`);

    const widths = [];
    for (let i = 0; i < timeCount; i++) {
      const timeElement = timeElements.nth(i);
      const width = await timeElement.evaluate(element => {
        return element.getBoundingClientRect().width;
      });
      const text = await timeElement.textContent();
      
      widths.push(width);
      console.log(`Time element ${i + 1}: "${text}" = ${width}px wide`);
    }

    // All widths should be at least 90px due to min-width
    widths.forEach((width, index) => {
      expect(width).toBeGreaterThanOrEqual(90);
    });

    console.log('✅ All time elements respect min-width of 90px');

    // Check if shorter times (like "10:00-11:00") vs longer times (like "09:30-10:30") 
    // both have consistent minimum width
    const minWidth = Math.min(...widths);
    const maxWidth = Math.max(...widths);
    
    console.log(`Width range: ${minWidth}px - ${maxWidth}px`);
    expect(minWidth).toBeGreaterThanOrEqual(90);
    console.log('✅ Min-width constraint ensures consistent alignment');
  });

  test('should verify visual layout with updated styling', async ({ page }) => {
    await page.goto('/#activities-list');
    await page.waitForLoadState('networkidle');

    // Switch to calendar view
    const calendarToggle = page.locator('.toggle-container:has-text("Kalender Weergave")');
    await calendarToggle.locator('.toggle-switch').click();
    await page.waitForTimeout(1000);

    // Get first activity to examine layout
    const firstActivity = page.locator('.day-section .simple-activity-item').first();
    const activityHeader = firstActivity.locator('.simple-activity-header');
    
    // Get the time and title elements
    const timeElement = activityHeader.locator('.activity-time');
    const titleElement = activityHeader.locator('.simple-activity-title');
    
    const timeText = await timeElement.textContent();
    const titleText = await titleElement.textContent();
    
    console.log(`Time: "${timeText}"`);
    console.log(`Title: "${titleText}"`);
    
    // Verify both elements are visible
    await expect(timeElement).toBeVisible();
    await expect(titleElement).toBeVisible();
    
    // Check positioning - time should still be to the left of title
    const timeBox = await timeElement.boundingBox();
    const titleBox = await titleElement.boundingBox();
    
    if (timeBox && titleBox) {
      console.log(`Time position: x=${timeBox.x}, width=${timeBox.width}`);
      console.log(`Title position: x=${titleBox.x}, width=${titleBox.width}`);
      
      expect(timeBox.x).toBeLessThan(titleBox.x);
      expect(timeBox.width).toBeGreaterThanOrEqual(90);
      
      console.log('✅ Layout positioning is correct with new styling');
    }
  });
});