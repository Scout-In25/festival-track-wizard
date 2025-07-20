import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
  let consoleSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    // Spy on console.info to capture validation statistics
    consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy?.mockRestore();
  });

  const mockActivities = [
    {
      id: '1',
      name: 'Morning Workshop',
      description: 'A great workshop',
      type: 'workshop',
      start_time: '2025-07-15T09:00:00Z',
      end_time: '2025-07-15T10:30:00Z',
      location: 'Room A',
      metadata: {}
    },
    {
      id: '2',
      name: 'Afternoon Session',
      description: 'Another session',
      type: 'session',
      start_time: '2025-07-15T14:00:00Z',
      end_time: '2025-07-15T15:30:00Z',
      location: 'Room B',
      metadata: {}
    },
    {
      id: '3',
      name: 'Next Day Event',
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
    
    expect(screen.getByText('Scout-in Activiteiten')).toBeInTheDocument();
    expect(screen.getByText('Activiteiten laden...')).toBeInTheDocument();
  });

  it('renders activities in simple view by default', async () => {
    activitiesService.getAll.mockResolvedValue({ data: mockActivities });
    
    render(<ActivitiesListPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Scout-in Activiteiten')).toBeInTheDocument();
    });

    // Check intro text
    expect(screen.getByText(/Hier vind je alle activiteiten van scout-in/)).toBeInTheDocument();

    // Check that activities are displayed in simple view (alphabetically sorted)
    expect(screen.getByText('Afternoon Session')).toBeInTheDocument();
    expect(screen.getByText('Morning Workshop')).toBeInTheDocument();
    expect(screen.getByText('Next Day Event')).toBeInTheDocument();

    // Check locations are displayed
    expect(screen.getByText('@ Room B')).toBeInTheDocument();
    expect(screen.getByText('@ Room A')).toBeInTheDocument();
    expect(screen.getByText('@ Main Hall')).toBeInTheDocument();

    // Check types are displayed
    expect(screen.getByText('(workshop)')).toBeInTheDocument();
    expect(screen.getByText('(session)')).toBeInTheDocument();
    expect(screen.getByText('(event)')).toBeInTheDocument();

    // Check that NO time information is shown in simple view
    expect(screen.queryByText(/\d{2}:\d{2} - \d{2}:\d{2}/)).not.toBeInTheDocument();

    // Check that there are NO day headers in simple view
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0);
  });

  it('renders error state when API call fails', async () => {
    const errorMessage = 'Network error';
    activitiesService.getAll.mockRejectedValue(new Error(errorMessage));
    
    render(<ActivitiesListPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Scout-in Activiteiten')).toBeInTheDocument();
    });

    expect(screen.getByText(`Fout bij het laden van activiteiten: ${errorMessage}`)).toBeInTheDocument();
    expect(screen.getByText('Opnieuw proberen')).toBeInTheDocument();
  });

  it('renders empty state when no activities are returned', async () => {
    activitiesService.getAll.mockResolvedValue({ data: [] });
    
    render(<ActivitiesListPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Scout-in Activiteiten')).toBeInTheDocument();
    });

    expect(screen.getByText('Geen activiteiten gevonden.')).toBeInTheDocument();
  });

  it('sorts activities by start time correctly', async () => {
    const unsortedActivities = [
      {
        id: '1',
        name: 'Late Activity',
        start_time: '2025-07-15T18:00:00Z',
        end_time: '2025-07-15T19:00:00Z',
        location: 'Room C',
        type: 'late'
      },
      {
        id: '2',
        name: 'Early Activity',
        start_time: '2025-07-15T08:00:00Z',
        end_time: '2025-07-15T09:00:00Z',
        location: 'Room A',
        type: 'early'
      }
    ];

    activitiesService.getAll.mockResolvedValue({ data: unsortedActivities });
    
    render(<ActivitiesListPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Scout-in Activiteiten')).toBeInTheDocument();
    });

    const activityItems = screen.getAllByRole('listitem');
    expect(activityItems).toHaveLength(2);
    
    // First item should be the early activity
    const activityTitles = screen.getAllByText('Early Activity');
    expect(activityTitles).toHaveLength(1);
    const lateActivityTitles = screen.getAllByText('Late Activity');
    expect(lateActivityTitles).toHaveLength(1);
  });

  it('groups activities by day correctly when in detailed view', async () => {
    activitiesService.getAll.mockResolvedValue({ data: mockActivities });
    
    render(<ActivitiesListPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Scout-in Activiteiten')).toBeInTheDocument();
    });

    // First click the toggle button to switch to detailed view
    const toggleButton = screen.getByRole('button', { name: /Schakel naar gedetailleerde weergave/i });
    fireEvent.click(toggleButton);

    // Check that we have two different day sections by looking for h2 elements
    const dayHeaders = screen.getAllByRole('heading', { level: 2 });
    expect(dayHeaders).toHaveLength(2); // Two different days

    // Check that activities are displayed
    expect(screen.getByText('Morning Workshop')).toBeInTheDocument();
    expect(screen.getByText('Afternoon Session')).toBeInTheDocument();
    expect(screen.getByText('Next Day Event')).toBeInTheDocument();
  });

  it('formats time correctly in Dutch format in detailed view', async () => {
    const activityWithSpecificTime = [{
      id: '1',
      name: 'Test Activity',
      start_time: '2025-07-15T14:30:00Z',
      end_time: '2025-07-15T16:45:00Z',
      location: 'Test Room',
      type: 'test'
    }];

    activitiesService.getAll.mockResolvedValue({ data: activityWithSpecificTime });
    
    render(<ActivitiesListPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Scout-in Activiteiten')).toBeInTheDocument();
    });

    // Switch to detailed view
    const toggleButton = screen.getByRole('button', { name: /Schakel naar gedetailleerde weergave/i });
    fireEvent.click(toggleButton);

    // Check that time is formatted correctly (this will depend on timezone)
    const timeElement = document.querySelector('.activity-time');
    expect(timeElement).toBeInTheDocument();
    expect(timeElement.textContent).toMatch(/\d{2}:\d{2} - \d{2}:\d{2}/);
  });

  it('filters out bad entries during activity loading', async () => {
    // Mock API response with mix of valid and invalid activities
    const mockActivitiesWithBadEntries = [
      {
        id: '1',
        name: 'Valid Activity A',
        start_time: '2025-09-19T10:00:00Z',
        end_time: '2025-09-19T11:00:00Z',
        location: 'Location A'
      },
      {
        id: '2',
        // Missing name/title
        start_time: '2025-09-19T12:00:00Z',
        end_time: '2025-09-19T13:00:00Z',
        location: 'Location B'
      },
      {
        id: '3',
        name: 'Activity Missing End Time',
        start_time: '2025-09-19T14:00:00Z',
        // Missing end_time
        location: 'Location C'
      },
      {
        id: '4',
        name: 'Valid Activity B',
        start_time: '2025-09-19T16:00:00Z',
        end_time: '2025-09-19T17:00:00Z',
        location: 'Location D'
      },
      null, // Invalid entry
      {
        id: '5',
        name: '', // Empty name
        start_time: '2025-09-19T18:00:00Z',
        end_time: '2025-09-19T19:00:00Z'
      }
    ];

    activitiesService.getAll.mockResolvedValue({ data: mockActivitiesWithBadEntries });

    render(<ActivitiesListPage />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/Activiteiten laden/)).not.toBeInTheDocument();
    });

    // Should only show the 2 valid activities
    expect(screen.getByText('Valid Activity A')).toBeInTheDocument();
    expect(screen.getByText('Valid Activity B')).toBeInTheDocument();
    
    // Should not show invalid activities
    expect(screen.queryByText('Activity Missing End Time')).not.toBeInTheDocument();
    expect(screen.queryByText('Location B')).not.toBeInTheDocument();
    expect(screen.queryByText('Location C')).not.toBeInTheDocument();

    // Activities should be shown in simple list by default
    const listItems = screen.getAllByRole('listitem');
    expect(listItems.length).toBeGreaterThan(0);
  });

  it('handles empty dataset after validation', async () => {
    // Mock API response with only invalid activities
    const mockInvalidActivities = [
      { id: '1', start_time: '2025-09-19T10:00:00Z', end_time: '2025-09-19T11:00:00Z' }, // No name
      { id: '2', name: 'No Times' }, // No start/end times
      null, // Invalid entry
      { id: '3', name: '', start_time: '2025-09-19T12:00:00Z' } // Empty name, no end time
    ];

    activitiesService.getAll.mockResolvedValue({ data: mockInvalidActivities });

    render(<ActivitiesListPage />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/Activiteiten laden/)).not.toBeInTheDocument();
    });

    // Should show empty state since all activities were filtered out
    expect(screen.getByText('Geen activiteiten gevonden.')).toBeInTheDocument();
  });

  it('logs validation statistics when filtering activities', async () => {
    const mockActivitiesWithBadEntries = [
      { id: '1', name: 'Valid Activity', start_time: '2025-09-19T10:00:00Z', end_time: '2025-09-19T11:00:00Z' },
      { id: '2', start_time: '2025-09-19T12:00:00Z', end_time: '2025-09-19T13:00:00Z' }, // No name
      { id: '3', name: 'No End Time', start_time: '2025-09-19T14:00:00Z' }, // No end_time
    ];

    activitiesService.getAll.mockResolvedValue({ data: mockActivitiesWithBadEntries });

    render(<ActivitiesListPage />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/Activiteiten laden/)).not.toBeInTheDocument();
    });

    // Verify validation statistics were logged
    expect(consoleSpy).toHaveBeenCalledWith(
      'Activity validation completed:',
      expect.objectContaining({
        originalCount: 3,
        removedCount: 2,
        validCount: 1,
        removalReasons: expect.objectContaining({
          missingName: 1,
          missingEndTime: 1
        }),
        removalRate: '66.7%'
      })
    );
  });

  it('can toggle between simple and detailed view', async () => {
    activitiesService.getAll.mockResolvedValue({ data: mockActivities });
    
    render(<ActivitiesListPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Scout-in Activiteiten')).toBeInTheDocument();
    });

    // Should start in simple view
    expect(screen.queryByText(/\d{2}:\d{2} - \d{2}:\d{2}/)).not.toBeInTheDocument();
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0);

    // Click toggle to switch to detailed view
    const toggleToDetailed = screen.getByRole('button', { name: /Schakel naar gedetailleerde weergave/i });
    fireEvent.click(toggleToDetailed);

    // Should now show detailed view with times and day headers
    await waitFor(() => {
      const timeElements = document.querySelectorAll('.activity-time');
      expect(timeElements.length).toBeGreaterThan(0);
    });
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2); // Day headers

    // Click toggle to switch back to simple view
    const toggleToSimple = screen.getByRole('button', { name: /Schakel naar eenvoudige weergave/i });
    fireEvent.click(toggleToSimple);

    // Should be back in simple view
    expect(screen.queryByText(/\d{2}:\d{2} - \d{2}:\d{2}/)).not.toBeInTheDocument();
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0);
  });

  it('removes duplicates by title in simple view', async () => {
    const activitiesWithDuplicates = [
      {
        id: '1',
        name: 'Workshop A',
        start_time: '2025-07-15T09:00:00Z',
        end_time: '2025-07-15T10:00:00Z',
        location: 'Room 1'
      },
      {
        id: '2',
        name: 'Workshop A', // Duplicate name
        start_time: '2025-07-15T14:00:00Z',
        end_time: '2025-07-15T15:00:00Z',
        location: 'Room 2'
      },
      {
        id: '3',
        name: 'Workshop B',
        start_time: '2025-07-15T11:00:00Z',
        end_time: '2025-07-15T12:00:00Z',
        location: 'Room 3'
      }
    ];

    activitiesService.getAll.mockResolvedValue({ data: activitiesWithDuplicates });
    
    render(<ActivitiesListPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Scout-in Activiteiten')).toBeInTheDocument();
    });

    // In simple view, should only show unique titles
    const workshopATitles = screen.getAllByText('Workshop A');
    expect(workshopATitles).toHaveLength(1); // Only one instance
    expect(screen.getByText('Workshop B')).toBeInTheDocument();

    // Total list items should be 2 (not 3)
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(2);
  });
});
