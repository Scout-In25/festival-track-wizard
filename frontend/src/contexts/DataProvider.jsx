/**
 * DataProvider Context
 * Centralized data management for user profile, activities, and tracks
 * Eliminates duplicate API calls and provides shared state
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { dataService } from '../services/dataService.js';
import { tracksService, activitiesService, suggestionsService } from '../services/index.js';

const DataContext = createContext();

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  // User Profile State
  const [userProfile, setUserProfile] = useState(null);
  const [userProfileLoading, setUserProfileLoading] = useState(false);
  const [userProfileError, setUserProfileError] = useState(null);

  // Activities State
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState(null);

  // Tracks State
  const [tracks, setTracks] = useState([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [tracksError, setTracksError] = useState(null);

  // Suggestions State (user-specific, session-only)
  const [suggestions, setSuggestions] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState(null);

  // Cache management
  const [lastFetched, setLastFetched] = useState({
    userProfile: null,
    activities: null,
    tracks: null
  });

  // Cache duration (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Check if data is fresh (within cache duration)
  const isDataFresh = useCallback((dataType) => {
    const fetchTime = lastFetched[dataType];
    return fetchTime && (Date.now() - fetchTime) < CACHE_DURATION;
  }, [lastFetched]);

  // In-flight request tracking to prevent duplicate calls (using ref to persist across renders)
  const inFlightRequestsRef = React.useRef(new Set());
  
  // Track if initial data load has been triggered (persists across StrictMode re-renders)
  const hasInitializedRef = React.useRef(false);

  // Generic request handler with deduplication
  const makeRequest = useCallback(async (requestKey, requestFn, setLoading, setData, setError) => {
    // Skip if request is already in flight
    if (inFlightRequestsRef.current.has(requestKey)) {
      return;
    }

    try {
      inFlightRequestsRef.current.add(requestKey);
      setLoading(true);
      setError(null);

      const result = await requestFn();
      
      setData(result);
      setLastFetched(prev => ({
        ...prev,
        [requestKey]: Date.now()
      }));
    } catch (err) {
      console.error(`DataProvider: ${requestKey} request failed:`, err);
      setError(err.message || `Failed to fetch ${requestKey}`);
    } finally {
      setLoading(false);
      inFlightRequestsRef.current.delete(requestKey);
    }
  }, []);

  // Fetch user profile
  const fetchUserProfile = useCallback(async (force = false) => {
    if (!force && isDataFresh('userProfile')) {
      return;
    }

    // Check if user is logged in first
    if (!dataService.isUserLoggedIn()) {
      setUserProfile(null);
      setUserProfileError('User not logged in');
      return;
    }

    await makeRequest(
      'userProfile',
      () => dataService.getUserProfile(),
      setUserProfileLoading,
      setUserProfile,
      setUserProfileError
    );
  }, [isDataFresh, makeRequest]);

  // Fetch activities
  const fetchActivities = useCallback(async (force = false) => {
    if (!force && isDataFresh('activities')) {
      return;
    }

    await makeRequest(
      'activities',
      async () => {
        const response = await dataService.getActivities();
        
        // Handle different response formats
        let activitiesData = null;
        if (response && response.data && response.data.data) {
          // Axios response with nested data: {data: {data: Array}}
          activitiesData = response.data.data;
        } else if (response && response.data && Array.isArray(response.data)) {
          // Axios response with direct array: {data: Array}
          activitiesData = response.data;
        } else if (Array.isArray(response)) {
          // Direct array response
          activitiesData = response;
        } else {
          console.warn('DataProvider: Unexpected activities response format:', response);
          activitiesData = [];
        }
        
        return activitiesData;
      },
      setActivitiesLoading,
      setActivities,
      setActivitiesError
    );
  }, [isDataFresh, makeRequest]);

  // Fetch tracks
  const fetchTracks = useCallback(async (force = false) => {
    if (!force && isDataFresh('tracks')) {
      return;
    }

    await makeRequest(
      'tracks',
      async () => {
        const response = await tracksService.getAll();
        return response.data || response;
      },
      setTracksLoading,
      setTracks,
      setTracksError
    );
  }, [isDataFresh, makeRequest]);

  // Fetch user-specific suggestions (session-only, no caching)
  const fetchSuggestions = useCallback(async (username) => {
    if (!username) {
      console.error('No username provided for suggestions fetch');
      setSuggestionsError('Username required for suggestions');
      return;
    }

    // Skip if request is already in flight for this user
    const requestKey = `suggestions_${username}`;
    if (inFlightRequestsRef.current.has(requestKey)) {
      return;
    }

    try {
      inFlightRequestsRef.current.add(requestKey);
      setSuggestionsLoading(true);
      setSuggestionsError(null);

      const response = await suggestionsService.getSuggestions(username);
      
      // Handle different response formats
      let suggestionsData = null;
      if (response && response.data) {
        suggestionsData = response.data;
      } else if (response) {
        suggestionsData = response;
      } else {
        console.warn('No suggestions data received');
        suggestionsData = null;
      }
      
      setSuggestions(suggestionsData);
    } catch (error) {
      console.error(`Failed to fetch suggestions for ${username}:`, error);
      setSuggestionsError(error.message || 'Failed to fetch suggestions');
      setSuggestions(null);
    } finally {
      setSuggestionsLoading(false);
      inFlightRequestsRef.current.delete(requestKey);
    }
  }, []);

  // Clear suggestions (for logout or user change)
  const clearSuggestions = useCallback(() => {
    setSuggestions(null);
    setSuggestionsError(null);
    setSuggestionsLoading(false);
  }, []);

  // Subscribe to track (with refresh)
  const subscribeToTrack = useCallback(async (trackId, username = 'current_user') => {
    try {
      // Ensure trackId is a string and not undefined/null
      if (!trackId) {
        throw new Error('Track ID is required for subscription');
      }
      
      await tracksService.subscribeScout(username, trackId);
      
      // Refresh tracks data after subscription
      await fetchTracks(true);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to subscribe to track:', error.message);
      return { success: false, error: error.message };
    }
  }, [fetchTracks]);

  // Unsubscribe from track (with refresh)
  const unsubscribeFromTrack = useCallback(async (username) => {
    try {
      // Ensure username is provided
      if (!username) {
        throw new Error('Username is required for track unsubscription');
      }
      
      await tracksService.unsubscribeScout(username);
      
      // Refresh user profile data after unsubscription to update track_id
      await fetchUserProfile(true);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to unsubscribe from track:', error.message);
      return { success: false, error: error.message };
    }
  }, [fetchUserProfile]);

  // Subscribe to activity (with refresh)
  const subscribeToActivity = useCallback(async (activityId, username) => {
    try {
      // IMPORTANT: activitiesService.subscribe expects (username, activityId) order!
      await activitiesService.subscribe(username, activityId);
      // Refresh user profile to update subscribed activities
      await fetchUserProfile(true);
      return { success: true };
    } catch (error) {
      console.error('Failed to subscribe to activity:', error);
      return { success: false, error: error.message };
    }
  }, [fetchUserProfile]);

  // Unsubscribe from activity (with refresh)
  const unsubscribeFromActivity = useCallback(async (activityId, username) => {
    try {
      // IMPORTANT: activitiesService.unsubscribe expects (username, activityId) order!
      await activitiesService.unsubscribe(username, activityId);
      // Refresh user profile to update subscribed activities
      await fetchUserProfile(true);
      return { success: true };
    } catch (error) {
      console.error('Failed to unsubscribe from activity:', error);
      return { success: false, error: error.message };
    }
  }, [fetchUserProfile]);

  // Initialize data on mount (only once, even with StrictMode)
  useEffect(() => {
    // Skip if already initialized (handles React.StrictMode double-mount)
    if (hasInitializedRef.current) {
      return;
    }
    
    hasInitializedRef.current = true;
    
    // Fetch all initial data
    const initializeData = async () => {
      try {
        await Promise.all([
          fetchUserProfile(),
          fetchActivities(), 
          fetchTracks()
        ]);
      } catch (err) {
        console.error('Error during initialization:', err);
      }
    };
    
    initializeData();
    
    // Cleanup function to reset initialization flag if component truly unmounts
    return () => {
      // Small timeout to distinguish between StrictMode double-mount and real unmount
      setTimeout(() => {
        hasInitializedRef.current = false;
      }, 100);
    };
  }, [fetchUserProfile, fetchActivities, fetchTracks]);

  // Computed values
  const isUserLoggedIn = dataService.isUserLoggedIn();
  const participant = userProfile?.participant || null;
  const wordpressUser = userProfile?.wordpress_user || null;
  const isNewUser = participant === null && isUserLoggedIn;
  
  // Check if user has completed the wizard (has labels)
  // Show wizard if labels is undefined, null, or empty array
  const hasCompletedWizard = Boolean(
    participant?.labels && 
    Array.isArray(participant.labels) && 
    participant.labels.length > 0
  );

  // Global loading state
  const isLoading = userProfileLoading || activitiesLoading || tracksLoading;

  const contextValue = {
    // User Profile
    userProfile,
    participant,
    wordpressUser,
    isNewUser,
    isUserLoggedIn,
    hasCompletedWizard,
    userProfileLoading,
    userProfileError,
    fetchUserProfile,

    // Activities
    activities,
    activitiesLoading,
    activitiesError,
    fetchActivities,
    subscribeToActivity,
    unsubscribeFromActivity,

    // Tracks
    tracks,
    tracksLoading,
    tracksError,
    fetchTracks,
    subscribeToTrack,
    unsubscribeFromTrack,

    // Suggestions (user-specific, session-only)
    suggestions,
    suggestionsLoading,
    suggestionsError,
    fetchSuggestions,
    clearSuggestions,

    // Global state
    isLoading,

    // Cache control
    refreshAll: () => {
      fetchUserProfile(true);
      fetchActivities(true);
      fetchTracks(true);
      clearSuggestions(); // Clear user-specific suggestions on refresh
    },

    // Clear cache
    clearCache: () => {
      setLastFetched({
        userProfile: null,
        activities: null,
        tracks: null
      });
      clearSuggestions(); // Clear suggestions when clearing cache
    }
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};