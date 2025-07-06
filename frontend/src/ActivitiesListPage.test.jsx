import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ActivitiesListPage from './ActivitiesListPage.jsx';
import { activitiesService } from './services/api/activitiesService.js';

// Mock the activities service
vi.mock('./services/api/activitiesService.js', () => ({
  activitiesService: {
    getAll: vi.fn()
  }
}));

describe('ActivitiesListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockActivities = [
    {
      id: '1',
      title: 'Morning Workshop',
      description: 'A great workshop',
      type: 'workshop',
      start_time: '2025-07-15T09:00:00Z',
      end_time: '2025-07-15T10:30:00Z',
      location: 'Room A',
      metadata: {}
    },
    {
      id: '2',
      title: 'Afternoon Session',
      description: 'Another session',
      type: 'session',
      start_time: '2025-07-15T14:00:00Z',
      end_time: '2025-07-15T15:30:00Z',
      location: 'Room B',
      metadata: {}
    },
    {
      id: '3',
      title: 'Next Day Event',
      description: 'Event on next day',
      type: 'event',
      start_time: '2025-07-16T10:00:00Z',
      end_time: '2025-07-16T11:00:00Z',
      location: 'Main Hall',
      metadata: {}
    }
  ];

  it('renders loading state initially', () => {
    activitiesService.getAll.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<ActivitiesListPage />);
    
    expect(screen.getByText('Festival Activiteiten')).toBeInTheDocument();
    expect(screen.getByText('Activiteiten laden...')).toBeInTheDocument();
  });

  it('renders activities grouped by day when loaded successfully', async () => {
    activitiesService.getAll.mockResolvedValue({ data: mockActivities });
    
    render(<ActivitiesListPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Festival Activiteiten')).toBeInTheDocument();
    });

    // Check intro text
    expect(screen.getByText(/Hier vind je alle activiteiten van het festival/)).toBeInTheDocument();

    // Check that activities are displayed
    expect(screen.getByText('Morning Workshop')).toBeInTheDocument();
    expect(screen.getByText('Afternoon Session')).toBeInTheDocument();
    expect(screen.getByText('Next Day Event')).toBeInTheDocument();

    // Check locations are displayed
    expect(screen.getByText('@ Room A')).toBeInTheDocument();
    expect(screen.getByText('@ Room B')).toBeInTheDocument();
    expect(screen.getByText('@ Main Hall')).toBeInTheDocument();

    // Check types are displayed
    expect(screen.getByText('(workshop)')).toBeInTheDocument();
    expect(screen.getByText('(session)')).toBeInTheDocument();
    expect(screen.getByText('(event)')).toBeInTheDocument();
  });

  it('renders error state when API call fails', async () => {
    const errorMessage = 'Network error';
    activitiesService.getAll.mockRejectedValue(new Error(errorMessage));
    
    render(<ActivitiesListPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Festival Activiteiten')).toBeInTheDocument();
    });

    expect(screen.getByText(`Fout bij het laden van activiteiten: ${errorMessage}`)).toBeInTheDocument();
    expect(screen.getByText('Opnieuw proberen')).toBeInTheDocument();
  });

  it('renders empty state when no activities are returned', async () => {
    activitiesService.getAll.mockResolvedValue({ data: [] });
    
    render(<ActivitiesListPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Festival Activiteiten')).toBeInTheDocument();
    });

    expect(screen.getByText('Geen activiteiten gevonden.')).toBeInTheDocument();
  });

  it('sorts activities by start time correctly', async () => {
    const unsortedActivities = [
      {
        id: '1',
        title: 'Late Activity',
        start_time: '2025-07-15T18:00:00Z',
        end_time: '2025-07-15T19:00:00Z',
        location: 'Room C',
        type: 'late'
      },
      {
        id: '2',
        title: 'Early Activity',
        start_time: '2025-07-15T08:00:00Z',
        end_time: '2025-07-15T09:00:00Z',
        location: 'Room A',
        type: 'early'
      }
    ];

    activitiesService.getAll.mockResolvedValue({ data: unsortedActivities });
    
    render(<ActivitiesListPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Festival Activiteiten')).toBeInTheDocument();
    });

    const activityItems = screen.getAllByRole('listitem');
    expect(activityItems).toHaveLength(2);
    
    // First item should be the early activity
    expect(activityItems[0]).toHaveTextContent('Early Activity');
    // Second item should be the late activity
    expect(activityItems[1]).toHaveTextContent('Late Activity');
  });

  it('groups activities by day correctly', async () => {
    activitiesService.getAll.mockResolvedValue({ data: mockActivities });
    
    render(<ActivitiesListPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Festival Activiteiten')).toBeInTheDocument();
    });

    // Check that we have two different day sections by looking for h2 elements
    const dayHeaders = screen.getAllByRole('heading', { level: 2 });
    expect(dayHeaders).toHaveLength(2); // Two different days

    // Check that activities are displayed
    expect(screen.getByText('Morning Workshop')).toBeInTheDocument();
    expect(screen.getByText('Afternoon Session')).toBeInTheDocument();
    expect(screen.getByText('Next Day Event')).toBeInTheDocument();
  });

  it('formats time correctly in Dutch format', async () => {
    const activityWithSpecificTime = [{
      id: '1',
      title: 'Test Activity',
      start_time: '2025-07-15T14:30:00Z',
      end_time: '2025-07-15T16:45:00Z',
      location: 'Test Room',
      type: 'test'
    }];

    activitiesService.getAll.mockResolvedValue({ data: activityWithSpecificTime });
    
    render(<ActivitiesListPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Festival Activiteiten')).toBeInTheDocument();
    });

    // Check that time is formatted correctly (this will depend on timezone)
    const timeElement = document.querySelector('.activity-time');
    expect(timeElement).toBeInTheDocument();
    expect(timeElement.textContent).toMatch(/\d{2}:\d{2} - \d{2}:\d{2}/);
  });
});
