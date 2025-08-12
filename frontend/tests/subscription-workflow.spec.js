import { test, expect } from '@playwright/test';

test.describe('Subscription Workflow', () => {
  const mockActivities = [
    {
      id: '1',
      name: 'Morning Yoga',
      description: 'Start your day with relaxing yoga',
      type: 'workshop',
      start_time: '2025-07-15T09:00:00Z',
      end_time: '2025-07-15T10:30:00Z',
      location: 'Room A',
      capacity: 20,
      current_subscriptions: 5,
      metadata: {}
    },
    {
      id: '2', 
      name: 'Afternoon Music Session',
      description: 'Join us for an interactive music session',
      type: 'session',
      start_time: '2025-07-15T14:00:00Z',
      end_time: '2025-07-15T15:30:00Z',
      location: 'Room B',
      capacity: 30,
      current_subscriptions: 10,
      metadata: {}
    },
    {
      id: '3',
      name: 'Evening Campfire',
      description: 'Traditional campfire with songs and stories',
      type: 'event',
      start_time: '2025-07-15T19:00:00Z',
      end_time: '2025-07-15T21:00:00Z',
      location: 'Outdoor Area',
      capacity: 50,
      current_subscriptions: 15,
      metadata: {}
    }
  ];

  // Track subscription state for our mock
  let subscribedActivities = [];

  test.beforeEach(async ({ page }) => {
    // Reset subscribed activities
    subscribedActivities = [];

    // Set up all API mocks BEFORE any other initialization
    // This ensures they're ready when the page starts making requests
    
    // Log all network requests to debug
    page.on('request', request => {
      if (request.url().includes('api') || request.url().includes('activities')) {
        console.log('Network request:', request.method(), request.url());
      }
    });

    // Mock activities API - use regex to match the URL pattern
    // IMPORTANT: This must be defined BEFORE the activity details route
    await page.route(/.*\/api\/activities\/all$/, async route => {
      console.log('✅ Intercepted activities /all request:', route.request().url());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: mockActivities })
      });
    });
    
    // Mock activity details API - exclude /all endpoint
    await page.route(/.*\/api\/activities\/(?!all$)[^/]+$/, async route => {
      const url = route.request().url();
      const activityId = url.split('/').pop();
      const activity = mockActivities.find(a => a.id === activityId);
      
      console.log('✅ Intercepted activity details request:', url);
      if (activity) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: activity })
        });
      } else {
        await route.fulfill({ status: 404 });
      }
    });

    // Mock participants API with subscription state - match any username
    await page.route(/.*\/api\/participants\/[^/]+$/, async route => {
      console.log('✅ Intercepted participants request:', route.request().url());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: '123',
            username: 'timo',
            firstname: 'Test',
            surname: 'User',
            email: 'test@example.com',
            activities: subscribedActivities // Dynamic subscription state
          }
        })
      });
    });

    // Mock subscribe endpoint - match PUT method with URL parameters
    await page.route(/.*\/api\/activities\/subscribe\/[^/]+\/[^/]+$/, async route => {
      const url = route.request().url();
      const parts = url.split('/');
      const activityId = parts[parts.length - 1];
      console.log('✅ Intercepted subscribe request:', url, 'Activity:', activityId);
      
      // Add to subscribed activities if not already there
      if (!subscribedActivities.includes(activityId)) {
        subscribedActivities.push(activityId);
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: true,
          message: 'Successfully subscribed to activity'
        })
      });
    });

    // Mock unsubscribe endpoint - match PUT method with URL parameters
    await page.route(/.*\/api\/activities\/unsubscribe\/[^/]+\/[^/]+$/, async route => {
      const url = route.request().url();
      const parts = url.split('/');
      const activityId = parts[parts.length - 1];
      console.log('✅ Intercepted unsubscribe request:', url, 'Activity:', activityId);
      
      // Remove from subscribed activities
      subscribedActivities = subscribedActivities.filter(id => id !== activityId);
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: true,
          message: 'Successfully unsubscribed from activity'
        })
      });
    });
    
    // Mock tracks API
    await page.route(/.*\/api\/tracks\/all$/, async route => {
      console.log('✅ Intercepted tracks request:', route.request().url());
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
      console.log('WordPress AJAX request:', formData ? formData.substring(0, 100) : 'no data');
      
      if (formData && formData.includes('festival_activities_all')) {
        console.log('✅ Intercepted WordPress activities request');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockActivities
          })
        });
      } else if (formData && formData.includes('get_user_profile')) {
        console.log('✅ Intercepted WordPress user profile request');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              participant: {
                id: '123',
                username: 'testuser1',
                firstname: 'Test',
                surname: 'User',
                email: 'test@example.com',
                activities: subscribedActivities
              },
              wordpress_user: {
                username: 'timo',
                email: 'test@example.com',
                displayName: 'Test User'
              }
            }
          })
        });
      } else if (formData && formData.includes('festival_activities_subscribe')) {
        console.log('✅ Intercepted WordPress subscribe request');
        // Extract activity_id from form data
        const activityIdMatch = formData.match(/activity_id=([^&]+)/);
        if (activityIdMatch) {
          const activityId = decodeURIComponent(activityIdMatch[1]);
          if (!subscribedActivities.includes(activityId)) {
            subscribedActivities.push(activityId);
          }
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Successfully subscribed' })
        });
      } else if (formData && formData.includes('festival_activities_unsubscribe')) {
        console.log('✅ Intercepted WordPress unsubscribe request');
        // Extract activity_id from form data
        const activityIdMatch = formData.match(/activity_id=([^&]+)/);
        if (activityIdMatch) {
          const activityId = decodeURIComponent(activityIdMatch[1]);
          subscribedActivities = subscribedActivities.filter(id => id !== activityId);
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Successfully unsubscribed' })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: {} })
        });
      }
    });
    
    // NOW set up WordPress data to enable activities list page and logged in user
    await page.addInitScript(() => {
      // Clear any existing environment variables that might interfere
      if (window.process && window.process.env) {
        delete window.process.env.VITE_USERNAME;
      }
      
      window.FestivalWizardData = {
        showTracksOnly: true,
        apiKey: 'test-key',
        apiBaseUrl: 'https://test.example.com',
        ajaxUrl: '/wp-admin/admin-ajax.php',
        nonce: 'test-nonce-123',
        activitiesTitle: 'Festival Activiteiten',
        activitiesIntro: 'Hier vind je alle activiteiten van het festival',
        currentUser: {
          username: 'timo',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          displayName: 'Test User'
        }
      };
      
      // Mock import.meta.env for tests - ensure consistent username
      Object.defineProperty(window, 'import', {
        value: {
          meta: {
            env: {
              DEV: true, // Set to true to use API endpoints
              VITE_API_KEY: 'test-key',
              VITE_API_BASE_URL: 'https://test.example.com',
              VITE_USERNAME: 'timo'
            }
          }
        },
        configurable: true
      });
    });
  });

  test('should complete full subscription workflow: subscribe, view in schedule, unsubscribe, toggle off schedule, subscribe to another', async ({ page }) => {
    // Add console logging
    page.on('console', msg => {
      if (msg.text().includes('activities') || msg.text().includes('DataProvider') || msg.text().includes('validation') || msg.text().includes('deduplication') || msg.text().includes('Failed to load')) {
        console.log('Browser Console:', msg.text());
      }
    });
    
    // Add custom console log to check what activitiesService returns
    await page.addInitScript(() => {
      // Override console.error to catch any errors
      const originalError = console.error;
      console.error = (...args) => {
        console.log('Console Error:', ...args);
        originalError.apply(console, args);
      };
    });

    // Navigate to base URL (will redirect to activities list due to showTracksOnly)
    await page.goto('/');

    // Wait for page to be ready
    await page.waitForTimeout(3000);

    // Debug: Check if activities list page is loaded
    const pageTitle = await page.locator('h1').textContent();
    console.log('Page title:', pageTitle);

    // Debug: Check page content
    const bodyText = await page.locator('body').textContent();
    if (bodyText.includes('Activiteiten laden')) {
      console.log('Page is still loading activities...');
    }
    if (bodyText.includes('Geen activiteiten gevonden')) {
      console.log('No activities found message displayed');
      
      // Check if there's an error message
      const errorElement = await page.locator('.error-message').count();
      if (errorElement > 0) {
        const errorText = await page.locator('.error-message').textContent();
        console.log('Error message:', errorText);
      }
    }

    // Wait for activities to load
    await expect(page.locator('.simple-activity-item')).toHaveCount(3);

    // Step 1: Subscribe to first activity (Morning Yoga)
    // Click on the first activity to open modal
    await page.locator('.simple-activity-item').first().click();
    
    // Wait for modal to open
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await expect(page.locator('.modal-content h2')).toContainText('Morning Yoga');
    
    // Click subscribe button
    await page.locator('button:has-text("Aanmelden")').click();
    
    // Wait for toast notification
    await expect(page.locator('.toast')).toContainText('Je bent aangemeld voor deze activiteit');
    
    // Verify subscribe button changed to unsubscribe
    await expect(page.locator('button:has-text("Afmelden")').first()).toBeVisible();
    
    // Close modal
    await page.locator('.modal-close').click();
    await expect(page.locator('.modal-overlay')).not.toBeVisible();

    // Step 2: Turn on "Mijn Schema" (My Schedule)
    // Find and click the "Mijn Schema" toggle
    const mijnSchemaToggle = page.locator('.toggle-container:has-text("Mijn Schema") .toggle-switch');
    await mijnSchemaToggle.click();
    
    // Verify toggle is checked
    await expect(mijnSchemaToggle).toHaveClass(/checked/);
    
    // Verify header changed to "Mijn Schema"
    await expect(page.locator('.filter-status-title')).toContainText('Mijn Schema');
    
    // Verify only subscribed activity is shown
    await expect(page.locator('.simple-activity-item')).toHaveCount(1);
    await expect(page.locator('.simple-activity-title')).toContainText('Morning Yoga');

    // Step 3: Unsubscribe from the activity
    // Click on the activity in schedule view
    await page.locator('.simple-activity-item').first().click();
    
    // Wait for modal
    await expect(page.locator('.modal-overlay')).toBeVisible();
    
    // Click unsubscribe button
    await page.locator('button:has-text("Afmelden")').click();
    
    // Wait for toast notification
    await expect(page.locator('.toast')).toContainText('Je bent uitgeschreven voor deze activiteit');
    
    // Modal should close automatically when unsubscribing in "Mijn Schema" view
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
    
    // Verify no activities shown in "Mijn Schema" (empty schedule)
    await expect(page.locator('.simple-activity-item')).toHaveCount(0);
    await expect(page.locator('p')).toContainText('Geen activiteiten gevonden.');

    // Step 4: Turn off "Mijn Schema"
    await mijnSchemaToggle.click();
    
    // Verify toggle is unchecked
    await expect(mijnSchemaToggle).not.toHaveClass(/checked/);
    
    // Verify header changed back to "Volledig"
    await expect(page.locator('.filter-status-title')).toContainText('Activiteiten volledig');
    
    // Verify all activities are shown again
    await expect(page.locator('.simple-activity-item')).toHaveCount(3);

    // Step 5: Subscribe to a different activity (Evening Campfire)
    // Find and click the Evening Campfire activity
    const eveningCampfire = page.locator('.simple-activity-item:has-text("Evening Campfire")');
    await eveningCampfire.click();
    
    // Wait for modal
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await expect(page.locator('.modal-content h2')).toContainText('Evening Campfire');
    
    // Click subscribe button
    await page.locator('button:has-text("Aanmelden")').click();
    
    // Wait for toast notification
    await expect(page.locator('.toast')).toContainText('Je bent aangemeld voor deze activiteit');
    
    // Verify subscribe button changed to unsubscribe
    await expect(page.locator('button:has-text("Afmelden")').first()).toBeVisible();
    
    // Close modal
    await page.locator('.modal-close').click();
    await expect(page.locator('.modal-overlay')).not.toBeVisible();

    // Verify subscription by turning "Mijn Schema" back on
    await mijnSchemaToggle.click();
    await expect(page.locator('.simple-activity-item')).toHaveCount(1);
    await expect(page.locator('.simple-activity-title')).toContainText('Evening Campfire');
  });

  test('should handle switching between calendar and list views during subscription workflow', async ({ page }) => {
    await page.goto('/#activities-list');
    await expect(page.locator('.simple-activity-item')).toHaveCount(3);

    // Subscribe to an activity first
    await page.locator('.simple-activity-item').first().click();
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await page.locator('button:has-text("Aanmelden")').click();
    await expect(page.locator('.toast')).toContainText('Je bent aangemeld voor deze activiteit');
    await page.locator('.modal-close').click();

    // Turn on "Mijn Schema"
    const mijnSchemaToggle = page.locator('.toggle-container:has-text("Mijn Schema") .toggle-switch');
    await mijnSchemaToggle.click();
    await expect(page.locator('.simple-activity-item')).toHaveCount(1);

    // Switch to calendar view
    const calendarToggle = page.locator('.toggle-container:has-text("Kalender Weergave") .toggle-switch');
    await calendarToggle.click();
    
    // Verify calendar view is active with day sections
    await expect(page.locator('.day-section')).toHaveCount(1);
    await expect(page.locator('.activity-item')).toHaveCount(1);
    await expect(page.locator('.activity-title')).toContainText('Morning Yoga');
    
    // Activity should still be clickable in calendar view
    await page.locator('.activity-item').first().click();
    await expect(page.locator('.modal-overlay')).toBeVisible();
    
    // Unsubscribe in calendar view
    await page.locator('button:has-text("Afmelden")').click();
    await expect(page.locator('.toast')).toContainText('Je bent uitgeschreven voor deze activiteit');
    
    // Should show empty state in calendar view
    await expect(page.locator('.activity-item')).toHaveCount(0);
    await expect(page.locator('p')).toContainText('Geen activiteiten gevonden.');
  });

  test('should maintain filter states when subscribing/unsubscribing', async ({ page }) => {
    await page.goto('/#activities-list');
    await expect(page.locator('.simple-activity-item')).toHaveCount(3);

    // Turn on "Alleen Beschikbaar" filter first
    const beschikbaarToggle = page.locator('.toggle-container:has-text("Alleen Beschikbaar") .toggle-switch');
    await beschikbaarToggle.click();
    
    // All activities should still be shown (none subscribed yet)
    await expect(page.locator('.simple-activity-item')).toHaveCount(3);

    // Subscribe to first activity
    await page.locator('.simple-activity-item').first().click();
    await page.locator('button:has-text("Aanmelden")').click();
    await expect(page.locator('.toast')).toBeVisible();
    await page.locator('.modal-close').click();

    // Now "Alleen Beschikbaar" should hide the subscribed activity
    await expect(page.locator('.simple-activity-item')).toHaveCount(2);
    await expect(page.locator('.simple-activity-title')).not.toContainText('Morning Yoga');

    // Turn on "Mijn Schema" - should override other filters
    const mijnSchemaToggle = page.locator('.toggle-container:has-text("Mijn Schema") .toggle-switch');
    await mijnSchemaToggle.click();
    
    // "Alleen Beschikbaar" should be automatically turned off
    await expect(beschikbaarToggle).not.toHaveClass(/checked/);
    
    // Only subscribed activity should show
    await expect(page.locator('.simple-activity-item')).toHaveCount(1);
    await expect(page.locator('.simple-activity-title')).toContainText('Morning Yoga');
  });
});