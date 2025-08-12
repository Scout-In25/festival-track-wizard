import { test, expect } from '@playwright/test';

test.describe('Wizard Label-Based Routing', () => {
  
  test.describe('Scenario 1: New user without participant profile', () => {
    test('should show wizard for logged-in user without participant', async ({ page }) => {
      await page.addInitScript(() => {
        // Mock WordPress logged-in user without participant profile
        window.FestivalWizardData = {
          ajaxUrl: '/wp-admin/admin-ajax.php',
          nonce: 'test-nonce',
          apiKey: 'test-api-key',
          apiBaseUrl: 'https://trackapi.catriox.nl',
          displayMode: 'wizard-simple',
          isLoggedIn: true,
          currentUser: {
            username: 'newuser',
            email: 'newuser@example.com',
            firstName: 'New',
            lastName: 'User',
            displayName: 'New User',
            ticket_type: 'standard'
          }
        };
        
        // Mock API response for user profile (no participant)
        window.mockApiResponses = {
          '/wp-admin/admin-ajax.php': {
            'action=festival_participant_profile': {
              success: true,
              data: {
                participant: null,
                wordpress_user: {
                  username: 'newuser',
                  email: 'newuser@example.com',
                  first_name: 'New',
                  last_name: 'User',
                  display_name: 'New User'
                }
              }
            }
          }
        };
      });

      // Navigate to the page
      await page.goto('/');
      
      // Wait for DataProvider to load
      await page.waitForTimeout(1000);
      
      // Should show wizard
      await expect(page.locator('h1')).toContainText(['Welkom bij de Scout-In Festival Track Wizard', 'Welke rol']);
      
      // Should not show activities list
      const activitiesTitle = page.locator('text=Scout-in Activiteiten');
      await expect(activitiesTitle).not.toBeVisible();
    });

    test('should redirect to activities after completing wizard', async ({ page }) => {
      await page.addInitScript(() => {
        window.FestivalWizardData = {
          ajaxUrl: '/wp-admin/admin-ajax.php',
          nonce: 'test-nonce',
          apiKey: 'test-api-key',
          apiBaseUrl: 'https://trackapi.catriox.nl',
          displayMode: 'wizard-simple',
          isLoggedIn: true,
          currentUser: {
            username: 'newuser',
            email: 'newuser@example.com',
            firstName: 'New',
            lastName: 'User',
            displayName: 'New User',
            ticket_type: 'standard'
          }
        };
      });

      await page.goto('/');
      
      // Wait for wizard to load
      await expect(page.locator('h1')).toContainText(['Welkom bij de Scout-In Festival Track Wizard', 'Welke rol']);
      
      // Complete the wizard (simplified for testing)
      // This would normally involve filling out the form
      // For testing, we'll mock the completion
      
      await page.evaluate(() => {
        // Mock successful participant creation
        window.mockParticipantCreated = true;
        window.mockParticipant = {
          id: 'test-id',
          username: 'newuser',
          labels: ['leiding', 'bevers'],
          activities: []
        };
      });
      
      // Trigger a re-render with the new participant data
      await page.evaluate(() => {
        // Simulate profile refresh after wizard completion
        window.dispatchEvent(new CustomEvent('profileUpdated', {
          detail: { participant: window.mockParticipant }
        }));
      });
      
      // Should now show activities list
      await expect(page.locator('h1')).toContainText('Scout-in Activiteiten', { timeout: 5000 });
    });
  });

  test.describe('Scenario 2: User with participant but no labels', () => {
    test('should show wizard for user with empty labels', async ({ page }) => {
      await page.addInitScript(() => {
        window.FestivalWizardData = {
          ajaxUrl: '/wp-admin/admin-ajax.php',
          nonce: 'test-nonce',
          apiKey: 'test-api-key',
          apiBaseUrl: 'https://trackapi.catriox.nl',
          displayMode: 'wizard-simple',
          isLoggedIn: true,
          currentUser: {
            username: 'existinguser',
            email: 'existing@example.com',
            firstName: 'Existing',
            lastName: 'User',
            displayName: 'Existing User',
            ticket_type: 'standard'
          }
        };
        
        // Mock participant with no labels
        window.mockApiResponses = {
          '/wp-admin/admin-ajax.php': {
            'action=festival_participant_profile': {
              success: true,
              data: {
                participant: {
                  id: 'existing-id',
                  username: 'existinguser',
                  labels: [], // Empty labels
                  activities: []
                },
                wordpress_user: {
                  username: 'existinguser',
                  email: 'existing@example.com',
                  first_name: 'Existing',
                  last_name: 'User',
                  display_name: 'Existing User'
                }
              }
            }
          }
        };
      });

      await page.goto('/');
      await page.waitForTimeout(1000);
      
      // Should show wizard because labels are empty
      await expect(page.locator('h1')).toContainText(['Welkom bij de Scout-In Festival Track Wizard', 'Welke rol']);
    });
  });

  test.describe('Scenario 3: User with labels (completed wizard)', () => {
    test('should show activities list directly for user with labels', async ({ page }) => {
      await page.addInitScript(() => {
        window.FestivalWizardData = {
          ajaxUrl: '/wp-admin/admin-ajax.php',
          nonce: 'test-nonce',
          apiKey: 'test-api-key',
          apiBaseUrl: 'https://trackapi.catriox.nl',
          displayMode: 'wizard-simple',
          isLoggedIn: true,
          currentUser: {
            username: 'completeduser',
            email: 'completed@example.com',
            firstName: 'Completed',
            lastName: 'User',
            displayName: 'Completed User',
            ticket_type: 'standard'
          }
        };
        
        // Mock participant with labels
        window.mockApiResponses = {
          '/wp-admin/admin-ajax.php': {
            'action=festival_participant_profile': {
              success: true,
              data: {
                participant: {
                  id: 'completed-id',
                  username: 'completeduser',
                  labels: ['leiding', 'bevers', 'ervaren'], // Has labels
                  activities: []
                },
                wordpress_user: {
                  username: 'completeduser',
                  email: 'completed@example.com',
                  first_name: 'Completed',
                  last_name: 'User',
                  display_name: 'Completed User'
                }
              }
            }
          }
        };
      });

      await page.goto('/');
      await page.waitForTimeout(1000);
      
      // Should show activities list directly
      await expect(page.locator('h1')).toContainText('Scout-in Activiteiten');
      
      // Should not show wizard
      const wizardTitle = page.locator('text=Welkom bij de Scout-In Festival Track Wizard');
      await expect(wizardTitle).not.toBeVisible();
    });
  });

  test.describe('Scenario 4: Not logged in user', () => {
    test('should show activities list in read-only mode', async ({ page }) => {
      await page.addInitScript(() => {
        window.FestivalWizardData = {
          ajaxUrl: '/wp-admin/admin-ajax.php',
          nonce: 'test-nonce',
          apiKey: 'test-api-key',
          apiBaseUrl: 'https://trackapi.catriox.nl',
          displayMode: 'wizard-simple',
          isLoggedIn: false, // Not logged in
          currentUser: null
        };
      });

      await page.goto('/');
      await page.waitForTimeout(1000);
      
      // Should show activities list
      await expect(page.locator('h1')).toContainText('Scout-in Activiteiten');
      
      // Should not show wizard
      const wizardTitle = page.locator('text=Welkom bij de Scout-In Festival Track Wizard');
      await expect(wizardTitle).not.toBeVisible();
      
      // Should not show user-specific features (subscription buttons, status indicators)
      const subscribeButtons = page.locator('button:has-text("Aanmelden")');
      await expect(subscribeButtons).toHaveCount(0);
    });
  });

  test.describe('Display Mode: simple-readonly', () => {
    test('should always show activities regardless of login status', async ({ page }) => {
      await page.addInitScript(() => {
        window.FestivalWizardData = {
          ajaxUrl: '/wp-admin/admin-ajax.php',
          nonce: 'test-nonce',
          apiKey: 'test-api-key',
          apiBaseUrl: 'https://trackapi.catriox.nl',
          displayMode: 'simple-readonly', // Read-only mode
          isLoggedIn: true, // Even when logged in
          currentUser: {
            username: 'testuser',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            displayName: 'Test User',
            ticket_type: 'standard'
          }
        };
      });

      await page.goto('/');
      await page.waitForTimeout(1000);
      
      // Should show activities list even when logged in
      await expect(page.locator('h1')).toContainText('Scout-in Activiteiten');
      
      // Should not show wizard
      const wizardTitle = page.locator('text=Welkom bij de Scout-In Festival Track Wizard');
      await expect(wizardTitle).not.toBeVisible();
      
      // Should not show user-specific features
      const subscribeButtons = page.locator('button:has-text("Aanmelden")');
      await expect(subscribeButtons).toHaveCount(0);
    });
  });
});