import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Wizard from './Wizard';
import { participantsService } from './services/api/participantsService';
import { useDataContext } from './contexts/DataProvider';
import { useToast } from './hooks/useToast';

// Mock the API utility and hooks
import { vi } from 'vitest';
vi.mock('./services/api/participantsService');
vi.mock('./contexts/DataProvider');
vi.mock('./hooks/useToast');

// Default mock implementation for DataContext
const mockDataContext = {
  wordpressUser: {
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    ticket_type: 'standard'
  },
  isUserLoggedIn: true,
  userProfileLoading: false
};

// Mock toast hook
const mockToast = {
  showInfo: vi.fn(),
  showError: vi.fn(),
  showSuccess: vi.fn()
};

describe('Wizard Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    participantsService.create = vi.fn();
    useDataContext.mockReturnValue(mockDataContext);
    useToast.mockReturnValue(mockToast);
  });

  test('renders the first question correctly', () => {
    render(<Wizard />);
    expect(screen.getByText('Festival Track Wizard')).toBeInTheDocument();
    expect(screen.getByText('Welke rol(len) heb jij?')).toBeInTheDocument();
    expect(screen.getByLabelText('Leiding')).toBeInTheDocument();
    expect(screen.getByLabelText('Bestuur of bestuursondersteuning')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  test('shows loading state when user data is loading', () => {
    useDataContext.mockReturnValue({
      ...mockDataContext,
      userProfileLoading: true
    });
    render(<Wizard />);
    expect(screen.getByText('Gebruikersgegevens laden...')).toBeInTheDocument();
  });

  test('shows login message when user is not logged in', () => {
    useDataContext.mockReturnValue({
      ...mockDataContext,
      isUserLoggedIn: false
    });
    render(<Wizard />);
    expect(screen.getByText('Je moet ingelogd zijn om deze wizard te gebruiken.')).toBeInTheDocument();
  });

  test('navigates through questions correctly', async () => {
    render(<Wizard />);
    
    // First question should be visible
    expect(screen.getByText('Welke rol(len) heb jij?')).toBeInTheDocument();
    
    // Select a role and go to next question
    fireEvent.click(screen.getByLabelText('Leiding'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    // Should now show the second question
    await waitFor(() => {
      expect(screen.getByText('Van welke speltak ben jij leiding?')).toBeInTheDocument();
    });
  });

  test('shows submit button on last question', async () => {
    render(<Wizard />);
    
    // Navigate through all questions to reach the last one
    // First question - select role
    fireEvent.click(screen.getByLabelText('Leiding'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    // Second question - select speltak
    await waitFor(() => {
      expect(screen.getByText('Van welke speltak ben jij leiding?')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('Scouts'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    // Continue through remaining questions
    await waitFor(() => {
      expect(screen.getByText('Hoe lang ben jij al vrijwilliger bij Scouting?')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('Al best wel even (2-5 jaar)'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Welke activiteitengebieden vind jij het leukste (kies er maximaal 3)?')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('Buitenleven'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    // Last question should show submit button
    await waitFor(() => {
      expect(screen.getByText('Welke onderwerpen spreken je aan?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });
  });

  test('submits the form with valid data and shows success alert', async () => {
    participantsService.create.mockResolvedValueOnce({ data: 'success' });
    // Mock window.location.hash
    delete window.location;
    window.location = { hash: '' };

    render(<Wizard />);

    // Navigate to last question and fill form
    fireEvent.click(screen.getByLabelText('Leiding'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Van welke speltak ben jij leiding?')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('Scouts'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Hoe lang ben jij al vrijwilliger bij Scouting?')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('Al best wel even (2-5 jaar)'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Welke activiteitengebieden vind jij het leukste (kies er maximaal 3)?')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('Buitenleven'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Welke onderwerpen spreken je aan?')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('EHBO'));
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(participantsService.create).toHaveBeenCalledTimes(1);
      expect(participantsService.create).toHaveBeenCalledWith(expect.objectContaining({
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        labels: expect.arrayContaining(['leiding', 'scouts', 'gemiddeld', 'buitenleven', 'ehbo']),
        ticket_type: 'standard',
        track_id: null,
        track: null,
        activities: [],
        reviews: []
      }));
      expect(mockToast.showInfo).toHaveBeenCalledWith('Profiel succesvol aangemaakt!');
      expect(window.location.hash).toBe('#track');
    });
  });

  test.skip('handles submission failure and shows error alert', async () => {
    const errorMessage = 'API key authentication failed. Please contact an administrator.';
    const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Override the mock to reject (after beforeEach sets it up)
    participantsService.create.mockRejectedValueOnce(new Error(errorMessage));

    render(<Wizard />);

    // Navigate to last question and fill minimal form
    fireEvent.click(screen.getByLabelText('Leiding'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Van welke speltak ben jij leiding?')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('Scouts'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Hoe lang ben jij al vrijwilliger bij Scouting?')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('Al best wel even (2-5 jaar)'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Welke activiteitengebieden vind jij het leukste (kies er maximaal 3)?')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('Buitenleven'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Welke onderwerpen spreken je aan?')).toBeInTheDocument();
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(participantsService.create).toHaveBeenCalledTimes(1);
      expect(mockToast.showError).toHaveBeenCalledWith('Submission failed');
      expect(consoleErrorMock).toHaveBeenCalledWith('Error details:', expect.any(Error));
    }, { timeout: 5000 });

    consoleErrorMock.mockRestore();
  });

  test('handles back navigation correctly', async () => {
    render(<Wizard />);
    
    // Go to second question
    fireEvent.click(screen.getByLabelText('Leiding'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Van welke speltak ben jij leiding?')).toBeInTheDocument();
    });
    
    // Go back to first question
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Welke rol(len) heb jij?')).toBeInTheDocument();
    });
  });

  test('uses ticket_type from user data instead of determining from roles', async () => {
    // Test with organizer ticket type
    const organizerContext = {
      ...mockDataContext,
      wordpressUser: {
        ...mockDataContext.wordpressUser,
        ticket_type: 'organizer'
      }
    };
    useDataContext.mockReturnValue(organizerContext);
    participantsService.create.mockResolvedValueOnce({ data: { id: 'new-id' } });

    render(<Wizard />);

    // Navigate through form without selecting "bestuur" role
    fireEvent.click(screen.getByLabelText('Leiding'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Van welke speltak ben jij leiding?')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('Scouts'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Hoe lang ben jij al vrijwilliger bij Scouting?')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('Al best wel even (2-5 jaar)'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Welke activiteitengebieden vind jij het leukste (kies er maximaal 3)?')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('Buitenleven'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Welke onderwerpen spreken je aan?')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('EHBO'));
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(participantsService.create).toHaveBeenCalledWith(expect.objectContaining({
        ticket_type: 'organizer' // Should use user data ticket_type, not 'standard'
      }));
    });

  });
});
