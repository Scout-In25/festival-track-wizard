import React, { useState, useEffect, useMemo } from 'react';
import { activitiesService } from './services/api/activitiesService.js';
import { useDataContext } from './contexts/DataProvider.jsx';
import { useToast } from './hooks/useToast';
import { validateActivities, deduplicateActivitiesByTitleAndTime, analyzeDuplicates, deduplicateActivities, createTitleHash } from './utils/activityDeduplication.js';
import ActivityDetailsModal from './components/ActivityDetailsModal.jsx';
import SuggestionsBlock from './components/SuggestionsBlock.jsx';
import './ActivitiesListPage.css';

// Icon components
const ChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.5 2.25L8.25 6L4.5 9.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const ChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.25 4.5L6 8.25L9.75 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

// Festival-themed icons
const CalendarPlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM12 13h-2v-2h2V9h2v2h2v2h-2v2h-2v-2z"/>
  </svg>
);

const CalendarCheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zm-7-2l-4-4 1.41-1.41L12 14.17l6.59-6.58L20 9l-8 8z"/>
  </svg>
);

// Status indicator component
const StatusIndicator = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'subscribed': return '#28a745';
      case 'full': return '#dc3545';
      case 'conflict': return '#ff8c00';
      default: return '#6c757d';
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'subscribed': return 'Aangemeld';
      case 'full': return 'Vol';
      case 'conflict': return 'Tijdconflict';
      default: return 'Niet aangemeld';
    }
  };

  return (
    <span 
      className="status-indicator"
      title={getStatusTitle()}
      style={{
        display: 'inline-block',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: getStatusColor(),
        marginLeft: '8px',
        verticalAlign: 'middle'
      }}
    />
  );
};

// View toggle icons
const ListIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2.5H3c-.83 0-1.5.67-1.5 1.5v9c0 .83.67 1.5 1.5 1.5h10c.83 0 1.5-.67 1.5-1.5V4c0-.83-.67-1.5-1.5-1.5zM1.5 6.5h13M5 1v3M11 1v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 10.5h4v1H6v-1zM2 5.5v1h12v-1H2zM4 8h8v1H4V8z" fill="currentColor"/>
  </svg>
);

const HamburgerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const UserCalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 3V1h-1v2H6V1H5v2H3c-.55 0-1 .45-1 1v9c0 .55.45 1 1 1h10c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1h-2zM13 13H3V6h10v7z" fill="currentColor"/>
    <circle cx="8" cy="9.5" r="1.5" fill="currentColor"/>
    <path d="M6.5 11.5c0-.28.22-.5.5-.5s.5.22.5.5-.22.5-.5.5-.5-.22-.5-.5zM9.5 11.5c0-.28.22-.5.5-.5s.5.22.5.5-.22.5-.5.5-.5-.22-.5-.5z" fill="currentColor"/>
  </svg>
);

// iOS-style Toggle Switch Component
const ToggleSwitch = ({ label, checked, onChange, ariaLabel }) => {
  const handleClick = () => {
    onChange(!checked);
  };

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!checked);
      e.target.blur(); // Remove focus for visual clarity
    }
  };

  return (
    <div className="toggle-container">
      <span className="toggle-label">{label}</span>
      <div 
        className={`toggle-switch ${checked ? 'checked' : ''}`}
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel || label}
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <div className="toggle-thumb" />
      </div>
    </div>
  );
};

const ActivitiesListPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalActivityId, setModalActivityId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalTransitioning, setIsModalTransitioning] = useState(false);
  const [activityDetails, setActivityDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});
  const [isSimpleView, setIsSimpleView] = useState(true);
  const [showEligibleOnly, setShowEligibleOnly] = useState(false);
  const [showMyScheduleOnly, setShowMyScheduleOnly] = useState(false);
  const [subscribingActivities, setSubscribingActivities] = useState({});
  const [selectedTrackId, setSelectedTrackId] = useState('');
  const [isTrackAutoSelected, setIsTrackAutoSelected] = useState(false);
  
  const { 
    participant, 
    wordpressUser, 
    isUserLoggedIn,
    hasCompletedWizard,
    userProfileLoading,
    subscribeToActivity, 
    unsubscribeFromActivity,
    clearUserLabels,
    tracks, 
    tracksLoading, 
    tracksError,
    suggestions,
    suggestionsLoading,
    suggestionsError,
    fetchSuggestions
  } = useDataContext();
  const { showInfo, showError } = useToast();

  // Utility functions that need to be defined early
  const isUserSubscribed = (activityId) => {
    if (!participant || !participant.activities || !Array.isArray(participant.activities)) {
      return false;
    }
    return participant.activities.includes(activityId);
  };

  const hasTimeOverlap = (activity1, activity2) => {
    const start1 = new Date(activity1.start_time);
    const end1 = new Date(activity1.end_time);
    const start2 = new Date(activity2.start_time);
    const end2 = new Date(activity2.end_time);
    return start1 < end2 && start2 < end1;
  };

  const getSubscribedActivities = () => {
    if (!participant?.activities || !activities.length) return [];
    return activities.filter(activity => participant.activities.includes(activity.id));
  };

  const getConflictingActivities = (targetActivity) => {
    // Only check conflicts for logged-in users who aren't already subscribed to this activity
    if (!isUserLoggedIn || isUserSubscribed(targetActivity.id)) return [];
    
    const subscribedActivities = getSubscribedActivities();
    return subscribedActivities.filter(subscribedActivity => 
      hasTimeOverlap(targetActivity, subscribedActivity)
    );
  };

  // Activity eligibility checker for "Alleen Beschikbaar" filter
  const isActivityEligible = (activity) => {
    // Hide activities user is already subscribed to - they're not "available" to add
    if (isUserLoggedIn && isUserSubscribed(activity.id)) {
      return false;
    }
    
    // Check for time conflicts - if activity has conflict, it's not eligible
    if (isUserLoggedIn) {
      const conflicts = getConflictingActivities(activity);
      if (conflicts.length > 0) {
        return false;
      }
    }
    
    // If no conflicts and not subscribed, activity is available
    return true;
  };

  // Filter functions - need to be defined before useMemo hooks
  const applyEligibilityFilter = (activitiesList) => {
    if (!showEligibleOnly) return activitiesList;
    
    const filtered = activitiesList.filter(activity => isActivityEligible(activity));
    
    return filtered;
  };

  const applyScheduleFilter = (activitiesList) => {
    if (!showMyScheduleOnly) return activitiesList;
    return activitiesList.filter(activity => isUserSubscribed(activity.id));
  };

  const applyTrackFilter = (activitiesList) => {
    if (!selectedTrackId) return activitiesList;
    
    // Find the selected track
    const selectedTrack = tracks.find(track => track.id === selectedTrackId);
    if (!selectedTrack || !selectedTrack.activities) {
      return activitiesList; // Return all activities if track not found, don't return empty array
    }
    
    // Filter activities that match the track's activity numbers
    const filtered = activitiesList.filter(activity => {
      // Try multiple possible field names for activity identification
      const activityIdentifier = activity.number || activity.code || activity.activity_number;
      const hasMatch = activityIdentifier && selectedTrack.activities.includes(activityIdentifier);
      
      return hasMatch;
    });
    
    return filtered;
  };

  // Utility functions for data processing - need to be defined before useMemo hooks
  const deduplicateByTitleOnly = (activitiesList) => {
    const seenHashes = new Set();
    
    return activitiesList.filter(activity => {
      const titleHash = createTitleHash(activity.name || activity.title || '');
      
      if (!titleHash || seenHashes.has(titleHash)) {
        return false;
      }
      
      seenHashes.add(titleHash);
      return true;
    });
  };

  const sortActivitiesAlphabetically = (activitiesList) => {
    return activitiesList.sort((a, b) => {
      const nameA = (a.name || a.title || '').toLowerCase();
      const nameB = (b.name || b.title || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

  const groupActivitiesByDay = (activitiesList) => {
    const grouped = {};
    activitiesList.forEach(activity => {
      const date = new Date(activity.start_time);
      const dayKey = date.toDateString();
      if (!grouped[dayKey]) {
        grouped[dayKey] = [];
      }
      grouped[dayKey].push(activity);
    });
    return grouped;
  };

  // Memoize processed activities for simple view to avoid re-computation on every render
  const processedSimpleActivities = useMemo(() => {
    // Process activities for simple view: deduplicate by title and sort alphabetically
    // Note: activities are already validated in loadActivities, no need to re-validate
    // Apply track filter first as base filter
    let filteredActivities = applyTrackFilter(activities);
    // Then apply other filters on top
    filteredActivities = applyEligibilityFilter(filteredActivities);
    filteredActivities = applyScheduleFilter(filteredActivities);
    const uniqueActivities = deduplicateByTitleOnly(filteredActivities);
    const sortedActivities = sortActivitiesAlphabetically(uniqueActivities);
    return sortedActivities;
  }, [activities, selectedTrackId, showEligibleOnly, showMyScheduleOnly, participant, tracks]);

  // Memoize filtered activities for full view to avoid re-computation on every render
  const filteredActivitiesForFullView = useMemo(() => {
    // Apply track filter first as base filter
    let filtered = applyTrackFilter(activities);
    // Then apply other filters on top
    filtered = applyEligibilityFilter(filtered);
    filtered = applyScheduleFilter(filtered);
    return filtered;
  }, [activities, selectedTrackId, showEligibleOnly, showMyScheduleOnly, participant, tracks]);

  // Memoize grouped activities for calendar view
  const groupedActivities = useMemo(() => {
    return groupActivitiesByDay(filteredActivitiesForFullView);
  }, [filteredActivitiesForFullView]);

  useEffect(() => {
    loadActivities();
  }, []);

  // Auto-select first suggested track when suggestions are loaded
  useEffect(() => {
    if (suggestions && !suggestionsLoading && !selectedTrackId) {
      const suggestedTracks = suggestions.suggested_tracks || suggestions.tracks || [];
      
      if (suggestedTracks.length > 0) {
        const firstSuggestedTrack = suggestedTracks[0];
        
        // Check if this track ID exists in the available tracks
        const trackExists = tracks.find(track => track.id === firstSuggestedTrack.id);
        
        if (trackExists) {
          setSelectedTrackId(firstSuggestedTrack.id);
          setIsTrackAutoSelected(true);
        }
        // Don't auto-select if the suggested track doesn't exist in available tracks
      }
    }
  }, [suggestions, suggestionsLoading, selectedTrackId, tracks]);

  // Auto-fetch suggestions for users who have completed wizard but have no activity subscriptions
  useEffect(() => {
    // Only proceed if user profile is loaded and we have the necessary data
    if (userProfileLoading || !isUserLoggedIn || !hasCompletedWizard) {
      return;
    }

    // Check if user has no activity subscriptions
    const hasNoActivities = !participant?.activities || participant.activities.length === 0;
    
    // Check if we already have suggestions or are currently loading them
    const alreadyHasSuggestions = suggestions || suggestionsLoading;

    // Fetch suggestions if user is eligible and doesn't already have them
    if (hasNoActivities && !alreadyHasSuggestions && fetchSuggestions) {
      const username = wordpressUser?.username || participant?.username;
      
      if (username) {
        fetchSuggestions(username).catch(error => {
          console.error('[ActivitiesListPage] Auto-fetch suggestions failed:', error);
          // Don't show error to user as this is a background operation
        });
      } else {
        console.warn('[ActivitiesListPage] Cannot auto-fetch suggestions: no username available');
      }
    }
  }, [
    userProfileLoading, 
    isUserLoggedIn, 
    hasCompletedWizard, 
    participant?.activities,
    suggestions,
    suggestionsLoading,
    fetchSuggestions,
    wordpressUser?.username,
    participant?.username
  ]);

  // Development mock data overrides
  const applyDevMockData = (activitiesList) => {
    if (!import.meta.env.DEV) return activitiesList;
    
    return activitiesList.map(activity => {
      // Mock specific activity as full for testing
      if (activity.id === '8af471b0-5122-4c28-a638-98fba3c07455') {
        return {
          ...activity,
          current_subscriptions: 100,
          // Ensure it has a capacity to test against
          capacity: activity.capacity || activity.metadata?.max_participants || 50
        };
      }
      
      // Add more mock overrides here as needed
      // Example:
      // if (activity.id === 'another-activity-id') {
      //   return { ...activity, some_property: 'mock_value' };
      // }
      
      return activity;
    });
  };

  const loadActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await activitiesService.getAll();
      const rawActivities = response.data || [];
      
      // Step 1: Validate activities and remove bad entries
      const validActivities = validateActivities(rawActivities);
      
      // Step 2: Apply development mock data overrides
      const mockedActivities = applyDevMockData(validActivities);
      
      // Step 3: Analyze duplicates after validation
      const duplicateAnalysis = analyzeDuplicates(mockedActivities);
      // console.info('Duplicate analysis:', duplicateAnalysis);
      
      // Step 4: Deduplicate activities by title
      const deduplicatedActivities = deduplicateActivitiesByTitleAndTime(mockedActivities);
      
      // Step 5: Sort by date/time
      const sortedActivities = sortActivitiesByDateTime(deduplicatedActivities);
      
      setActivities(sortedActivities);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const sortActivitiesByDateTime = (activitiesList) => {
    return activitiesList.sort((a, b) => {
      const dateA = new Date(a.start_time);
      const dateB = new Date(b.start_time);
      return dateA - dateB;
    });
  };


  const formatTime = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('nl-NL', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleActivityClick = async (activityId) => {
    // Open modal for the clicked activity
    setModalActivityId(activityId);
    setIsModalOpen(true);

    // If we don't have details for this activity yet, fetch them
    if (!activityDetails[activityId]) {
      setLoadingDetails(prev => ({ ...prev, [activityId]: true }));
      try {
        const response = await activitiesService.getById(activityId);
        setActivityDetails(prev => ({ 
          ...prev, 
          [activityId]: response.data 
        }));
      } catch (err) {
        console.error('Failed to load activity details:', err);
        // Still allow modal to open but show error state
        setActivityDetails(prev => ({ 
          ...prev, 
          [activityId]: { error: 'Kon details niet laden' } 
        }));
      } finally {
        setLoadingDetails(prev => ({ ...prev, [activityId]: false }));
      }
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalActivityId(null);
    setIsModalTransitioning(false);
  };

  // Handle switching to a different activity within the modal
  const handleSwitchToActivity = async (activityId) => {
    // Start fade-out animation
    setIsModalTransitioning(true);
    
    // Wait for fade-out animation to complete
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Switch to new activity
    setModalActivityId(activityId);
    
    // Fetch activity details if we don't have them yet
    if (!activityDetails[activityId]) {
      setLoadingDetails(prev => ({ ...prev, [activityId]: true }));
      try {
        const response = await activitiesService.getById(activityId);
        setActivityDetails(prev => ({ 
          ...prev, 
          [activityId]: response.data 
        }));
      } catch (err) {
        console.error('Failed to load activity details:', err);
        setActivityDetails(prev => ({ 
          ...prev, 
          [activityId]: { error: 'Kon details niet laden' } 
        }));
      } finally {
        setLoadingDetails(prev => ({ ...prev, [activityId]: false }));
      }
    }
    
    // Wait a short moment for content to update, then start fade-in
    setTimeout(() => setIsModalTransitioning(false), 50);
  };

  // Handle unsubscribing from a conflicting activity
  const handleUnsubscribeFromConflict = async (activityId) => {
    // Get username with fallback to WordPress user
    const username = participant?.username || wordpressUser?.username;
    
    if (!username) {
      console.error('No username available for unsubscribe:', { participant, wordpressUser });
      showError('Gebruikersnaam niet gevonden. Probeer de pagina te vernieuwen.');
      return;
    }

    setSubscribingActivities(prev => ({ ...prev, [activityId]: true }));

    try {
      const result = await unsubscribeFromActivity(activityId, username);
      if (result.success) {
        showInfo('Je bent afgemeld voor deze activiteit');
        // The conflict will automatically disappear since user is no longer subscribed
      } else {
        console.error('Unsubscribe failed:', result);
        showError(result.error || 'Er is iets misgegaan bij het afmelden');
      }
    } catch (err) {
      console.error('Failed to unsubscribe from conflict:', err);
      showError(err.message || 'Er is iets misgegaan bij het afmelden');
    } finally {
      setSubscribingActivities(prev => ({ ...prev, [activityId]: false }));
    }
  };

  // Handle subscribing/unsubscribing from time slots
  const handleTimeSlotSubscribe = async (timeSlotActivityId) => {
    // Get username with fallback to WordPress user
    const username = participant?.username || wordpressUser?.username;
    
    if (!username) {
      console.error('No username available for time slot action:', { participant, wordpressUser });
      showError('Gebruikersnaam niet gevonden. Probeer de pagina te vernieuwen.');
      return;
    }

    const isSubscribed = isUserSubscribed(timeSlotActivityId);
    setSubscribingActivities(prev => ({ ...prev, [timeSlotActivityId]: true }));

    try {
      let result;
      
      if (isSubscribed) {
        result = await unsubscribeFromActivity(timeSlotActivityId, username);
        if (result.success) {
          showInfo('Je bent afgemeld voor dit tijdslot');
        }
      } else {
        result = await subscribeToActivity(timeSlotActivityId, username);
        if (result.success) {
          showInfo('Je bent aangemeld voor dit tijdslot');
        }
      }

      if (!result.success) {
        console.error('Time slot subscription failed:', result);
        showError(result.error || 'Er is iets misgegaan bij het aan-/afmelden');
      }
    } catch (err) {
      console.error('Failed to toggle time slot subscription:', err);
      showError(err.message || 'Er is iets misgegaan bij het aan-/afmelden');
    } finally {
      setSubscribingActivities(prev => ({ ...prev, [timeSlotActivityId]: false }));
    }
  };


  const getActivityStatus = (activity) => {
    // Check if user is subscribed (highest priority)
    if (isUserLoggedIn && isUserSubscribed(activity.id)) {
      return 'subscribed';
    }
    
    // Check if activity is full based on capacity data from /all endpoint
    const capacity = activity.capacity || activity.metadata?.max_participants;
    const currentSubscriptions = activity.current_subscriptions || activity.current_participants || 0;
    
    if (capacity && currentSubscriptions >= capacity) {
      return 'full';
    }
    
    // Check for time conflicts with user's subscribed activities
    if (isUserLoggedIn && getConflictingActivities(activity).length > 0) {
      return 'conflict';
    }
    
    return 'available';
  };

  // Get available time slots for an activity (same name, different times)
  const getActivityTimeSlots = (targetActivity) => {
    if (!targetActivity || !activities.length) return [];
    
    const titleHash = createTitleHash(targetActivity.name || targetActivity.title || '');
    if (!titleHash) return [];
    
    return activities
      .filter(activity => {
        // Exclude the current activity itself
        if (activity.id === targetActivity.id) return false;
        
        // Match by title hash
        const activityTitleHash = createTitleHash(activity.name || activity.title || '');
        return activityTitleHash === titleHash;
      })
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      .map(slot => ({
        ...slot,
        isSubscribed: isUserSubscribed(slot.id),
        status: getActivityStatus(slot),
        hasConflict: isUserLoggedIn ? getConflictingActivities(slot).length > 0 : false
      }));
  };

  // Check if activity is eligible for subscription (different from label-based eligibility)
  const isActivitySubscriptionEligible = (activity) => {
    // Only apply filtering for logged in users
    if (!isUserLoggedIn) return true;
    
    // Check if activity is full
    if (getActivityStatus(activity) === 'full') return false;
    
    // Check if user is already subscribed
    if (isUserSubscribed(activity.id)) return false;
    
    // Check for time overlaps with subscribed activities
    const subscribedActivities = getSubscribedActivities();
    const hasOverlap = subscribedActivities.some(subscribedActivity => 
      hasTimeOverlap(activity, subscribedActivity)
    );
    
    return !hasOverlap;
  };


  const handleResetWizard = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      'Weet je zeker dat je het keuzekompas opnieuw wilt doorlopen? Je huidige voorkeuren worden verwijderd.'
    );
    
    if (!confirmed) {
      return;
    }
    
    // Get username
    const username = participant?.username || wordpressUser?.username;
    
    if (!username) {
      showError('Gebruikersnaam niet gevonden. Probeer de pagina te vernieuwen.');
      return;
    }
    
    try {
      const result = await clearUserLabels(username);
      
      if (result.success) {
        showInfo('Je voorkeuren zijn gereset. Je wordt doorgestuurd naar het keuzekompas...');
        // The AppRouter will automatically redirect to wizard
        // since hasCompletedWizard will become false after profile refresh
      } else {
        showError(result.error || 'Er is iets misgegaan bij het resetten van je voorkeuren.');
      }
    } catch (error) {
      console.error('Failed to reset wizard:', error);
      showError('Er is iets misgegaan bij het resetten van je voorkeuren.');
    }
  };

  const handleSubscribeToggle = async (activityId) => {
    if (!isUserLoggedIn) {
      showError('Je moet ingelogd zijn om je aan te melden voor activiteiten');
      return;
    }

    // Get username with fallback to WordPress user
    const username = participant?.username || wordpressUser?.username;
    
    if (!username) {
      console.error('No username available:', { participant, wordpressUser });
      showError('Gebruikersnaam niet gevonden. Probeer de pagina te vernieuwen.');
      return;
    }

    setSubscribingActivities(prev => ({ ...prev, [activityId]: true }));

    try {
      const isSubscribed = isUserSubscribed(activityId);
      let result;
      
      if (isSubscribed) {
        result = await unsubscribeFromActivity(activityId, username);
        if (result.success) {
          showInfo('Je bent afgemeld voor deze activiteit');
        }
      } else {
        result = await subscribeToActivity(activityId, username);
        if (result.success) {
          showInfo('Je bent aangemeld voor deze activiteit');
        }
      }

      if (!result.success) {
        console.error('Subscription failed:', result);
        showError(result.error || 'Er is iets misgegaan bij het aan-/afmelden');
      }
    } catch (err) {
      console.error('Failed to toggle subscription:', err);
      showError(err.message || 'Er is iets misgegaan bij het aan-/afmelden');
    } finally {
      setSubscribingActivities(prev => ({ ...prev, [activityId]: false }));
    }
  };

  const renderSimpleList = () => {
    if (processedSimpleActivities.length === 0) {
      return <h2 className="no-activities">Geen activiteiten</h2>;
    }

    return (
      <ul className="simple-activities-list">
        {processedSimpleActivities.map(activity => (
          <li key={activity.id} className="simple-activity-item">
            <div 
              className="simple-activity-header"
              onClick={() => handleActivityClick(activity.id)}
            >
              <span className="simple-activity-title">{activity.name}</span>
              {activity.location && (
                <span className="simple-activity-location">@ {activity.location}</span>
              )}
              {activity.type && (
                <span className="simple-activity-type">({activity.type})</span>
              )}
              {isUserLoggedIn && <StatusIndicator status={getActivityStatus(activity)} />}
              <span className="expand-indicator">
                <ChevronRight />
              </span>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  if (loading) {
    return (
      <div className="activities-list-page">
        <h1>{window.FestivalWizardData?.activitiesTitle || 'Scout-in Activiteiten'}</h1>
        <p>Activiteiten laden...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="activities-list-page">
        <h1>{window.FestivalWizardData?.activitiesTitle || 'Scout-in Activiteiten'}</h1>
        <div className="error-message" style={{ color: 'red', marginBottom: '20px' }}>
          Fout bij het laden van activiteiten: {error}
        </div>
        <button onClick={loadActivities}>Opnieuw proberen</button>
      </div>
    );
  }


  return (
    <div className="activities-list-page">
      <h1>{window.FestivalWizardData?.activitiesTitle || 'Scout-in Activiteiten'}</h1>
      <p>
        {window.FestivalWizardData?.activitiesIntro || 'Hier vind je alle activiteiten van Scout-in. Je kunt de activiteiten bekijken en beheren in deze lijst.'}
      </p>

      {/* Reset Wizard Button - only show for logged-in users who have completed wizard */}
      {isUserLoggedIn && hasCompletedWizard && (
        <div className="reset-wizard-container" style={{ marginBottom: '20px', marginTop: '64px' }}>
          <span className="text-sm text-right">
            Op zoek naar nieuwe suggesties?<br />Start dan het keuzekompas.
          </span>
          <button 
            className="reset-wizard-button ml-3 w-10 h-10 inline-block text-center"
            style={{ padding: '0px' }}
            onClick={handleResetWizard}
            title="Wil je opnieuw het keuzekompas doorlopen voor nieuwe suggesties, start dan het keuzekompas."
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
            </svg>
          </button>
          
        </div>
      )}

      {/* Personalized Suggestions Block */}
      <SuggestionsBlock 
        activities={activities}
        tracks={tracks}
        onTrackFilterApply={(trackId) => {
          setSelectedTrackId(trackId);
        }}
        onViewModeChange={(isSimple) => {
          setIsSimpleView(isSimple);
        }}
      />

      

      {/* Combined Header with Title and Filters */}
      <div className="main-filter-container content-header">
        <h2>Filters</h2>

        <div className="filters-container" role="group" aria-label="Filter activiteiten">
{/* Track Filter - Top Row */}
          {tracks && tracks.length > 0 && (
            <div className="track-filter" style={{ marginBottom: '12px' }}>
              <label htmlFor="track-dropdown" style={{ 
                fontSize: '0.9rem', 
                fontWeight: '500', 
                color: '#2d3748', 
                display: 'inline-block',
                marginBottom: '4px',
                marginRight: '12px'
              }}>
              <strong>Track:</strong>
              {isTrackAutoSelected && (
                <span style={{ 
                  fontSize: '0.8rem', 
                  color: '#667eea', 
                  fontWeight: 'normal',
                  marginLeft: '8px'
                }}>
                  (aanbeveling)
                </span>
              )}
              </label>
              <select 
                id="track-dropdown"
                value={selectedTrackId}
                onChange={(e) => {
                  setSelectedTrackId(e.target.value);
                  setIsTrackAutoSelected(false); // User manually selected, no longer auto-selected
                  // Track filter can now be combined with other filters
                  // No need to reset other filters
                }}
                style={{
                  display: 'inline-block',
                  fontSize: '0.9rem',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  color: '#374151',
                  cursor: 'pointer',
                  minWidth: '120px',
                  marginRight: '12px',
                  width: '100%',
                }}
                aria-label="Selecteer een track om activiteiten te filteren"
              >
                <option value="">Alle tracks</option>
                {tracks.map(track => (
                  <option key={track.id} value={track.id}>
                    {track.title || track.name || track.description || `Track ${track.id}`}
                  </option>
                ))}
              </select>
              {isTrackAutoSelected && selectedTrackId && (
                <button
                  onClick={() => {
                    setSelectedTrackId('');
                    setIsTrackAutoSelected(false);
                  }}
                  style={{
                    marginLeft: '8px',
                    padding: '4px 8px',
                    fontSize: '0.8rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: '#f8f9fa',
                    color: '#6c757d',
                    cursor: 'pointer'
                  }}
                  title="Reset track filter"
                >
                  Reset
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="filters-container" role="group" aria-label="Filter activiteiten">
          

          <div className="filter-toggles">
            {/* My Schedule Filter */}
            {isUserLoggedIn && (
              <ToggleSwitch
                label="Mijn Schema"
                checked={showMyScheduleOnly}
                onChange={(checked) => {
                  setShowMyScheduleOnly(checked);
                  // Disable eligibility filter when showing schedule, but keep track filter
                  if (checked) {
                    setShowEligibleOnly(false);
                    // Reset track filter to "Alle tracks" when showing personal schedule
                    setSelectedTrackId('');
                    // Enable calendar view for better schedule visualization
                    setIsSimpleView(false);
                  }
                }}
                ariaLabel="Toon alleen mijn schema"
              />
            )}
            
            {/* Eligibility Filter */}
            {isUserLoggedIn && !showMyScheduleOnly && (
              <ToggleSwitch
                label="Alleen Beschikbaar"
                checked={showEligibleOnly}
                onChange={setShowEligibleOnly}
                ariaLabel="Toon alleen beschikbare activiteiten"
              />
            )}
            
            {/* View Toggle */}
            <ToggleSwitch
              label="Kalender Weergave"
              checked={!isSimpleView}
              onChange={(checked) => setIsSimpleView(!checked)}
              ariaLabel="Schakel tussen lijst en kalender weergave"
            />
          </div>
        </div>
      </div>

<div className="content-status">
          <h2 className="filter-status-title">
            {showMyScheduleOnly 
              ? 'Mijn Schema' 
              : showEligibleOnly 
                ? 'Beschikbare activiteiten'
                : isSimpleView 
                  ? 'Activiteiten uniek'
                  : 'Activiteiten volledig'
            }
          </h2>
        </div>

      {/* Content based on view mode */}
      {isSimpleView ? (
        activities.length === 0 ? (
          <h2 className="no-activities">Geen activiteiten</h2>
        ) : (
          renderSimpleList()
        )
      ) : (
        Object.keys(groupedActivities).length === 0 ? (
          <h2 className="no-activities">Geen activiteiten</h2>
        ) : (
        Object.entries(groupedActivities).map(([dayKey, dayActivities]) => (
          <div key={dayKey} className="day-section">
            <h2>{formatDate(dayKey)}</h2>
            <ul className="simple-activities-list">
              {dayActivities.map(activity => (
                <li key={activity.id} className="simple-activity-item">
                  <div 
                    className="simple-activity-header"
                    onClick={() => handleActivityClick(activity.id)}
                  >
                    {activity.start_time && activity.end_time && (
                      <span className="activity-time" style={{ color: '#6c757d', fontSize: '0.9rem', fontWeight: '400', minWidth: '75px', marginRight: '8px', display: 'inline-block' }}>
                        {formatTime(activity.start_time)}-{formatTime(activity.end_time)}
                      </span>
                    )}
                    <span className="simple-activity-title" style={{ fontWeight: 'normal' }}>{activity.name}</span>
                    {activity.location && (
                      <span className="simple-activity-location">@ {activity.location}</span>
                    )}
                    {activity.type && (
                      <span className="simple-activity-type">({activity.type})</span>
                    )}
                    {isUserLoggedIn && <StatusIndicator status={getActivityStatus(activity)} />}
                    <span className="expand-indicator">
                      <ChevronRight />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
        )
      )}
      
      {/* Activity Details Modal */}
      <ActivityDetailsModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        activity={modalActivityId ? activities.find(a => a.id === modalActivityId) : null}
        activityDetails={activityDetails}
        isLoading={loadingDetails[modalActivityId]}
        isUserLoggedIn={isUserLoggedIn}
        isUserSubscribed={isUserSubscribed}
        isSubscribing={subscribingActivities}
        conflictingActivities={modalActivityId ? getConflictingActivities(activities.find(a => a.id === modalActivityId) || {}) : []}
        getActivityStatus={getActivityStatus}
        handleSubscribeToggle={handleSubscribeToggle}
        formatTime={formatTime}
        onSwitchToActivity={handleSwitchToActivity}
        isTransitioning={isModalTransitioning}
        onUnsubscribeFromConflict={handleUnsubscribeFromConflict}
        availableTimeSlots={modalActivityId ? getActivityTimeSlots(activities.find(a => a.id === modalActivityId) || {}) : []}
        onTimeSlotSubscribe={handleTimeSlotSubscribe}
      />
    </div>
  );
};

export default ActivitiesListPage;
