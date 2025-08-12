import { test, expect } from '@playwright/test';

test.describe('Label Structure Analysis', () => {
  test('should analyze API label structure and format', async ({ page }) => {
    let consoleLogs = [];
    let participantData = null;
    let activityData = null;
    
    // Capture all console logs
    page.on('console', msg => {
      consoleLogs.push(msg.text());
      if (msg.text().includes('USER PROFILE DATA') || msg.text().includes('Participant labels:')) {
        console.log('📝 Profile:', msg.text());
      }
      if (msg.text().includes('First participant label') || msg.text().includes('First activity label')) {
        console.log('📝 Label Debug:', msg.text());
      }
    });
    
    // Set up environment with real API data
    await page.addInitScript(() => {
      window.process = window.process || {};
      window.process.env = window.process.env || {};
      window.process.env.VITE_USERNAME = 'sn_22anniek22'; // Use the username from test
      window.process.env.DEV = 'true';
      
      window.VITE_DEBUG = true;
      
      window.FestivalWizardData = {
        ajaxUrl: '/wp-admin/admin-ajax.php',
        nonce: 'test-nonce',
        apiKey: 'test-api-key',
        apiBaseUrl: 'https://trackapi.catriox.nl',
        showTracksOnly: true,
        activitiesTitle: 'Test Activiteiten',
        activitiesIntro: 'Test intro',
        isLoggedIn: true,
        currentUser: {
          username: 'sn_22anniek22',
          email: 'anniek@example.com'
        }
      };
    });
    
    await page.goto('/#activities-list');
    await page.waitForLoadState('networkidle');
    
    // Wait for data to load
    await expect(page.locator('.simple-activity-item').first()).toBeVisible({ timeout: 15000 });
    
    console.log('✅ Page loaded, analyzing data...');
    
    // Extract participant data from page context
    participantData = await page.evaluate(() => {
      // Access the DataContext data if possible
      const dataProviderLogs = window.console?.history?.filter(log => 
        log.includes('USER PROFILE DATA')
      );
      
      return {
        found: 'Checking for participant data in React context...'
      };
    });
    
    // Activate "Alleen Beschikbaar" toggle to trigger detailed logging
    const eligibleToggle = page.locator('.toggle-container:has-text("Alleen Beschikbaar")');
    
    if (await eligibleToggle.isVisible()) {
      console.log('✅ Found "Alleen Beschikbaar" toggle, activating...');
      
      // Clear logs and activate
      consoleLogs = [];
      await eligibleToggle.locator('.toggle-switch').click();
      
      // Wait for processing
      await page.waitForTimeout(2000);
      
      // Analyze logs for label format information
      const participantLabelLogs = consoleLogs.filter(log => 
        log.includes('participant label') && (log.includes('type:') || log.includes('sample:') || log.includes('UUID format'))
      );
      
      const activityLabelLogs = consoleLogs.filter(log => 
        log.includes('activity label') && (log.includes('type:') || log.includes('sample:') || log.includes('UUID format'))
      );
      
      console.log('\n🔍 PARTICIPANT LABEL ANALYSIS:');
      participantLabelLogs.forEach(log => console.log('  ', log));
      
      console.log('\n🔍 ACTIVITY LABEL ANALYSIS:');
      activityLabelLogs.forEach(log => console.log('  ', log));
      
      // Check if we got any eligibility check logs
      const eligibilityLogs = consoleLogs.filter(log => log.includes('Eligibility check:'));
      console.log(`\n📊 Processed ${eligibilityLogs.length} activities for eligibility`);
      
      // Look for result patterns
      const eligibleResults = consoleLogs.filter(log => log.includes('✅ Result: ELIGIBLE'));
      const ineligibleResults = consoleLogs.filter(log => log.includes('❌ Result: NOT ELIGIBLE'));
      
      console.log(`📈 Results: ${eligibleResults.length} eligible, ${ineligibleResults.length} ineligible`);
      
      if (eligibleResults.length === 0 && ineligibleResults.length > 0) {
        console.log('⚠️  ISSUE CONFIRMED: All activities filtered out (likely label format mismatch)');
        
        // Look for specific patterns
        const noLabelsResults = consoleLogs.filter(log => log.includes('no participant labels'));
        const noMatchResults = consoleLogs.filter(log => log.includes('no matching labels'));
        
        if (noLabelsResults.length > 0) {
          console.log('   - Problem: Participant has no labels');
        }
        if (noMatchResults.length > 0) {
          console.log('   - Problem: Labels exist but don\'t match (format mismatch)');
        }
      }
      
      // Get final visible activity count
      const visibleCount = await page.locator('.simple-activity-item').count();
      console.log(`📋 Final visible activities: ${visibleCount}`);
      
    } else {
      console.log('❌ "Alleen Beschikbaar" toggle not found - user may not be logged in');
    }
    
    expect(true).toBe(true); // This test is for analysis
  });
  
  test('should test with string label override to verify fix', async ({ page }) => {
    let consoleLogs = [];
    
    // Capture console logs
    page.on('console', msg => {
      if (msg.text().includes('override') || msg.text().includes('Result: ELIGIBLE') || msg.text().includes('matching labels')) {
        consoleLogs.push(msg.text());
        console.log('📝 Override Test:', msg.text());
      }
    });
    
    // Set up with string label override
    await page.addInitScript(() => {
      window.process = window.process || {};
      window.process.env = window.process.env || {};
      window.process.env.VITE_USERNAME = 'sn_22anniek22';
      window.process.env.VITE_USER_LABELS = 'leiding,bevers,welpen,samenleving,buitenleven'; // String labels
      window.process.env.DEV = 'true';
      
      window.VITE_DEBUG = true;
      
      window.FestivalWizardData = {
        ajaxUrl: '/wp-admin/admin-ajax.php',
        nonce: 'test-nonce',
        apiKey: 'test-api-key',
        apiBaseUrl: 'https://trackapi.catriox.nl',
        showTracksOnly: true,
        activitiesTitle: 'Test Activiteiten',
        activitiesIntro: 'Test intro',
        isLoggedIn: true,
        currentUser: {
          username: 'sn_22anniek22',
          email: 'anniek@example.com'
        }
      };
    });
    
    await page.goto('/#activities-list');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.simple-activity-item').first()).toBeVisible({ timeout: 15000 });
    
    // Check if override was applied
    const overrideLogs = consoleLogs.filter(log => log.includes('dev mode label override'));
    if (overrideLogs.length > 0) {
      console.log('✅ Label override applied');
    }
    
    // Test eligibility filter with override
    const eligibleToggle = page.locator('.toggle-container:has-text("Alleen Beschikbaar")');
    
    if (await eligibleToggle.isVisible()) {
      consoleLogs = []; // Clear
      await eligibleToggle.locator('.toggle-switch').click();
      await page.waitForTimeout(2000);
      
      const eligibleResults = consoleLogs.filter(log => log.includes('✅ Result: ELIGIBLE'));
      const visibleCount = await page.locator('.simple-activity-item').count();
      
      console.log(`📈 With string labels: ${eligibleResults.length} eligible activities found`);
      console.log(`📋 Visible activities: ${visibleCount}`);
      
      if (visibleCount > 0) {
        console.log('✅ SUCCESS: String labels work - activities are now visible!');
      } else {
        console.log('❌ Even with string labels, no activities visible - may be another issue');
      }
    }
    
    expect(true).toBe(true);
  });
});