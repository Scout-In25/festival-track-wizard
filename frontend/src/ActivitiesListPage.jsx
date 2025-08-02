import React, { useState, useEffect } from 'react';
import { activitiesService } from './services/api/activitiesService.js';
import { useDataContext } from './contexts/DataProvider.jsx';
import { useToast } from './hooks/useToast';
import { validateActivities, deduplicateActivitiesByTitleAndTime, analyzeDuplicates, deduplicateActivities, createTitleHash } from './utils/activityDeduplication.js';
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
      default: return '#6c757d';
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'subscribed': return 'Aangemeld';
      case 'full': return 'Vol';
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
  const [expandedActivityId, setExpandedActivityId] = useState(null);
  const [activityDetails, setActivityDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});
  const [isSimpleView, setIsSimpleView] = useState(true);
  const [showEligibleOnly, setShowEligibleOnly] = useState(false);
  const [showMyScheduleOnly, setShowMyScheduleOnly] = useState(false);
  const [subscribingActivities, setSubscribingActivities] = useState({});
  
  const { participant, isUserLoggedIn, subscribeToActivity, unsubscribeFromActivity } = useDataContext();
  const { showInfo, showError } = useToast();

  useEffect(() => {
    loadActivities();
  }, []);

  // Development mock data overrides
  const applyDevMockData = (activitiesList) => {
    if (!import.meta.env.DEV) return activitiesList;
    
    return activitiesList.map(activity => {
      // Mock specific activity as full for testing
      if (activity.id === '8af471b0-5122-4c28-a638-98fba3c07455') {
        console.log('🔧 DEV: Mocking activity as full:', activity.name || activity.title);
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
      console.info('Duplicate analysis:', duplicateAnalysis);
      
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

  // Simple view processing functions
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
    // If clicking on already expanded activity, collapse it
    if (expandedActivityId === activityId) {
      setExpandedActivityId(null);
      return;
    }

    // Expand the clicked activity
    setExpandedActivityId(activityId);

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
        // Still allow expansion but show error state
        setActivityDetails(prev => ({ 
          ...prev, 
          [activityId]: { error: 'Kon details niet laden' } 
        }));
      } finally {
        setLoadingDetails(prev => ({ ...prev, [activityId]: false }));
      }
    }
  };

  const isUserSubscribed = (activityId) => {
    return participant?.activities?.includes(activityId) || false;
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
    
    return 'available';
  };

  // Time overlap utility function
  const hasTimeOverlap = (activity1, activity2) => {
    const start1 = new Date(activity1.start_time);
    const end1 = new Date(activity1.end_time);
    const start2 = new Date(activity2.start_time);
    const end2 = new Date(activity2.end_time);
    return start1 < end2 && start2 < end1;
  };

  // Get full activity objects for user's subscribed activities
  const getSubscribedActivities = () => {
    if (!participant?.activities || !activities.length) return [];
    return activities.filter(activity => participant.activities.includes(activity.id));
  };

  // Check if activity is eligible for subscription
  const isActivityEligible = (activity) => {
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

  // Apply eligibility filter to activities list
  const applyEligibilityFilter = (activitiesList) => {
    if (!showEligibleOnly) return activitiesList;
    return activitiesList.filter(activity => isActivityEligible(activity));
  };

  // Apply schedule filter to show only subscribed activities
  const applyScheduleFilter = (activitiesList) => {
    if (!showMyScheduleOnly) return activitiesList;
    return activitiesList.filter(activity => isUserSubscribed(activity.id));
  };

  const handleSubscribeToggle = async (activityId) => {
    if (!isUserLoggedIn || !participant?.username) {
      showError('Je moet ingelogd zijn om je aan te melden voor activiteiten');
      return;
    }

    setSubscribingActivities(prev => ({ ...prev, [activityId]: true }));

    try {
      const isSubscribed = isUserSubscribed(activityId);
      let result;
      
      if (isSubscribed) {
        result = await unsubscribeFromActivity(activityId, participant.username);
        if (result.success) {
          showInfo('Je bent afgemeld voor deze activiteit');
        }
      } else {
        result = await subscribeToActivity(activityId, participant.username);
        if (result.success) {
          showInfo('Je bent aangemeld voor deze activiteit');
        }
      }

      if (!result.success) {
        showError(result.error || 'Er is iets misgegaan bij het aan-/afmelden');
      }
    } catch (err) {
      console.error('Failed to toggle subscription:', err);
      showError(err.message || 'Er is iets misgegaan bij het aan-/afmelden');
    } finally {
      setSubscribingActivities(prev => ({ ...prev, [activityId]: false }));
    }
  };

  const renderActivityDetails = (activity) => {
    const details = activityDetails[activity.id];
    const isLoading = loadingDetails[activity.id];
    const isSubscribed = isUserSubscribed(activity.id);
    const isSubscribing = subscribingActivities[activity.id];

    if (isLoading) {
      return (
        <div className="activity-details-content">
          <p>Details laden...</p>
        </div>
      );
    }

    if (!details) {
      return null;
    }

    if (details.error) {
      return (
        <div className="activity-details-content">
          <p className="error-text">{details.error}</p>
        </div>
      );
    }

    return (
      <div className="activity-details-content" data-activity-id={activity.id}>
        {details.description && (
          <div className="detail-section">
            <h4>Beschrijving</h4>
            <p>{details.description}</p>
          </div>
        )}
        

        {details.image_url && (
          <div className="detail-section">
            <h4>Afbeelding</h4>
            <img 
              src={details.image_url} 
              alt={details.name || activity.name}
              className="activity-image"
            />
          </div>
        )}


        {isUserLoggedIn && (
          <div className="schedule-section" style={{ 
            marginTop: '20px', 
            padding: '16px', 
            backgroundColor: '#f8f9ff', 
            borderRadius: '8px', 
            border: '1px solid #e1e5f2' 
          }}>
            <div style={{ marginBottom: '12px' }}>
              <h4 style={{ 
                margin: '0 0 4px 0', 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#2d3748',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {isSubscribed ? '✓ In je schema' : 
                 getActivityStatus(activity) === 'full' ? '❌ Activiteit vol' : 
                 '📅 Voeg toe aan je schema'}
              </h4>
              <p style={{ 
                margin: '0', 
                fontSize: '13px', 
                color: '#64748b',
                lineHeight: '1.4'
              }}>
                {isSubscribed 
                  ? 'Deze activiteit staat in je persoonlijke schema' 
                  : getActivityStatus(activity) === 'full' 
                    ? 'Deze activiteit heeft geen vrije plekken meer'
                    : 'Voeg deze activiteit toe aan je persoonlijke schema'
                }
              </p>
            </div>
            
            {getActivityStatus(activity) === 'full' && !isSubscribed ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                backgroundColor: '#e5e7eb',
                color: '#6b7280',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                width: '100%',
                justifyContent: 'center'
              }}>
                <span>🚫</span>
                Activiteit is vol
              </div>
            ) : (
              <button 
                onClick={() => handleSubscribeToggle(activity.id)}
                disabled={isSubscribing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  backgroundColor: isSubscribed ? '#f59e0b' : '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isSubscribing ? 'not-allowed' : 'pointer',
                  opacity: isSubscribing ? 0.6 : 1,
                  fontSize: '15px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  width: '100%',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  if (!isSubscribing) {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubscribing) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }
                }}
              >
                {isSubscribing ? (
                  <>
                    <div style={{ 
                      width: '16px', 
                      height: '16px', 
                      border: '2px solid transparent',
                      borderTop: '2px solid currentColor',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Even geduld...
                  </>
                ) : isSubscribed ? (
                  <>
                    <CalendarCheckIcon />
                    Verwijder uit schema
                  </>
                ) : (
                  <>
                    <CalendarPlusIcon />
                    Voeg toe aan schema
                  </>
                )}
              </button>
            )}
            
            {(activity.capacity || activity.metadata?.max_participants) && (
              <p style={{ 
                margin: '8px 0 0 0', 
                fontSize: '12px', 
                color: '#64748b',
                textAlign: 'center'
              }}>
                📍 {activity.current_subscriptions || activity.current_participants || 0} van {activity.capacity || activity.metadata?.max_participants} plekken bezet
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSimpleList = (activitiesList) => {
    // Process activities for simple view: deduplicate by title and sort alphabetically
    const validActivities = validateActivities(activitiesList);
    let filteredActivities = applyEligibilityFilter(validActivities);
    filteredActivities = applyScheduleFilter(filteredActivities);
    const uniqueActivities = deduplicateByTitleOnly(filteredActivities);
    const sortedActivities = sortActivitiesAlphabetically(uniqueActivities);

    return (
      <ul className="simple-activities-list">
        {sortedActivities.map(activity => (
          <li key={activity.id} className={`simple-activity-item ${expandedActivityId === activity.id ? 'expanded' : ''}`}>
            <div 
              className="simple-activity-header"
              onClick={() => handleActivityClick(activity.id)}
            >
              <span className="simple-activity-title" style={{ fontWeight: expandedActivityId === activity.id ? 'bold' : 'normal' }}>{activity.name}</span>
              {activity.location && (
                <span className="simple-activity-location">@ {activity.location}</span>
              )}
              {activity.type && (
                <span className="simple-activity-type">({activity.type})</span>
              )}
              {isUserLoggedIn && <StatusIndicator status={getActivityStatus(activity)} />}
              <span className="expand-indicator">
                {expandedActivityId === activity.id ? <ChevronDown /> : <ChevronRight />}
              </span>
            </div>
            <div className={`activity-details ${expandedActivityId === activity.id ? 'expanded' : ''}`}>
              {expandedActivityId === activity.id && renderActivityDetails(activity)}
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

  // Apply filters before grouping for calendar view
  let filteredActivities = applyEligibilityFilter(activities);
  filteredActivities = applyScheduleFilter(filteredActivities);
  const groupedActivities = groupActivitiesByDay(filteredActivities);

  return (
    <div className="activities-list-page">
      <h1>{window.FestivalWizardData?.activitiesTitle || 'Scout-in Activiteiten'}</h1>
      <p>
        {window.FestivalWizardData?.activitiesIntro || 'Hier vind je alle activiteiten van scout-in, chronologisch geordend per dag en tijd. Klik op een activiteit voor meer informatie.'}
      </p>

      {/* Combined Header with Title and Filters */}
      <div className="content-header">
        <div className="content-status">
          <h2 className="filter-status-title">
            {showMyScheduleOnly 
              ? 'Mijn Schema' 
              : showEligibleOnly 
                ? 'Beschikbaar'
                : 'Volledig'
            }
          </h2>
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
                  // Disable other filters when showing schedule
                  if (checked) {
                    setShowEligibleOnly(false);
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

      {/* Content based on view mode */}
      {isSimpleView ? (
        activities.length === 0 ? (
          <p>Geen activiteiten gevonden.</p>
        ) : (
          renderSimpleList(activities)
        )
      ) : (
        Object.keys(groupedActivities).length === 0 ? (
          <p>Geen activiteiten gevonden.</p>
        ) : (
        Object.entries(groupedActivities).map(([dayKey, dayActivities]) => (
          <div key={dayKey} className="day-section">
            <h2>{formatDate(dayKey)}</h2>
            <ul className="activities-list">
              {dayActivities.map(activity => (
                <li key={activity.id} className={`activity-item ${expandedActivityId === activity.id ? 'expanded' : ''}`}>
                  <div 
                    className="activity-header"
                    onClick={() => handleActivityClick(activity.id)}
                  >
                    <span className="activity-time">
                      {formatTime(activity.start_time)} - {formatTime(activity.end_time)}
                    </span>
                    <span className="activity-title" style={{ fontWeight: expandedActivityId === activity.id ? 'bold' : 'normal' }}>{activity.name}</span>
                    {activity.location && (
                      <span className="activity-location">@ {activity.location}</span>
                    )}
                    {activity.type && (
                      <span className="activity-type">({activity.type})</span>
                    )}
                    {isUserLoggedIn && <StatusIndicator status={getActivityStatus(activity)} />}
                    <span className="expand-indicator">
                      {expandedActivityId === activity.id ? <ChevronDown /> : <ChevronRight />}
                    </span>
                  </div>
                  
                  <div className={`activity-details ${expandedActivityId === activity.id ? 'expanded' : ''}`}>
                    {expandedActivityId === activity.id && renderActivityDetails(activity)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
        )
      )}
    </div>
  );
};

export default ActivitiesListPage;
