import React from 'react'
import ReactDOM from 'react-dom/client'
import Wizard from './Wizard.jsx';
import TrackPage from './TrackPage.jsx';
import ActivitiesListPage from './ActivitiesListPage.jsx';

if (import.meta.env.DEV) {
  import('./dev-only.css');
  document.body.classList.add('elementor-kit-205');
}

import './index.css';
import './styles.scss';

function App() {
  // Check if show_tracks_only is enabled
  const getShowTracksOnly = React.useCallback(() => {
    // Check for test override first (for E2E tests)
    if (typeof window !== 'undefined' && window.FestivalWizardData && window.FestivalWizardData.hasOwnProperty('showTracksOnly')) {
      return Boolean(window.FestivalWizardData.showTracksOnly);
    }
    // In development, check environment variable
    if (import.meta.env.DEV && import.meta.env.VITE_SHOW_TRACKS_ONLY !== undefined) {
      return import.meta.env.VITE_SHOW_TRACKS_ONLY === 'true';
    }
    // In production, check WordPress setting
    if (typeof window !== 'undefined' && window.FestivalWizardData) {
      return Boolean(window.FestivalWizardData.showTracksOnly);
    }
    return false;
  }, []);

  // Determine default page based on configuration and dev auth mode
  const getDefaultPage = React.useCallback(() => {
    const showTracksOnly = getShowTracksOnly();
    
    if (showTracksOnly) {
      return 'activities-list';
    }
    
    if (import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_MODE) {
      const authMode = import.meta.env.VITE_DEV_AUTH_MODE;
      if (authMode === 'not_logged_in') {
        return 'track';
      } else if (authMode === 'logged_in') {
        return 'wizard';
      }
    }
    return 'wizard'; // Default fallback
  }, [getShowTracksOnly]);

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
  switch (currentPage) {
    case 'track':
      ComponentToRender = TrackPage;
      break;
    case 'activities-list':
      ComponentToRender = ActivitiesListPage;
      break;
    case 'wizard':
    default:
      ComponentToRender = Wizard;
      break;
  }

  return (
    <React.StrictMode>
      <ComponentToRender class="FTW" />
    </React.StrictMode>
  );
}

const rootElement = document.getElementById('festival-track-wizard-root');
rootElement.classList.add('FTW');
ReactDOM.createRoot(rootElement).render(
  <App />
);
