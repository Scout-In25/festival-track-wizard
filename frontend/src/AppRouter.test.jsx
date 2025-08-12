import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AppRouter from './AppRouter';
import { useDataContext } from './contexts/DataProvider';

// Mock the DataProvider context
vi.mock('./contexts/DataProvider', () => ({
  useDataContext: vi.fn()
}));

// Mock the child components
vi.mock('./Wizard', () => ({
  default: () => <div data-testid="wizard">Wizard Component</div>
}));

vi.mock('./ActivitiesListPage', () => ({
  default: () => <div data-testid="activities-list">Activities List Component</div>
}));

describe('AppRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner when logged in and loading user profile', () => {
      useDataContext.mockReturnValue({
        isUserLoggedIn: true,
        userProfileLoading: true,
        participant: null,
        hasCompletedWizard: false,
        userProfileError: null
      });

      render(<AppRouter />);
      
      expect(screen.getByText('Gegevens laden...')).toBeInTheDocument();
      expect(screen.queryByTestId('wizard')).not.toBeInTheDocument();
      expect(screen.queryByTestId('activities-list')).not.toBeInTheDocument();
    });

    it('should not show loading spinner when not logged in', () => {
      useDataContext.mockReturnValue({
        isUserLoggedIn: false,
        userProfileLoading: true, // Loading but not logged in
        participant: null,
        hasCompletedWizard: false,
        userProfileError: null
      });

      render(<AppRouter />);
      
      expect(screen.queryByText('Gegevens laden...')).not.toBeInTheDocument();
      expect(screen.getByTestId('activities-list')).toBeInTheDocument();
    });
  });

  describe('Not Logged In', () => {
    it('should show activities list when user is not logged in', () => {
      useDataContext.mockReturnValue({
        isUserLoggedIn: false,
        userProfileLoading: false,
        participant: null,
        hasCompletedWizard: false,
        userProfileError: null
      });

      render(<AppRouter />);
      
      expect(screen.getByTestId('activities-list')).toBeInTheDocument();
      expect(screen.queryByTestId('wizard')).not.toBeInTheDocument();
    });
  });

  describe('Logged In - Wizard Completion', () => {
    it('should show wizard when user has no participant profile', () => {
      useDataContext.mockReturnValue({
        isUserLoggedIn: true,
        userProfileLoading: false,
        participant: null,
        hasCompletedWizard: false,
        userProfileError: null
      });

      render(<AppRouter />);
      
      expect(screen.getByTestId('wizard')).toBeInTheDocument();
      expect(screen.queryByTestId('activities-list')).not.toBeInTheDocument();
    });

    it('should show wizard when participant has empty labels array', () => {
      useDataContext.mockReturnValue({
        isUserLoggedIn: true,
        userProfileLoading: false,
        participant: {
          id: 'test-id',
          username: 'testuser',
          labels: [] // Empty labels array (like your example)
        },
        hasCompletedWizard: false,
        userProfileError: null
      });

      render(<AppRouter />);
      
      expect(screen.getByTestId('wizard')).toBeInTheDocument();
      expect(screen.queryByTestId('activities-list')).not.toBeInTheDocument();
    });

    it('should show wizard when participant labels is null', () => {
      useDataContext.mockReturnValue({
        isUserLoggedIn: true,
        userProfileLoading: false,
        participant: {
          id: 'test-id',
          username: 'testuser',
          labels: null // Null labels
        },
        hasCompletedWizard: false,
        userProfileError: null
      });

      render(<AppRouter />);
      
      expect(screen.getByTestId('wizard')).toBeInTheDocument();
      expect(screen.queryByTestId('activities-list')).not.toBeInTheDocument();
    });

    it('should show wizard when participant labels is undefined', () => {
      useDataContext.mockReturnValue({
        isUserLoggedIn: true,
        userProfileLoading: false,
        participant: {
          id: 'test-id',
          username: 'testuser',
          // labels is undefined (not present in the object)
        },
        hasCompletedWizard: false,
        userProfileError: null
      });

      render(<AppRouter />);
      
      expect(screen.getByTestId('wizard')).toBeInTheDocument();
      expect(screen.queryByTestId('activities-list')).not.toBeInTheDocument();
    });

    it('should show activities list when participant has labels', () => {
      useDataContext.mockReturnValue({
        isUserLoggedIn: true,
        userProfileLoading: false,
        participant: {
          id: 'test-id',
          username: 'testuser',
          labels: ['label1', 'label2'] // Has labels
        },
        hasCompletedWizard: true,
        userProfileError: null
      });

      render(<AppRouter />);
      
      expect(screen.getByTestId('activities-list')).toBeInTheDocument();
      expect(screen.queryByTestId('wizard')).not.toBeInTheDocument();
    });

    it('should show activities list when hasCompletedWizard is true', () => {
      useDataContext.mockReturnValue({
        isUserLoggedIn: true,
        userProfileLoading: false,
        participant: {
          id: 'test-id',
          username: 'testuser',
          labels: ['leiding', 'bevers'] 
        },
        hasCompletedWizard: true, // Explicitly set to true
        userProfileError: null
      });

      render(<AppRouter />);
      
      expect(screen.getByTestId('activities-list')).toBeInTheDocument();
      expect(screen.queryByTestId('wizard')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should show wizard when there is a profile error but user is logged in', () => {
      useDataContext.mockReturnValue({
        isUserLoggedIn: true,
        userProfileLoading: false,
        participant: null,
        hasCompletedWizard: false,
        userProfileError: 'Failed to load profile'
      });

      render(<AppRouter />);
      
      // Should still show wizard as fallback for logged-in users with errors
      expect(screen.getByTestId('wizard')).toBeInTheDocument();
      expect(screen.queryByTestId('activities-list')).not.toBeInTheDocument();
    });
  });
});