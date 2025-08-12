import React from 'react'
import ReactDOM from 'react-dom/client'
import Wizard from './Wizard.jsx';
import TrackPage from './TrackPage.jsx';
import ActivitiesListPage from './ActivitiesListPage.jsx';
import AppRouter from './AppRouter.jsx';
import { DataProvider } from './contexts/DataProvider.jsx';
import { ToastProvider } from './contexts/ToastProvider.jsx';

if (import.meta.env.DEV) {
  import('./dev-only.css');
  document.body.classList.add('elementor-kit-205');
  
  // Setup development environment data
  if (!window.FestivalWizardData) {
    window.FestivalWizardData = {
      ajaxUrl: '/wp-admin/admin-ajax.php',
      nonce: 'dev-nonce',
      apiKey: import.meta.env.VITE_API_KEY || 'dev-api-key',
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://trackapi.catriox.nl',
      displayMode: 'wizard-simple', // Use wizard-simple mode in development
      // Login state in dev mode:
      // - Set VITE_USERNAME to test with real user data (logged in)
      // - Leave unset to test logged-out state (shows activities read-only)
      isLoggedIn: !!import.meta.env.VITE_USERNAME,
      currentUser: {
        username: import.meta.env.VITE_USERNAME || 'dev-user',
        email: import.meta.env.VITE_USER_EMAIL || 'dev@example.com',
        firstName: import.meta.env.VITE_USER_FIRST_NAME || 'Dev',
        lastName: import.meta.env.VITE_USER_LAST_NAME || 'User',
        displayName: import.meta.env.VITE_USER_DISPLAY_NAME || 'Dev User',
        ticket_type: import.meta.env.VITE_USER_TICKET_TYPE || 'standard'
      },
      activitiesTitle: 'Scout-in Activiteiten',
      activitiesIntro: 'Development mode activities intro'
    };
  }
  
  // Enable debug mode for development
  window.VITE_DEBUG = true;
  
  // Disable mock participant profile to use real API data
  // This ensures we fetch actual user data with real subscriptions and tracks
  // Comment out or set to false to use real API data instead of mock data
  const USE_MOCK_DATA = false; // Set to true to use mock data for testing empty labels
  
  if (USE_MOCK_DATA && !window.mockDevUserProfile) {
    const username = import.meta.env.VITE_USERNAME || 'dev-user';
    const email = import.meta.env.VITE_USER_EMAIL || 'dev@example.com';
    const firstName = import.meta.env.VITE_USER_FIRST_NAME || 'Dev';
    const lastName = import.meta.env.VITE_USER_LAST_NAME || 'User';
    const displayName = import.meta.env.VITE_USER_DISPLAY_NAME || 'Dev User';
    const ticketType = import.meta.env.VITE_USER_TICKET_TYPE || 'standard';
    
    window.mockDevUserProfile = {
      participant: {
        id: `${username}-participant-id`,
        username: username,
        first_name: firstName,
        last_name: lastName,
        email: email,
        track_id: null,
        ticket_type: ticketType,
        labels: ["leiding","bestuur","praktijkbegeleider","bevers","welpen","veilig_gezond","samenleving","buitenleven","insignes","groepsontwikkeling","primitieve_scoutingtechnieken","materiaalbeheer","gemiddeld"], // Mock labels for development
        track: null,
        activities: [],
        reviews: []
      },
      wordpress_user: {
        username: username,
        email: email,
        first_name: firstName,
        last_name: lastName,
        display_name: displayName
      }
    };
  }
}

import './index.css';
import './styles.scss';

function App() {
  // Get display mode from WordPress data
  const getDisplayMode = React.useCallback(() => {
    if (typeof window !== 'undefined' && window.FestivalWizardData && window.FestivalWizardData.displayMode) {
      return window.FestivalWizardData.displayMode;
    }
    // Fallback to old showTracksOnly logic for backward compatibility
    if (typeof window !== 'undefined' && window.FestivalWizardData && window.FestivalWizardData.showTracksOnly) {
      return 'simple-readonly';
    }
    return 'full';
  }, []);

  // Determine default page based on display mode
  const getDefaultPage = React.useCallback(() => {
    const displayMode = getDisplayMode();
    
    // For wizard-simple mode, return 'smart-route' to trigger AppRouter
    if (displayMode === 'wizard-simple') {
      return 'smart-route';
    }
    
    // For simple-readonly, always show activities
    if (displayMode === 'simple-readonly') {
      return 'activities-list';
    }
    
    // In development, default to smart routing as well
    if (import.meta.env.DEV) {
      return 'smart-route';
    }
    
    return 'smart-route'; // Default to smart routing
  }, [getDisplayMode]);

  const [currentPage, setCurrentPage] = React.useState(() => {
    return window.location.hash.substring(1) || getDefaultPage();
  });

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      setCurrentPage(hash || getDefaultPage());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [getDefaultPage]);

  let ComponentToRender;
  const displayMode = getDisplayMode();
  
  
  // Handle routing based on current page
  switch (currentPage) {
    case 'track':
      ComponentToRender = TrackPage;
      break;
    case 'activities-list':
      ComponentToRender = ActivitiesListPage;
      break;
    case 'wizard':
      ComponentToRender = Wizard;
      break;
    case 'smart-route':
      // Use AppRouter for smart routing based on labels
      ComponentToRender = AppRouter;
      break;
    default:
      // Default fallback based on display mode
      if (displayMode === 'simple-readonly') {
        ComponentToRender = ActivitiesListPage;
      } else if (displayMode === 'wizard-simple') {
        ComponentToRender = AppRouter;
      } else {
        ComponentToRender = AppRouter; // Default to smart routing
      }
      break;
  }

  // WordPress-safe render (avoid StrictMode in WordPress environment)
  const isWordPressEnv = typeof window !== 'undefined' && (window.wp || window.ajaxurl || window.wpApiSettings);
  
  const AppContent = (
    <ToastProvider>
      <DataProvider>
        <ComponentToRender className="FTW" />
      </DataProvider>
    </ToastProvider>
  );

  return isWordPressEnv ? AppContent : (
    <React.StrictMode>
      {AppContent}
    </React.StrictMode>
  );
}


// WordPress-safe initialization
const initializeApp = () => {
  const rootElement = document.getElementById('festival-track-wizard-root');
  if (!rootElement) {
    console.error('Scout-In25 : Root element not found');
    return;
  }

  try {
    rootElement.classList.add('FTW');
    
    // Use createRoot safely
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
  } catch (error) {
    console.error('Scout-In25 : Initialization failed', error);
    
    // Fallback for older React versions or WordPress conflicts
    try {
      ReactDOM.render(<App />, rootElement);
      console.log('Scout-In25 : App initialized with legacy render');
    } catch (fallbackError) {
      console.error('Scout-In25 : Fallback initialization also failed', fallbackError);
    }
  }
};

// Initialize when DOM is ready and WordPress dependencies are available
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM already loaded, but wait a tick for WordPress to finish loading
  setTimeout(initializeApp, 0);
}
