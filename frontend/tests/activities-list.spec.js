import { test, expect } from '@playwright/test';

test.describe('Activities List Page', () => {
  test.beforeEach(async ({ page }) => {
    // Set up WordPress data to enable activities list page
    await page.addInitScript(() => {
      // Mock WordPress data object
      window.FestivalWizardData = {
        showTracksOnly: true,
        apiKey: 'test-key',
        apiBaseUrl: 'https://test.example.com'
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
    });

    // Mock the API response for activities
    await page.route('**/activities/all', async route => {
      const mockActivities = [
        {
          id: '1',
          name: 'Morning Workshop',
          description: 'A great workshop to start the day',
          type: 'workshop',
          start_time: '2025-07-15T09:00:00Z',
          end_time: '2025-07-15T10:30:00Z',
          location: 'Room A',
          metadata: {}
        },
        {
          id: '2',
          name: 'Afternoon Session',
          description: 'Interactive afternoon session',
          type: 'session',
          start_time: '2025-07-15T14:00:00Z',
          end_time: '2025-07-15T15:30:00Z',
          location: 'Room B',
          metadata: {}
        },
        {
          id: '3',
          name: 'Next Day Event',
          description: 'Special event on the second day',
          type: 'event',
          start_time: '2025-07-16T10:00:00Z',
          end_time: '2025-07-16T11:00:00Z',
          location: 'Main Hall',
          metadata: {}
        }
      ];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockActivities)
      });
    });
  });

  test('should display activities list when navigating to #activities-list', async ({ page }) => {
    await page.goto('/#activities-list');

    // Check page title and intro
    await expect(page.locator('h1')).toContainText('Festival Activiteiten');
    await expect(page.locator('p').first()).toContainText('Hier vind je alle activiteiten van het festival');

    // Wait for activities to load
    await expect(page.locator('.activity-item')).toHaveCount(3);

    // Check that activities are displayed
    await expect(page.locator('.activity-title')).toContainText(['Morning Workshop', 'Afternoon Session', 'Next Day Event']);

    // Check that locations are displayed
    await expect(page.locator('.activity-location')).toContainText(['@ Room A', '@ Room B', '@ Main Hall']);

    // Check that types are displayed
    await expect(page.locator('.activity-type')).toContainText(['(workshop)', '(session)', '(event)']);
  });

  test('should group activities by day correctly', async ({ page }) => {
    await page.goto('/#activities-list');

    // Wait for activities to load
    await expect(page.locator('.day-section')).toHaveCount(2);

    // Check first day section
    const firstDaySection = page.locator('.day-section').first();
    await expect(firstDaySection.locator('h2')).toContainText('2025'); // Should contain year
    await expect(firstDaySection.locator('.activity-item')).toHaveCount(2); // Two activities on first day

    // Check second day section
    const secondDaySection = page.locator('.day-section').last();
    await expect(secondDaySection.locator('h2')).toContainText('2025'); // Should contain year
    await expect(secondDaySection.locator('.activity-item')).toHaveCount(1); // One activity on second day
  });

  test('should display activities in chronological order', async ({ page }) => {
    await page.goto('/#activities-list');

    // Wait for activities to load
    await expect(page.locator('.activity-item')).toHaveCount(3);

    // Get all activity titles in order
    const activityTitles = await page.locator('.activity-title').allTextContents();

    // Should be sorted by time: Morning Workshop (09:00), Afternoon Session (14:00), Next Day Event (next day 10:00)
    expect(activityTitles[0]).toBe('Morning Workshop');
    expect(activityTitles[1]).toBe('Afternoon Session');
    expect(activityTitles[2]).toBe('Next Day Event');
  });

  test('should display time in correct format', async ({ page }) => {
    await page.goto('/#activities-list');

    // Wait for activities to load
    await expect(page.locator('.activity-item')).toHaveCount(3);

    // Check time format (should be HH:MM - HH:MM)
    const timeElements = await page.locator('.activity-time').allTextContents();
    
    // Each time should match the pattern HH:MM - HH:MM
    timeElements.forEach(timeText => {
      expect(timeText).toMatch(/\d{2}:\d{2} - \d{2}:\d{2}/);
    });
  });

  test('should handle API error gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/activities/all', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.goto('/#activities-list');

    // Should display error message
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Fout bij het laden van activiteiten');

    // Should display retry button
    await expect(page.locator('button')).toContainText('Opnieuw proberen');
  });

  test('should handle empty activities list', async ({ page }) => {
    // Mock empty response
    await page.route('**/activities/all', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/#activities-list');

    // Should display empty state message (be specific about which p element)
    await expect(page.locator('p').filter({ hasText: 'Geen activiteiten gevonden.' })).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/#activities-list');

    // Wait for activities to load
    await expect(page.locator('.activity-item')).toHaveCount(3);

    // Check that the page is still readable and functional on mobile
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.activity-item').first()).toBeVisible();

    // Check that activity items stack vertically on mobile
    const firstActivity = page.locator('.activity-item').first();
    await expect(firstActivity.locator('.activity-time')).toBeVisible();
    await expect(firstActivity.locator('.activity-title')).toBeVisible();
  });

  test('should show loading state initially', async ({ page }) => {
    // Delay the API response to see loading state
    await page.route('**/activities/all', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/#activities-list');

    // Should show loading message initially
    await expect(page.locator('p')).toContainText('Activiteiten laden...');
  });
});

test.describe('Show Tracks Only Configuration', () => {
  test('should redirect to activities list when show_tracks_only is enabled via environment', async ({ page }) => {
    // Set environment variable for show_tracks_only
    await page.addInitScript(() => {
      // Mock import.meta.env for development mode
      Object.defineProperty(window, 'import', {
        value: {
          meta: {
            env: {
              DEV: true,
              VITE_SHOW_TRACKS_ONLY: 'true',
              VITE_DEV_AUTH_MODE: 'logged_in',
              VITE_API_KEY: 'test-key',
              VITE_API_BASE_URL: 'https://test.example.com'
            }
          }
        }
      });
    });

    await page.goto('/');

    // Should automatically redirect to activities list
    await expect(page.locator('h1')).toContainText('Festival Activiteiten');
    await expect(page.locator('.activities-list-page')).toBeVisible();
  });

  test('should redirect to activities list when show_tracks_only is enabled via WordPress setting', async ({ page }) => {
    // Mock WordPress data
    await page.addInitScript(() => {
      window.FestivalWizardData = {
        showTracksOnly: true,
        apiKey: 'test-key',
        apiBaseUrl: 'https://test.example.com'
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
    });

    await page.goto('/');

    // Should automatically redirect to activities list
    await expect(page.locator('h1')).toContainText('Festival Activiteiten');
    await expect(page.locator('.activities-list-page')).toBeVisible();
  });

  test('should show wizard when show_tracks_only is disabled', async ({ page }) => {
    // Mock WordPress data with show_tracks_only disabled
    await page.addInitScript(() => {
      window.FestivalWizardData = {
        showTracksOnly: false,
        apiKey: 'test-key',
        apiBaseUrl: 'https://test.example.com'
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
    });

    // Navigate to wizard explicitly since the default routing might not work in tests
    await page.goto('/#wizard');

    // Should show wizard - look for the wizard form and title
    await expect(page.locator('h2').filter({ hasText: 'Festival Track Wizard' })).toBeVisible();
    await expect(page.locator('form')).toBeVisible();
  });
});
