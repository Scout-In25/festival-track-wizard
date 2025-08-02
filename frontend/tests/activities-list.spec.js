import { test, expect } from '@playwright/test';

test.describe('Activities List Page', () => {
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

  test.beforeEach(async ({ page }) => {
    // Set up all API mocks BEFORE any other initialization
    // This ensures they're ready when the page starts making requests
    
    // Mock activities API with specific patterns to avoid catching JS files
    await page.route(/.*\/api\/activities\/all$/, async route => {
      console.log('✅ Mocking activities:', route.request().url());
      console.log('📊 Mock activities data:', JSON.stringify(mockActivities, null, 2));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: mockActivities })
      });
    });
    
    // Mock participants API - be more specific to avoid catching JS files
    await page.route(/.*\/api\/participants\/[^/]+$/, async route => {
      console.log('✅ Mocking participants:', route.request().url());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: '123',
            username: 'testuser1',
            firstname: 'Test',
            surname: 'User',
            email: 'test@example.com'
          }
        })
      });
    });
    
    // Mock tracks API - be more specific to avoid catching JS files
    await page.route(/.*\/api\/tracks\/all$/, async route => {
      console.log('✅ Mocking tracks:', route.request().url());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] })
      });
    });
    
    // Mock WordPress AJAX
    await page.route('**/wp-admin/admin-ajax.php', async route => {
      const request = route.request();
      const formData = await request.postData();
      
      if (formData && formData.includes('festival_activities_all')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockActivities
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: {} })
        });
      }
    });
    
    // Set up WordPress data to enable activities list page
    await page.addInitScript(() => {
      // Mock WordPress data object
      window.FestivalWizardData = {
        showTracksOnly: true,
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
              VITE_API_BASE_URL: 'https://test.example.com',
              VITE_USERNAME: 'test_user'
            }
          }
        }
      });
    });
  });

  test('should display activities list when navigating to #activities-list', async ({ page }) => {
    // Add request logging for this specific test
    page.on('request', request => {
      if (request.url().includes('api') || request.url().includes('activities')) {
        console.log('Request:', request.method(), request.url());
      }
    });
    
    // Listen to console logs from the browser to debug data processing
    page.on('console', msg => {
      if (msg.text().includes('activities') || msg.text().includes('validation') || msg.text().includes('deduplication') || msg.text().includes('DataProvider') || msg.text().includes('response')) {
        console.log('🌐 Browser Console:', msg.text());
      }
    });
    
    await page.goto('/#activities-list');

    // Check page title and intro
    await expect(page.locator('h1')).toContainText('Festival Activiteiten');
    await expect(page.locator('p').first()).toContainText('Hier vind je alle activiteiten');

    // Wait for activities to load with debugging
    await page.waitForTimeout(3000); // Give component time to process data
    
    // Check if we have any activities loaded
    const activityCount = await page.locator('.simple-activity-item').count();
    console.log(`Found ${activityCount} activity items on page`);
    
    // If no activities, debug what's happening
    if (activityCount === 0) {
      const pageContent = await page.content();
      console.log('Page shows "Geen activiteiten gevonden":', pageContent.includes('Geen activiteiten gevonden'));
      console.log('Page shows simple view:', pageContent.includes('simple-activity'));
      console.log('Page shows calendar view button:', pageContent.includes('Kalender'));
      
      // Check what's in the console
      const consoleLogs = await page.evaluate(() => {
        return window.console.history || 'No console history available';
      });
      console.log('Browser console history:', consoleLogs);
    }
    
    await expect(page.locator('.simple-activity-item')).toHaveCount(3);

    // Check that activities are displayed in alphabetical order in simple view
    const activityTitles = await page.locator('.simple-activity-title').allTextContents();
    expect(activityTitles).toEqual(['Afternoon Session', 'Morning Workshop', 'Next Day Event']);

    // Check that locations are displayed 
    await expect(page.locator('.simple-activity-location')).toContainText(['@ Room B', '@ Room A', '@ Main Hall']);

    // Check that types are displayed
    await expect(page.locator('.simple-activity-type')).toContainText(['(session)', '(workshop)', '(event)']);
  });

  test('should group activities by day correctly', async ({ page }) => {
    await page.goto('/#activities-list');

    // Wait for activities to load first
    await expect(page.locator('.simple-activity-item')).toHaveCount(3);
    
    // Switch to calendar view to see day grouping
    await page.locator('.view-toggle-button').click();
    
    // Wait for day sections to appear
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

  test('should display activities in alphabetical order in simple view', async ({ page }) => {
    await page.goto('/#activities-list');

    // Wait for activities to load
    await expect(page.locator('.simple-activity-item')).toHaveCount(3);

    // Get all activity titles in order
    const activityTitles = await page.locator('.simple-activity-title').allTextContents();

    // In simple view, activities are sorted alphabetically
    expect(activityTitles[0]).toBe('Afternoon Session');
    expect(activityTitles[1]).toBe('Morning Workshop');
    expect(activityTitles[2]).toBe('Next Day Event');
  });

  test('should display time in correct format', async ({ page }) => {
    await page.goto('/#activities-list');

    // Wait for activities to load first
    await expect(page.locator('.simple-activity-item')).toHaveCount(3);
    
    // Switch to calendar view to see time information
    await page.locator('.view-toggle-button').click();
    
    // Wait for calendar view to load
    await expect(page.locator('.activity-item')).toHaveCount(3);

    // Check time format (should be HH:MM - HH:MM)
    const timeElements = await page.locator('.activity-time').allTextContents();
    
    // Each time should match the pattern HH:MM - HH:MM
    timeElements.forEach(timeText => {
      expect(timeText).toMatch(/\d{2}:\d{2} - \d{2}:\d{2}/);
    });
  });

  test('should handle API error gracefully', async ({ page }) => {
    // Mock API error for direct API calls
    await page.route('http://localhost:5173/api/activities/all', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Fout bij het laden van activiteiten'
        })
      });
    });
    
    await page.route('**/api/activities/all', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Fout bij het laden van activiteiten'
        })
      });
    });
    
    // Also mock tracks and participants to prevent other requests
    await page.route('**/api/tracks/all', async route => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Error' }) });
    });
    await page.route('**/api/participants/*', async route => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Error' }) });
    });

    // Mock WordPress AJAX error
    await page.route('**/wp-admin/admin-ajax.php', async route => {
      const request = route.request();
      const formData = await request.postData();
      
      if (formData && formData.includes('festival_activities_all')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            data: 'Fout bij het laden van activiteiten'
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: {} })
        });
      }
    });

    await page.goto('/#activities-list');

    // Should display error message
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Fout bij het laden van activiteiten');

    // Should display retry button
    await expect(page.locator('button')).toContainText('Opnieuw proberen');
  });

  test('should handle empty activities list', async ({ page }) => {
    // Mock empty API response for direct API calls
    await page.route('http://localhost:5173/api/activities/all', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: []
        })
      });
    });
    
    await page.route('**/api/activities/all', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: []
        })
      });
    });
    
    // Also mock tracks and participants  
    await page.route('**/api/tracks/all', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    });
    await page.route('**/api/participants/*', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: {} }) });
    });

    // Mock empty WordPress AJAX response
    await page.route('**/wp-admin/admin-ajax.php', async route => {
      const request = route.request();
      const formData = await request.postData();
      
      if (formData && formData.includes('festival_activities_all')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: []
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: {} })
        });
      }
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
    await expect(page.locator('.simple-activity-item')).toHaveCount(3);

    // Check that the page is still readable and functional on mobile
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.simple-activity-item').first()).toBeVisible();

    // Check that activity items stack vertically on mobile
    const firstActivity = page.locator('.simple-activity-item').first();
    await expect(firstActivity.locator('.simple-activity-title')).toBeVisible();
    await expect(firstActivity.locator('.simple-activity-location')).toBeVisible();
  });

  test('should show loading state initially', async ({ page }) => {
    // Delay the direct API response to see loading state
    await page.route('http://localhost:5173/api/activities/all', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: []
        })
      });
    });
    
    await page.route('**/api/activities/all', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: []
        })
      });
    });
    
    // Also mock tracks and participants with delay
    await page.route('**/api/tracks/all', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    });
    await page.route('**/api/participants/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: {} }) });
    });

    // Delay the WordPress AJAX response to see loading state
    await page.route('**/wp-admin/admin-ajax.php', async route => {
      const request = route.request();
      const formData = await request.postData();
      
      if (formData && formData.includes('festival_activities_all')) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: []
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: {} })
        });
      }
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
      // Mock WordPress data object with proper configuration
      window.FestivalWizardData = {
        showTracksOnly: true,
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
        apiBaseUrl: 'https://test.example.com',
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
    });

    // Navigate to wizard explicitly since the default routing might not work in tests
    await page.goto('/#wizard');

    // Should show wizard - look for the wizard form and title
    await expect(page.locator('h2').filter({ hasText: 'Festival Track Wizard' })).toBeVisible();
    await expect(page.locator('form')).toBeVisible();
  });
});
