import { test, expect } from '@playwright/test';

test.describe('Festival Track Wizard Form', () => {
  test('should allow user to fill and submit the form successfully', async ({ page }) => {
    // Intercept the form submission request and mock a successful response
    await page.route('https://si25.nl/REST/formsubmit/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Success' }),
      });
    });

    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Festival Track Wizard Standalone/);

    // Expect the heading to be visible
    await expect(page.getByRole('heading', { name: 'Festival Track Wizard' })).toBeVisible();

    // Fill out the form
    await page.getByRole('checkbox', { name: 'Music' }).check();
    await page.getByRole('checkbox', { name: 'Workshops' }).check();
    await page.getByLabel('Music Style').selectOption('rock');
    await page.getByLabel('Yoga').check();

    // Click the submit button
    await page.getByRole('button', { name: 'Submit' }).click();

    // Expect a success alert
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Schedule submitted!');
      await dialog.accept();
    });
  });

  test('should display validation errors for empty submission', async ({ page }) => {
    await page.goto('/');

    // Click the submit button without filling anything
    await page.getByRole('button', { name: 'Submit' }).click();

    // Expect validation errors to be visible
    await expect(page.getByText('Select at least one interest.')).toBeVisible();
    await expect(page.getByText('Select a music style.')).toBeVisible();
    await expect(page.getByText('Choose a Sunday event.')).toBeVisible();
  });
});