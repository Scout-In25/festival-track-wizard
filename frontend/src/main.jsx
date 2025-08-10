import React from 'react'
import ReactDOM from 'react-dom/client'
import Wizard from './Wizard.jsx';
import TrackPage from './TrackPage.jsx';
import ActivitiesListPage from './ActivitiesListPage.jsx';
import { DataProvider } from './contexts/DataProvider.jsx';
import { ToastProvider } from './contexts/ToastProvider.jsx';

if (import.meta.env.DEV) {
  import('./dev-only.css');
  document.body.classList.add('elementor-kit-205');
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
    
    // Both simple modes should show activities list
    if (displayMode === 'wizard-simple' || displayMode === 'simple-readonly') {
      return 'activities-list';
    }
    
    // In development, default to activities-list as well (matching production behavior)
    if (import.meta.env.DEV) {
      return 'activities-list';
    }
    
    return 'activities-list'; // Default to activities list in all cases
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
      <ToastProvider>
        <DataProvider>
          <ComponentToRender class="FTW" />
        </DataProvider>
      </ToastProvider>
    </React.StrictMode>
  );
}

const rootElement = document.getElementById('festival-track-wizard-root');
rootElement.classList.add('FTW');
ReactDOM.createRoot(rootElement).render(
  <App />
);
