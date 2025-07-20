import React, { useState, useEffect } from 'react';
import { activitiesService } from './services/api/activitiesService.js';
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

// View toggle icons
const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2.5H3c-.83 0-1.5.67-1.5 1.5v9c0 .83.67 1.5 1.5 1.5h10c.83 0 1.5-.67 1.5-1.5V4c0-.83-.67-1.5-1.5-1.5zM1.5 6.5h13M5 1v3M11 1v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const ActivitiesListPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedActivityId, setExpandedActivityId] = useState(null);
  const [activityDetails, setActivityDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});
  const [isSimpleView, setIsSimpleView] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await activitiesService.getAll();
      const rawActivities = response.data || [];
      
      // Step 1: Validate activities and remove bad entries
      const validActivities = validateActivities(rawActivities);
      
      // Step 2: Analyze duplicates after validation
      const duplicateAnalysis = analyzeDuplicates(validActivities);
      console.info('Duplicate analysis:', duplicateAnalysis);
      
      // Step 3: Deduplicate activities by title
      const deduplicatedActivities = deduplicateActivitiesByTitleAndTime(validActivities);
      
      // Step 4: Sort by date/time
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

  const renderActivityDetails = (activity) => {
    const details = activityDetails[activity.id];
    const isLoading = loadingDetails[activity.id];

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
      <div className="activity-details-content">
        {details.description && (
          <div className="detail-section">
            <h4>Beschrijving</h4>
            <p>{details.description}</p>
          </div>
        )}
        
        {details.capacity && (
          <div className="detail-section">
            <h4>Capaciteit</h4>
            <p>{details.capacity} personen</p>
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

        {details.number && (
          <div className="detail-section">
            <h4>Activiteitsnummer</h4>
            <p>{details.number}</p>
          </div>
        )}
      </div>
    );
  };

  const renderSimpleList = (activitiesList) => {
    // Process activities for simple view: deduplicate by title and sort alphabetically
    const validActivities = validateActivities(activitiesList);
    const uniqueActivities = deduplicateByTitleOnly(validActivities);
    const sortedActivities = sortActivitiesAlphabetically(uniqueActivities);

    return (
      <ul className="simple-activities-list">
        {sortedActivities.map(activity => (
          <li key={activity.id} className={`simple-activity-item ${expandedActivityId === activity.id ? 'expanded' : ''}`}>
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

  const groupedActivities = groupActivitiesByDay(activities);

  return (
    <div className="activities-list-page">
      <h1>{window.FestivalWizardData?.activitiesTitle || 'Scout-in Activiteiten'}</h1>
      <p>
        {window.FestivalWizardData?.activitiesIntro || 'Hier vind je alle activiteiten van scout-in, chronologisch geordend per dag en tijd. Klik op een activiteit voor meer informatie.'}
      </p>

      {/* View Toggle Button */}
      <div className="view-toggle-container">
        <button 
          className={`view-toggle-button ${isSimpleView ? 'simple' : 'detailed'}`}
          onClick={() => setIsSimpleView(!isSimpleView)}
          aria-label={isSimpleView ? 'Schakel naar gedetailleerde weergave' : 'Schakel naar eenvoudige weergave'}
        >
          {isSimpleView ? <CalendarIcon /> : <ListIcon />}
          <span>{isSimpleView ? 'Kalender' : 'Lijst'}</span>
        </button>
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
                    <span className="activity-title">{activity.name}</span>
                    {activity.location && (
                      <span className="activity-location">@ {activity.location}</span>
                    )}
                    {activity.type && (
                      <span className="activity-type">({activity.type})</span>
                    )}
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
