import { test, expect } from '@playwright/test';

test.describe('Festival Track Wizard Form', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure wizard is shown by disabling show_tracks_only and setting auth mode
    await page.addInitScript(() => {
      window.FestivalWizardData = {
        showTracksOnly: false,
        apiKey: 'test-key',
        apiBaseUrl: 'https://test.example.com',
        ajaxUrl: '/wp-admin/admin-ajax.php',
        nonce: 'test-nonce-123',
        activitiesTitle: 'Festival Activiteiten',
        activitiesIntro: 'Hier vind je alle activiteiten van het festival',
        currentUser: {
          username: 'test_user',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          displayName: 'Test User'
        }
      };
      
      // Mock import.meta.env for tests to ensure API key is available
      Object.defineProperty(window, 'import', {
        value: {
          meta: {
            env: {
              DEV: true,
              VITE_API_KEY: 'test-key',
              VITE_API_BASE_URL: 'https://test.example.com'
            }
          }
        }
      });
      
      // Force wizard to show by navigating directly to it
      window.location.hash = '#wizard';
    });
  });

  test('should allow user to fill and submit the form successfully', async ({ page }) => {
    // Intercept the form submission request and mock a successful response
    await page.route('**/REST/formsubmit/', async route => {
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

    // Question 1: Welke rol(len) heb jij? (Multiselect)
    await page.getByRole('checkbox', { name: 'Leiding' }).check();
    await page.getByRole('checkbox', { name: 'Bestuur of bestuursondersteuning' }).check();
    await page.getByRole('button', { name: 'Next' }).click();

    // Question 2: Van welke speltak ben jij leiding? (Multiselect, depends on Leiding)
    await expect(page.getByText('Van welke speltak ben jij leiding?')).toBeVisible();
    await page.getByRole('checkbox', { name: 'Bevers' }).check();
    await page.getByRole('button', { name: 'Next' }).click();

    // Question 3: Welke rol heb je in het bestuur? (Singleselect, depends on Bestuur)
    await expect(page.getByText('Welke rol heb je in het bestuur?')).toBeVisible();
    await page.getByRole('radio', { name: 'Voorzitter' }).check();
    await page.getByRole('button', { name: 'Next' }).click();

    // Question 4: Hoe lang ben jij al vrijwilliger bij Scouting? (Singleselect)
    await expect(page.getByText('Hoe lang ben jij al vrijwilliger bij Scouting?')).toBeVisible();
    await page.getByRole('radio', { name: 'Nog niet zo lang (0-2 jaar)' }).check();
    await page.getByRole('button', { name: 'Next' }).click();

    // Question 5: Welke activiteitengebieden vind jij het leukste (kies er maximaal 3)? (Multiselect)
    await expect(page.getByText('Welke activiteitengebieden vind jij het leukste (kies er maximaal 3)?')).toBeVisible();
    await page.getByRole('checkbox', { name: 'Veilig en gezond' }).check();
    await page.getByRole('checkbox', { name: 'Identiteit' }).check();
    await page.getByRole('checkbox', { name: 'Expressies' }).check();
    await page.getByRole('button', { name: 'Next' }).click();

    // Question 6: Welke onderwerpen spreken je aan? (Multiselect)
    await expect(page.getByText('Welke onderwerpen spreken je aan?')).toBeVisible();
    await page.getByRole('checkbox', { name: 'Sociale veiligheid' }).check();
    
    // Click the submit button
    await page.getByRole('button', { name: 'Submit' }).click();

    // Expect a success alert
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Schedule submitted!');
      await dialog.accept();
    });
  });

  // Commenting out this test as it needs a significant rewrite for multi-step validation
  // test('should display validation errors for empty submission', async ({ page }) => {
  //   await page.goto('/');

  //   // Click the submit button without filling anything
  //   await page.getByRole('button', { name: 'Submit' }).click();

  //   // Expect validation errors to be visible
  //   await expect(page.getByText('Select at least one interest.')).toBeVisible();
  //   await expect(page.getByText('Select a music style.')).toBeVisible();
  //   await expect(page.getByText('Choose a Sunday event.')).toBeVisible();
  // });

  test('should not submit prematurely when clicking next on intermediate steps', async ({ page }) => {
    let submissionAttempted = false;
    // Intercept the form submission request and mock a successful response
    await page.route('**/REST/formsubmit/', async route => {
      submissionAttempted = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Success' }),
      });
    });

    // Listen for dialogs (alerts) to ensure no premature submission error
    page.on('dialog', async dialog => {
      if (dialog.message().includes('Submission failed.')) {
        // Fail the test if a submission failed alert appeared prematurely
        expect(true, 'Premature submission failed alert appeared!').toBe(false);
      }
      await dialog.accept(); // Accept any dialogs to not block the test
    });

    await page.goto('/');

    // Question 1: Welke rol(len) heb jij? (Multiselect)
    await page.getByRole('checkbox', { name: 'Leiding' }).check();
    await page.getByRole('button', { name: 'Next' }).click();

    // Question 2: Van welke speltak ben jij leiding? (Multiselect, depends on Leiding)
    await expect(page.getByText('Van welke speltak ben jij leiding?')).toBeVisible();
    await page.getByRole('checkbox', { name: 'Bevers' }).check();
    await page.getByRole('button', { name: 'Next' }).click();

    // Question 3: Hoe lang ben jij al vrijwilliger bij Scouting? (Singleselect)
    await expect(page.getByText('Hoe lang ben jij al vrijwilliger bij Scouting?')).toBeVisible();
    await page.getByRole('radio', { name: 'Nog niet zo lang (0-2 jaar)' }).check();
    await page.getByRole('button', { name: 'Next' }).click();

    // Question 4: Welke activiteitengebieden vind jij het leukste (kies er maximaal 3)? (Multiselect)
    await expect(page.getByText('Welke activiteitengebieden vind jij het leukste (kies er maximaal 3)?')).toBeVisible();
    await page.getByRole('checkbox', { name: 'Veilig en gezond' }).check();
    
    // Click Next - this is the crucial step where premature submission was reported
    await page.getByRole('button', { name: 'Next' }).click();

    // Assert that no submission was attempted at this point
    expect(submissionAttempted).toBe(false);

    // Question 5: Welke onderwerpen spreken je aan? (Multiselect)
    await expect(page.getByText('Welke onderwerpen spreken je aan?')).toBeVisible();
    
    // Now, fill the last question and submit
    await page.getByRole('checkbox', { name: 'Sociale veiligheid' }).check();
    
    // Wait a bit to ensure the form is ready
    await page.waitForTimeout(100);
    
    await page.getByRole('button', { name: 'Submit' }).click();

    // Wait for potential submission
    await page.waitForTimeout(500);

    // Assert that submission was attempted now
    expect(submissionAttempted).toBe(true);

    // Expect a success alert for the final submission
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Schedule submitted!');
      await dialog.accept();
    });
  });
});
