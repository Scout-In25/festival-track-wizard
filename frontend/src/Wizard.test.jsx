import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Wizard from './Wizard';
import axios from 'axios';

// Mock axios to prevent actual API calls during tests
import { vi } from 'vitest';
vi.mock('axios');

describe('Wizard Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    axios.post.mockClear();
    vi.restoreAllMocks(); // Restore mocks after each test
  });

  test('renders the form correctly', () => {
    render(<Wizard />);
    expect(screen.getByText('Festival Track Wizard')).toBeInTheDocument();
    expect(screen.getByLabelText('Music')).toBeInTheDocument();
    expect(screen.getByLabelText('Workshops')).toBeInTheDocument();
    expect(screen.getByLabelText('Music Style')).toBeInTheDocument();
    expect(screen.getByLabelText('Yoga')).toBeInTheDocument();
    expect(screen.getByLabelText('Startup Brunch')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  test('displays validation errors for interests if none selected', async () => {
    render(<Wizard />);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText('Select at least one interest.')).toBeInTheDocument();
    });
  });

  test('displays validation errors for music style if none selected', async () => {
    render(<Wizard />);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText('Select a music style.')).toBeInTheDocument();
    });
  });

  test('displays validation errors for sunday option if none selected', async () => {
    render(<Wizard />);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText('Choose a Sunday event.')).toBeInTheDocument();
    });
  });

  test('submits the form with valid data and shows success alert', async () => {
    axios.post.mockResolvedValueOnce({ data: 'success' }); // Mock a successful response
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {}); // Mock window.alert

    render(<Wizard />);

    fireEvent.click(screen.getByLabelText('Music'));
    fireEvent.change(screen.getByLabelText('Music Style'), { target: { value: 'rock' } });
    fireEvent.click(screen.getByLabelText('Yoga'));

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith('https://si25.nl/REST/formsubmit/', {
        interests: ['Music'],
        musicStyle: 'rock',
        sundayOption: 'Yoga',
      });
      expect(alertMock).toHaveBeenCalledWith('Schedule submitted!');
    });

    alertMock.mockRestore(); // Restore window.alert
  });

  test('handles submission failure and shows error alert', async () => {
    axios.post.mockRejectedValueOnce(new Error('Network Error')); // Mock a failed response
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {}); // Mock window.alert
    const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {}); // Mock console.error

    render(<Wizard />);

    fireEvent.click(screen.getByLabelText('Music'));
    fireEvent.change(screen.getByLabelText('Music Style'), { target: { value: 'rock' } });
    fireEvent.click(screen.getByLabelText('Yoga'));

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(alertMock).toHaveBeenCalledWith('Submission failed.');
      expect(consoleErrorMock).toHaveBeenCalledWith(expect.any(Error));
    });

    alertMock.mockRestore();
    consoleErrorMock.mockRestore();
  });
});