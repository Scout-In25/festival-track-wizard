#!/bin/bash
# Test script to verify login state visibility functionality

echo "🚀 Testing Login State Visibility"
echo "================================="

echo ""
echo "📋 Step 1: Testing LOGGED-OUT user state..."
echo "   (VITE_USERNAME is commented out in .env)"

# Test key logged-out scenarios
echo "   ✅ Testing status indicators are hidden..."
npx playwright test login-state-visibility.spec.js -g "should NOT show status indicators" --reporter=line --quiet || echo "❌ FAILED"

echo "   ✅ Testing Mijn Schema toggle is hidden..."
npx playwright test login-state-visibility.spec.js -g "should NOT show.*Mijn Schema.*toggle" --reporter=line --quiet || echo "❌ FAILED"

echo "   ✅ Testing only Calendar toggle is visible..."
npx playwright test login-state-visibility.spec.js -g "should ONLY show.*Kalender Weergave" --reporter=line --quiet || echo "❌ FAILED"

echo ""
echo "📋 Step 2: Switching to LOGGED-IN user state..."
echo "   (Enabling VITE_USERNAME in .env)"

# Enable VITE_USERNAME
sed -i.bak 's/# VITE_USERNAME=timo/VITE_USERNAME=timo/' .env

echo "   Waiting 5 seconds for dev server to reload..."
sleep 5

echo "   ✅ Testing status indicators are visible..."
npx playwright test login-state-visibility.spec.js -g "should SHOW status indicators" --reporter=line --quiet || echo "❌ FAILED"

echo "   ✅ Testing all toggles are visible..."
npx playwright test login-state-visibility.spec.js -g "should show all three toggles" --reporter=line --quiet || echo "❌ FAILED"

echo ""
echo "📋 Step 3: Restoring LOGGED-OUT state for normal development..."
echo "   (Commenting out VITE_USERNAME again)"

# Restore commented state
sed -i.bak 's/VITE_USERNAME=timo/# VITE_USERNAME=timo/' .env

echo ""
echo "🎉 Login state visibility tests completed!"
echo "   The tests demonstrate that UI elements correctly show/hide based on login status"
echo ""
echo "Manual testing:"
echo "   - Uncomment VITE_USERNAME in .env to see logged-in UI"  
echo "   - Comment out VITE_USERNAME in .env to see logged-out UI"
echo "   - Refresh browser to see changes"