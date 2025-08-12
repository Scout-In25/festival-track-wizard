import { test, expect } from '@playwright/test';

test.describe('Debug Activities Loading', () => {
  test('debug activities loading issue', async ({ page }) => {
    // Set up comprehensive logging
    page.on('console', msg => {
      console.log('Browser:', msg.text());
    });
    
    page.on('request', request => {
      console.log('Request:', request.method(), request.url());
    });
    
    page.on('response', response => {
      console.log('Response:', response.status(), response.url());
    });

    // Simple mock data
    const mockActivities = [
      {
        id: '1',
        name: 'Test Activity',
        description: 'Test',
        type: 'workshop',
        start_time: '2025-07-15T09:00:00Z',
        end_time: '2025-07-15T10:30:00Z',
        location: 'Room A',
        capacity: 20,
        current_subscriptions: 5,
        metadata: {}
      }
    ];

    // Mock ALL requests
    await page.route('**/*', async route => {
      const url = route.request().url();
      
      // Handle activities endpoint
      if (url.includes('/api/activities/all')) {
        console.log('✅ Mocking activities/all');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: mockActivities })
        });
      }
      // Handle participant endpoint
      else if (url.includes('/api/participants/')) {
        console.log('✅ Mocking participants');
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
              activities: []
            }
          })
        });
      }
      // Handle tracks endpoint
      else if (url.includes('/api/tracks/all')) {
        console.log('✅ Mocking tracks');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] })
        });
      }
      // Handle WordPress AJAX
      else if (url.includes('wp-admin/admin-ajax.php')) {
        console.log('✅ Mocking WordPress AJAX');
        const formData = await route.request().postData();
        
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
      }
      // Continue with all other requests
      else {
        await route.continue();
      }
    });

    // Set up page environment
    await page.addInitScript(() => {
      window.FestivalWizardData = {
        showTracksOnly: true,
        apiKey: 'test-key',
        apiBaseUrl: 'https://test.example.com',
        ajaxUrl: '/wp-admin/admin-ajax.php',
        nonce: 'test-nonce-123',
        activitiesTitle: 'Festival Activiteiten',
        activitiesIntro: 'Test intro',
        currentUser: {
          username: 'timo',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          displayName: 'Test User'
        }
      };
      
      Object.defineProperty(window, 'import', {
        value: {
          meta: {
            env: {
              DEV: true,
              VITE_API_KEY: 'test-key',
              VITE_API_BASE_URL: 'https://test.example.com',
              VITE_USERNAME: 'timo'
            }
          }
        }
      });
    });

    // Navigate to base URL (will redirect to activities list due to showTracksOnly)
    await page.goto('/');
    await page.waitForTimeout(5000);
    
    // Check what's on the page
    const bodyText = await page.locator('body').textContent();
    console.log('Page body includes:', {
      loading: bodyText.includes('Activiteiten laden'),
      noActivities: bodyText.includes('Geen activiteiten gevonden'),
      hasError: bodyText.includes('Fout bij het laden')
    });
    
    // Try to find any activity elements
    const simpleCount = await page.locator('.simple-activity-item').count();
    const calendarCount = await page.locator('.activity-item').count();
    console.log('Activity counts:', { simple: simpleCount, calendar: calendarCount });
    
    // Check for any error messages
    const errorCount = await page.locator('.error-message').count();
    if (errorCount > 0) {
      const errorText = await page.locator('.error-message').textContent();
      console.log('Error message:', errorText);
    }
  });
});