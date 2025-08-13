import React from 'react';
import { useDataContext } from './contexts/DataProvider';
import Wizard from './Wizard';
import ActivitiesListPage from './ActivitiesListPage';
import Admin from './Admin';
import Statistics from './Statistics';

/**
 * AppRouter Component
 * 
 * Smart routing component that determines whether to show the Wizard, Activities List, or Admin panel
 * based on user authentication status, display mode, and whether they have completed the wizard (have labels).
 * 
 * Routing Logic:
 * - Admin mode with proper auth → Admin panel
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

  // Check display mode
  const displayMode = window.FestivalWizardData?.displayMode;
  const isAdmin = window.FestivalWizardData?.isAdmin;

  // If in admin mode and user has admin rights, show admin panel
  if (displayMode === 'admin' && isAdmin) {
    return <Admin />;
  }

  // If in statistics mode, show statistics panel
  if (displayMode === 'statistics') {
    return <Statistics />;
  }

  // In dev mode, check for statistics route
  if (import.meta.env.DEV && window.location.pathname === '/statistics') {
    return <Statistics />;
  }

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