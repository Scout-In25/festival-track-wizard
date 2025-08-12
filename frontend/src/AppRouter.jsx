import React from 'react';
import { useDataContext } from './contexts/DataProvider';
import Wizard from './Wizard';
import ActivitiesListPage from './ActivitiesListPage';

/**
 * AppRouter Component
 * 
 * Smart routing component that determines whether to show the Wizard or Activities List
 * based on user authentication status and whether they have completed the wizard (have labels).
 * 
 * Routing Logic:
 * - Not logged in → Activities List (read-only view)
 * - Logged in, no participant profile → Wizard
 * - Logged in, participant without labels → Wizard  
 * - Logged in, participant with labels → Activities List
 */
const AppRouter = () => {
  const { 
    isUserLoggedIn, 
    participant, 
    userProfileLoading,
    userProfileError,
    hasCompletedWizard 
  } = useDataContext();


  // Show loading state while fetching user profile
  if (isUserLoggedIn && userProfileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Gegevens laden...</p>
        </div>
      </div>
    );
  }

  // Not logged in - show activities list in read-only mode
  if (!isUserLoggedIn) {
    return <ActivitiesListPage />;
  }

  // Logged in user routing based on wizard completion
  // User has completed wizard (has labels) - show activities list
  if (hasCompletedWizard) {
    return <ActivitiesListPage />;
  }

  // User needs to complete wizard when:
  // - No participant profile exists, OR
  // - Participant exists but labels is undefined, null, or empty array
  return <Wizard />;
};

export default AppRouter;