import { test, expect } from '@playwright/test';

test.describe('Deep Eligibility Debug', () => {
  test('should deeply analyze why activities are filtered out', async ({ page }) => {
    let eligibleResults = [];
    let ineligibleResults = [];
    let activityDetails = [];
    
    // Capture console logs with detailed analysis
    page.on('console', msg => {
      const text = msg.text();
      
      if (text.includes('✅ Result: ELIGIBLE')) {
        eligibleResults.push(text);
        console.log('✅ ELIGIBLE:', text);
      } else if (text.includes('❌ Result: NOT ELIGIBLE')) {
        ineligibleResults.push(text);
        // Don't log every single one to avoid spam, just count them
      } else if (text.includes('🔍 Activity requires:')) {
        activityDetails.push(text);
      } else if (text.includes('Eligibility filter result:')) {
        console.log('📊 FILTER RESULT:', text);
      }
    });
    
    // Set up environment
    await page.addInitScript(() => {
      window.process = window.process || {};
      window.process.env = window.process.env || {};
      window.process.env.VITE_USERNAME = 'sn_22anniek22';
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
    
    // Get initial count before filter
    const initialCount = await page.locator('.simple-activity-item').count();
    console.log(`📋 Initial activity count: ${initialCount}`);
    
    // Wait for activities to load
    await expect(page.locator('.simple-activity-item').first()).toBeVisible({ timeout: 15000 });
    
    // Activate eligibility filter
    const eligibleToggle = page.locator('.toggle-container:has-text("Alleen Beschikbaar")');
    
    if (await eligibleToggle.isVisible()) {
      console.log('🎯 Activating "Alleen Beschikbaar" filter...');
      
      // Clear results
      eligibleResults = [];
      ineligibleResults = [];
      activityDetails = [];
      
      await eligibleToggle.locator('.toggle-switch').click();
      
      // Wait for processing
      await page.waitForTimeout(3000);
      
      // Get final count
      const finalCount = await page.locator('.simple-activity-item').count();
      console.log(`📋 Final activity count: ${finalCount}`);
      
      console.log(`\n📊 SUMMARY:`);
      console.log(`   Total eligible activities: ${eligibleResults.length}`);
      console.log(`   Total ineligible activities: ${ineligibleResults.length}`);
      console.log(`   Activities visible in UI: ${finalCount}`);
      
      if (eligibleResults.length > 0) {
        console.log('\n✅ ELIGIBLE ACTIVITIES:');
        eligibleResults.forEach((result, index) => {
          console.log(`   ${index + 1}. ${result}`);
        });
      } else {
        console.log('\n❌ NO ELIGIBLE ACTIVITIES FOUND');
        
        // Show a sample of ineligible activities for analysis
        console.log('\n📝 Sample ineligible activities (first 3):');
        ineligibleResults.slice(0, 3).forEach((result, index) => {
          console.log(`   ${index + 1}. ${result}`);
        });
        
        // Show some activity label requirements
        console.log('\n🏷️ Sample activity label requirements:');
        activityDetails.slice(0, 5).forEach(detail => {
          console.log(`   ${detail}`);
        });
      }
      
      // Additional debugging - check if filter is actually working
      if (finalCount !== initialCount) {
        console.log('\n✅ Filter IS working (activity count changed)');
      } else {
        console.log('\n⚠️ Filter may NOT be working (activity count unchanged)');
      }
      
      // Check if there's a mismatch between eligible count and visible count
      if (eligibleResults.length > 0 && finalCount === 0) {
        console.log('\n🚨 BUG DETECTED: Activities are eligible but none are visible in UI!');
        console.log('   This suggests an issue in the filtering pipeline after eligibility check.');
      } else if (eligibleResults.length === 0 && finalCount > 0) {
        console.log('\n🚨 BUG DETECTED: No activities eligible but some are visible in UI!');
        console.log('   This suggests the eligibility filter is not being applied properly.');
      } else if (eligibleResults.length === finalCount) {
        console.log('\n✅ SUCCESS: Eligible count matches visible count - filter working correctly!');
      }
      
    } else {
      console.log('❌ "Alleen Beschikbaar" toggle not found');
    }
    
    expect(true).toBe(true); // This test is for debugging
  });
});