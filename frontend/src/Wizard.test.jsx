import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Wizard from './Wizard';
import { apiRequest } from './apiUtils';

// Mock the API utility
import { vi } from 'vitest';
vi.mock('./apiUtils');

// Mock window.FestivalWizardData
Object.defineProperty(window, 'FestivalWizardData', {
  value: {
    apiKey: 'test-api-key',
    ajaxUrl: 'http://test.com/wp-admin/admin-ajax.php',
    nonce: 'test-nonce',
    currentUser: 'Test User'
  },
  writable: true
});

describe('Wizard Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    apiRequest.mockClear();
    vi.restoreAllMocks();
  });

  test('renders the first question correctly', () => {
    render(<Wizard />);
    expect(screen.getByText('Festival Track Wizard')).toBeInTheDocument();
    expect(screen.getByText('Welke rol(len) heb jij?')).toBeInTheDocument();
    expect(screen.getByLabelText('Leiding')).toBeInTheDocument();
    expect(screen.getByLabelText('Bestuur of bestuursondersteuning')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
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
    apiRequest.mockResolvedValueOnce({ data: 'success' });
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

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
      expect(apiRequest).toHaveBeenCalledTimes(1);
      expect(apiRequest).toHaveBeenCalledWith('post', 'https://test-api.example.com/REST/formsubmit/', expect.objectContaining({
        roles: ['leiding'],
        speltakLeiding: ['scouts'],
        vrijwilligerDuur: 'gemiddeld',
        activiteitengebieden: ['buitenleven'],
        onderwerpen: ['ehbo']
      }));
      expect(alertMock).toHaveBeenCalledWith('Schedule submitted!');
    });

    alertMock.mockRestore();
  });

  test('handles submission failure and shows error alert', async () => {
    const errorMessage = 'API key authentication failed. Please contact an administrator.';
    apiRequest.mockRejectedValueOnce(new Error(errorMessage));
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

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
      expect(apiRequest).toHaveBeenCalledTimes(1);
      expect(alertMock).toHaveBeenCalledWith(errorMessage);
      expect(consoleErrorMock).toHaveBeenCalledWith('Submission error:', expect.any(Error));
    });

    alertMock.mockRestore();
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
});
