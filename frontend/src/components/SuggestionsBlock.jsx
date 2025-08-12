import React, { useState, useEffect, useRef } from 'react';
import { useDataContext } from '../contexts/DataProvider.jsx';
import { useToast } from '../hooks/useToast';
import ActivityDetailsModal from './ActivityDetailsModal.jsx';
import { activitiesService } from '../services/api/activitiesService.js';
import { deduplicateActivities } from '../utils/activityDeduplication.js';

// Chevron icons for toggle
const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
  </svg>
);

const ChevronUp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 15l-6-6-6 6" />
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

const SuggestionsBlock = ({ activities, tracks, onTrackFilterApply, onViewModeChange }) => {
  const {
    suggestions,
    suggestionsLoading,
    suggestionsError,
    isUserLoggedIn,
    participant,
    hasCompletedWizard,
    subscribeToTrack,
    unsubscribeFromTrack,
    subscribeToActivity,
    unsubscribeFromActivity,
    wordpressUser
  } = useDataContext();
  const { showInfo, showError } = useToast();

  // Loading state for track subscription
  const [isSubscribing, setIsSubscribing] = useState(false);
  
  // Loading state for individual activity subscriptions
  const [subscribingActivities, setSubscribingActivities] = useState({});
  
  // Track if we've already applied the suggested track filter to prevent overriding manual changes
  const hasAppliedSuggestedFilter = useRef(false);

  // Modal state management
  const [modalActivityId, setModalActivityId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalTransitioning, setIsModalTransitioning] = useState(false);
  const [activityDetails, setActivityDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});

  // Visibility state for suggestions container
  const [isVisible, setIsVisible] = useState(true);

  const getTrackById = (trackId) => {
    return tracks.find(track => track.id === trackId) || null;
  };

  const getActivityById = (activityId) => {
    return activities.find(activity => activity.id === activityId) || null;
  };

  // Check if user is subscribed to a specific activity
  const isUserSubscribed = (activityId) => {
    if (!participant || !participant.activities || !Array.isArray(participant.activities)) {
      return false;
    }
    return participant.activities.includes(activityId);
  };

  // Time overlap utility function
  const hasTimeOverlap = (activity1, activity2) => {
    const start1 = new Date(activity1.start_time);
    const end1 = new Date(activity1.end_time);
    const start2 = new Date(activity2.start_time);
    const end2 = new Date(activity2.end_time);
    return start1 < end2 && start2 < end1;
  };

  // Get user's subscribed activities
  const getSubscribedActivities = () => {
    if (!participant?.activities || !activities.length) return [];
    return activities.filter(activity => participant.activities.includes(activity.id));
  };

  // Get activities that have time conflicts with the target activity
  const getConflictingActivities = (targetActivity) => {
    // Only check conflicts for logged-in users who aren't already subscribed to this activity
    if (!isUserLoggedIn || isUserSubscribed(targetActivity.id)) return [];
    
    const subscribedActivities = getSubscribedActivities();
    return subscribedActivities.filter(subscribedActivity => 
      hasTimeOverlap(targetActivity, subscribedActivity)
    );
  };

  // Get activity status for display (subscribed, full, conflict, available)
  const getActivityStatus = (activity) => {
    // Check if user is subscribed (highest priority)
    if (isUserLoggedIn && isUserSubscribed(activity.id)) {
      return 'subscribed';
    }
    
    // Check if activity is full based on capacity data
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

  // Don't show suggestions block if user is not logged in or hasn't completed wizard
  if (!isUserLoggedIn || !hasCompletedWizard) {
    return null;
  }

  // Don't show anything while loading or if there's an error
  if (suggestionsLoading || suggestionsError || !suggestions) {
    return null;
  }

  // Get suggested data with fallbacks
  const suggestedTracks = suggestions.suggested_tracks || suggestions.tracks || [];
  const suggestedActivities = suggestions.suggested_activities || suggestions.activities || [];


  // Don't show the block if there are no suggestions
  if (suggestedTracks.length === 0 && suggestedActivities.length === 0) {
    return null;
  }

  // Get first track suggestion
  let firstTrackSuggestion = suggestedTracks.length > 0 ? suggestedTracks[0] : null;
  firstTrackSuggestion =  getTrackById(firstTrackSuggestion.track_id) || firstTrackSuggestion;

  // Check if user is already subscribed to a track (has track_id filled)
  const isUserSubscribedToTrack = Boolean(participant?.track_id);
  const userTrackId = participant?.track_id;

  // Auto-apply suggested track filter only once to avoid overriding manual changes
  useEffect(() => {
    if (firstTrackSuggestion && onTrackFilterApply && !hasAppliedSuggestedFilter.current) {
      hasAppliedSuggestedFilter.current = true;
      
      onTrackFilterApply(firstTrackSuggestion.id);
      
      // Switch to calendar view for better track visualization
      if (onViewModeChange) {
        onViewModeChange(false); // false = calendar view, true = simple list view
      }
    }
  }, [firstTrackSuggestion?.id, onTrackFilterApply, onViewModeChange]);


  // First enrich activities with full data, then deduplicate, then take first 10
  const enrichedActivities = suggestedActivities.map(activity => {
    if (activity && activity.activity_id) {
      const act = getActivityById(activity.activity_id);
      if (act && typeof act === 'object' && !Array.isArray(act)) {
        try {
          // Merge full activity data for deduplication
          return { ...activity, ...act };
        } catch (error) {
          console.warn('Error merging activity data:', error, { activity, act });
        }
      }
    }
    return activity;
  });
  
  // Now deduplicate with enriched data that has proper name/title fields
  const uniqueSuggestedActivities = deduplicateActivities(enrichedActivities);
  const firstTenActivities = uniqueSuggestedActivities.slice(0, 10);

  // Track subscription handler
  const handleTrackSubscription = async () => {
    if (!firstTrackSuggestion) {
      showError('Geen track gevonden om aan te melden');
      return;
    }

    // Get username with fallback
    const username = participant?.username || wordpressUser?.username;
    
    if (!username) {
      console.error('No username available for track subscription:', { participant, wordpressUser });
      showError('Gebruikersnaam niet gevonden. Probeer de pagina te vernieuwen.');
      return;
    }

    setIsSubscribing(true);

    try {
      const result = await subscribeToTrack(firstTrackSuggestion.id, username);
      
      if (result.success) {
        showInfo('Je bent aangemeld voor deze track!');
        
        // Optionally maintain the track filter + calendar view behavior
        if (onTrackFilterApply) {
          onTrackFilterApply(firstTrackSuggestion.id);
        }
        if (onViewModeChange) {
          onViewModeChange(false); // Switch to calendar view
        }
      } else {
        console.error('Track subscription failed:', result);
        showError(result.error || 'Er is iets misgegaan bij het aanmelden voor de track');
      }
    } catch (error) {
      console.error('Track subscription error:', error);
      showError(error.message || 'Er is iets misgegaan bij het aanmelden voor de track');
    } finally {
      setIsSubscribing(false);
    }
  };

  // Track unsubscription handler
  const handleTrackUnsubscription = async () => {
    // Get username with fallback
    const username = participant?.username || wordpressUser?.username;
    
    if (!username) {
      console.error('No username available for track unsubscription:', { participant, wordpressUser });
      showError('Gebruikersnaam niet gevonden. Probeer de pagina te vernieuwen.');
      return;
    }

    setIsSubscribing(true);

    try {
      const result = await unsubscribeFromTrack(username);
      
      if (result.success) {
        showInfo('Je bent afgemeld van de track!');
      } else {
        console.error('Track unsubscription failed:', result);
        showError(result.error || 'Er is iets misgegaan bij het afmelden van de track');
      }
    } catch (error) {
      console.error('Track unsubscription error:', error);
      showError(error.message || 'Er is iets misgegaan bij het afmelden van de track');
    } finally {
      setIsSubscribing(false);
    }
  };

  // Activity subscription/unsubscription handler
  const handleActivitySubscription = async (activityId) => {
    const username = participant?.username || wordpressUser?.username;
    
    if (!username) {
      console.error('No username available for activity subscription:', { participant, wordpressUser });
      showError('Gebruikersnaam niet gevonden. Probeer de pagina te vernieuwen.');
      return;
    }

    const isSubscribed = isUserSubscribed(activityId);
    
    setSubscribingActivities(prev => ({ ...prev, [activityId]: true }));

    try {
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
        console.error('Activity subscription failed:', result);
        showError(result.error || 'Er is iets misgegaan bij het aan-/afmelden');
      }
    } catch (error) {
      console.error('Activity subscription error:', error);
      showError(error.message || 'Er is iets misgegaan bij het aan-/afmelden');
    } finally {
      setSubscribingActivities(prev => ({ ...prev, [activityId]: false }));
    }
  };

  // Activity click handler to open modal
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

  // Time formatting utility
  const formatTime = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('nl-NL', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Handle activity subscribe/unsubscribe from modal
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

  // Get available time slots for an activity (same name, different times)
  const getActivityTimeSlots = (targetActivity) => {
    if (!targetActivity || !activities.length) return [];
    
    // For now, return empty array - time slots functionality can be enhanced later
    return [];
  };

  const handleTrackFilterClick = () => {
    if (firstTrackSuggestion && onTrackFilterApply) {
      onTrackFilterApply(firstTrackSuggestion.id);
    }
  };


  return (
    <div className="suggestions-block">
      <div className="suggestions-content">
        <div className="suggestions-section">
          <div 
            className="suggestions-section-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '0'
            }}
            onClick={() => setIsVisible(!isVisible)}
          >
            <h4 style={{ margin: 0 }}>Suggesties</h4>
            <button
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: '#6c757d',
                fontSize: '4rem',
                gap: '4px',
                padding: '8px 8px',
              }}
              title={isVisible ? 'Verberg suggesties' : 'Toon suggesties'}
            >

              {isVisible ? <ChevronUp /> : <ChevronDown />}
            </button>
          </div>
          
          {/* Collapsible content */}
          <div 
            style={{
              overflow: 'hidden',
              transition: 'all 0.3s ease-in-out',
              maxHeight: isVisible ? '2000px' : '0',
              opacity: isVisible ? 1 : 0
            }}
          >
            <p style={{ 
              color: '#6c757d', 
              marginBottom: '24px',
              marginTop: '8px',
              fontSize: '0.9rem',
              lineHeight: '1.5'
            }}>
              We hebben suggesties voor jouw profiel gevonden. Meld je aan bij onze aanbevolen track, of bij een van onze aanbevolen activiteiten.
              Je kunt er ook altijd voor kiezen om de activiteiten zelf te bekijken en in te plannen.
            </p>

          {/* Track Suggestion */}
          {firstTrackSuggestion && (
            <div style={{ marginBottom: '20px' }}>
              <h5 style={{ 
                color: '#2c3e50', 
                fontSize: '1rem', 
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                Aanbevolen Track
              </h5>
              <div className="suggestedtrack suggestion-compact-item" style={{ marginBottom: '32px', border: '1px solid #ddd', borderRadius: '6px' }}>
                <div className="suggestion-compact-content">
                  <div className="suggestion-compact-title">
                    {firstTrackSuggestion.name}
                  </div>
                  <div className="suggestion-compact-description">
                    {firstTrackSuggestion.description || 'Geen beschrijving beschikbaar'}
                  </div>
                </div>
                <button
                  className="suggestion-compact-button track-button"
                  onClick={isUserSubscribedToTrack ? handleTrackUnsubscription : handleTrackSubscription}
                  disabled={isSubscribing}
                  style={{
                    background: isSubscribing 
                      ? '#6c757d' 
                      : isUserSubscribedToTrack
                        ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'  // Red for unsubscribe
                        : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',  // Green for subscribe
                    color: 'white',
                    fontSize: '0.85rem',
                    cursor: isSubscribing ? 'not-allowed' : 'pointer',
                    opacity: isSubscribing ? 0.7 : 1
                  }}
                >
                  {isSubscribing 
                    ? (isUserSubscribedToTrack ? 'Afmelden...' : 'Aanmelden...')
                    : (isUserSubscribedToTrack ? 'Afmelden' : 'Aanmelden')
                  }
                </button>
              </div>
            </div>
          )}

          {/* Activity Suggestions */}
          {firstTenActivities.length > 0 && (
            <div>
              <h5 style={{ 
                color: '#2c3e50', 
                fontSize: '1rem', 
                fontWeight: '600',
                marginBottom: '12px'
              }}>
                Aanbevolen Activiteiten
              </h5>
              
              <div className="suggestions-compact-list">
                {firstTenActivities.map((activity, index) => (
                  <div 
                    key={activity.id || index}
                    className={`suggestion-compact-item ${index % 2 === 1 ? 'even' : ''}`}
                    onClick={() => activity.id && handleActivityClick(activity.id)}
                    style={{
                      cursor: activity.id ? 'pointer' : 'default'
                    }}
                  >
                    <div className="suggestion-compact-content">
                      <div className="suggestion-compact-title">
                        {activity.name || `Activiteit ${index + 1}`}
                      </div>
                     
                    </div>
                    
                    {/* Status indicator for activity */}
                    {activity.id && isUserLoggedIn && (
                      <StatusIndicator status={getActivityStatus(activity)} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          </div> {/* End of collapsible content */}
        </div>
      </div>
      
      {/* Activity Details Modal */}
      <ActivityDetailsModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        activity={modalActivityId ? firstTenActivities.find(a => a.id === modalActivityId) : null}
        activityDetails={activityDetails}
        isLoading={loadingDetails[modalActivityId]}
        isUserLoggedIn={isUserLoggedIn}
        isUserSubscribed={isUserSubscribed}
        isSubscribing={subscribingActivities}
        conflictingActivities={modalActivityId ? getConflictingActivities(firstTenActivities.find(a => a.id === modalActivityId) || {}) : []}
        getActivityStatus={getActivityStatus}
        handleSubscribeToggle={handleSubscribeToggle}
        formatTime={formatTime}
        onSwitchToActivity={handleSwitchToActivity}
        isTransitioning={isModalTransitioning}
        onUnsubscribeFromConflict={handleUnsubscribeFromConflict}
        availableTimeSlots={modalActivityId ? getActivityTimeSlots(firstTenActivities.find(a => a.id === modalActivityId) || {}) : []}
        onTimeSlotSubscribe={handleTimeSlotSubscribe}
      />
    </div>
  );
};

export default SuggestionsBlock;