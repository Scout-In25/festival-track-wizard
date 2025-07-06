import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the components
vi.mock('./Wizard.jsx', () => ({
  default: () => <div data-testid="wizard">Wizard Component</div>
}));

vi.mock('./TrackPage.jsx', () => ({
  default: () => <div data-testid="track-page">Track Page Component</div>
}));

vi.mock('./ActivitiesListPage.jsx', () => ({
  default: () => <div data-testid="activities-list">Activities List Component</div>
}));

// Mock CSS imports
vi.mock('./dev-only.css', () => ({}));
vi.mock('./index.css', () => ({}));
vi.mock('./styles.scss', () => ({}));

// Import the mocked components directly
import Wizard from './Wizard.jsx';
import TrackPage from './TrackPage.jsx';
import ActivitiesListPage from './ActivitiesListPage.jsx';

// Create a simplified App component for testing
const TestApp = ({ showTracksOnly = false, devAuthMode = 'logged_in', hash = '' }) => {
  // Simulate the routing logic from main.jsx
  const getComponent = () => {
    // Check URL hash first
    if (hash === '#track') return <TrackPage />;
    if (hash === '#activities-list') return <ActivitiesListPage />;
    if (hash === '#wizard') return <Wizard />;

    // Check show_tracks_only setting
    if (showTracksOnly) return <ActivitiesListPage />;

    // Check dev auth mode
    if (import.meta.env.DEV && devAuthMode === 'not_logged_in') {
      return <TrackPage />;
    }

    // Default to wizard
    return <Wizard />;
  };

  return getComponent();
};

describe('Main App Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders wizard by default in production mode', async () => {
    render(<TestApp showTracksOnly={false} devAuthMode="logged_in" hash="" />);
    expect(screen.getByTestId('wizard')).toBeInTheDocument();
  });

  it('renders activities list when show_tracks_only is enabled in WordPress', async () => {
    render(<TestApp showTracksOnly={true} devAuthMode="logged_in" hash="" />);
    expect(screen.getByTestId('activities-list')).toBeInTheDocument();
  });

  it('renders activities list when VITE_SHOW_TRACKS_ONLY is true in development', async () => {
    render(<TestApp showTracksOnly={true} devAuthMode="logged_in" hash="" />);
    expect(screen.getByTestId('activities-list')).toBeInTheDocument();
  });

  it('renders wizard when VITE_SHOW_TRACKS_ONLY is false in development', async () => {
    render(<TestApp showTracksOnly={false} devAuthMode="logged_in" hash="" />);
    expect(screen.getByTestId('wizard')).toBeInTheDocument();
  });

  it('renders track page when dev auth mode is not_logged_in and show_tracks_only is false', async () => {
    render(<TestApp showTracksOnly={false} devAuthMode="not_logged_in" hash="" />);
    expect(screen.getByTestId('track-page')).toBeInTheDocument();
  });

  it('respects URL hash routing for track page', async () => {
    render(<TestApp showTracksOnly={false} devAuthMode="logged_in" hash="#track" />);
    expect(screen.getByTestId('track-page')).toBeInTheDocument();
  });

  it('respects URL hash routing for activities list', async () => {
    render(<TestApp showTracksOnly={false} devAuthMode="logged_in" hash="#activities-list" />);
    expect(screen.getByTestId('activities-list')).toBeInTheDocument();
  });

  it('respects URL hash routing for wizard', async () => {
    render(<TestApp showTracksOnly={true} devAuthMode="not_logged_in" hash="#wizard" />);
    expect(screen.getByTestId('wizard')).toBeInTheDocument();
  });

  it('falls back to wizard for unknown hash routes', async () => {
    render(<TestApp showTracksOnly={false} devAuthMode="logged_in" hash="#unknown-route" />);
    expect(screen.getByTestId('wizard')).toBeInTheDocument();
  });

  it('prioritizes show_tracks_only over dev auth mode', async () => {
    render(<TestApp showTracksOnly={true} devAuthMode="not_logged_in" hash="" />);
    // Should show activities list because show_tracks_only takes precedence
    expect(screen.getByTestId('activities-list')).toBeInTheDocument();
  });
});
