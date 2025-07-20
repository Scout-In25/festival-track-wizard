import React, { useState, useEffect } from 'react';
import { activitiesService } from './services/api/activitiesService.js';
import './ActivitiesListPage.css';

// Chevron icon components
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

const ActivitiesListPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedActivityId, setExpandedActivityId] = useState(null);
  const [activityDetails, setActivityDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await activitiesService.getAll();
      const sortedActivities = sortActivitiesByDateTime(response.data || []);
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

  if (loading) {
    return (
      <div className="activities-list-page">
        <h1>Festival Activiteiten</h1>
        <p>Activiteiten laden...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="activities-list-page">
        <h1>Festival Activiteiten</h1>
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
      <h1>Festival Activiteiten</h1>
      <p>
        Hier vind je alle activiteiten van het festival, chronologisch geordend per dag en tijd. 
        Klik op een activiteit voor meer informatie.
      </p>

      {Object.keys(groupedActivities).length === 0 ? (
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
      )}
    </div>
  );
};

export default ActivitiesListPage;
