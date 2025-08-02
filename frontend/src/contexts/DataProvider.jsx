/**
 * DataProvider Context
 * Centralized data management for user profile, activities, and tracks
 * Eliminates duplicate API calls and provides shared state
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { dataService } from '../services/dataService.js';
import { tracksService, activitiesService } from '../services/index.js';

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

  // In-flight request tracking to prevent duplicate calls
  const [inFlightRequests, setInFlightRequests] = useState(new Set());

  // Generic request handler with deduplication
  const makeRequest = useCallback(async (requestKey, requestFn, setLoading, setData, setError) => {
    // Skip if request is already in flight
    if (inFlightRequests.has(requestKey)) {
      console.log(`DataProvider: Skipping duplicate ${requestKey} request`);
      return;
    }

    try {
      setInFlightRequests(prev => new Set(prev).add(requestKey));
      setLoading(true);
      setError(null);

      console.log(`DataProvider: Making ${requestKey} request`);
      const result = await requestFn();
      
      console.log(`DataProvider: ${requestKey} response received:`, result);
      console.log(`DataProvider: ${requestKey} result type:`, typeof result, Array.isArray(result));
      if (Array.isArray(result)) {
        console.log(`DataProvider: ${requestKey} array length:`, result.length);
      }
      
      setData(result);
      setLastFetched(prev => ({
        ...prev,
        [requestKey]: Date.now()
      }));
      
      console.log(`DataProvider: ${requestKey} request completed successfully`);
    } catch (err) {
      console.error(`DataProvider: ${requestKey} request failed:`, err);
      setError(err.message || `Failed to fetch ${requestKey}`);
    } finally {
      setLoading(false);
      setInFlightRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestKey);
        return newSet;
      });
    }
  }, [inFlightRequests]);

  // Fetch user profile
  const fetchUserProfile = useCallback(async (force = false) => {
    if (!force && isDataFresh('userProfile')) {
      console.log('DataProvider: Using cached user profile');
      return;
    }

    // Check if user is logged in first
    if (!dataService.isUserLoggedIn()) {
      console.log('DataProvider: User not logged in, skipping profile fetch');
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
      console.log('DataProvider: Using cached activities');
      return;
    }

    await makeRequest(
      'activities',
      async () => {
        const response = await dataService.getActivities();
        console.log('DataProvider: Raw activities response:', response);
        
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
        
        console.log('DataProvider: Processed activities data:', activitiesData);
        console.log('DataProvider: Activities data type:', typeof activitiesData, Array.isArray(activitiesData));
        if (Array.isArray(activitiesData)) {
          console.log('DataProvider: Activities array length:', activitiesData.length);
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
      console.log('DataProvider: Using cached tracks');
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

  // Subscribe to track (with refresh)
  const subscribeToTrack = useCallback(async (trackId, username = 'current_user') => {
    try {
      await tracksService.subscribeScout(username, trackId);
      // Refresh tracks data after subscription
      await fetchTracks(true);
      return { success: true };
    } catch (error) {
      console.error('DataProvider: Failed to subscribe to track:', error);
      return { success: false, error: error.message };
    }
  }, [fetchTracks]);

  // Subscribe to activity (with refresh)
  const subscribeToActivity = useCallback(async (activityId, username) => {
    try {
      console.log('DataProvider: Subscribing to activity', { activityId, username });
      // IMPORTANT: activitiesService.subscribe expects (username, activityId) order!
      await activitiesService.subscribe(username, activityId);
      // Refresh user profile to update subscribed activities
      await fetchUserProfile(true);
      return { success: true };
    } catch (error) {
      console.error('DataProvider: Failed to subscribe to activity:', error);
      return { success: false, error: error.message };
    }
  }, [fetchUserProfile]);

  // Unsubscribe from activity (with refresh)
  const unsubscribeFromActivity = useCallback(async (activityId, username) => {
    try {
      console.log('DataProvider: Unsubscribing from activity', { activityId, username });
      // IMPORTANT: activitiesService.unsubscribe expects (username, activityId) order!
      await activitiesService.unsubscribe(username, activityId);
      // Refresh user profile to update subscribed activities
      await fetchUserProfile(true);
      return { success: true };
    } catch (error) {
      console.error('DataProvider: Failed to unsubscribe from activity:', error);
      return { success: false, error: error.message };
    }
  }, [fetchUserProfile]);

  // Initialize data on mount
  useEffect(() => {
    console.log('DataProvider: Initializing...');
    fetchUserProfile();
    fetchActivities();
    fetchTracks();
  }, [fetchUserProfile, fetchActivities, fetchTracks]);

  // Computed values
  const isUserLoggedIn = dataService.isUserLoggedIn();
  const participant = userProfile?.participant || null;
  const wordpressUser = userProfile?.wordpress_user || null;
  const isNewUser = participant === null && isUserLoggedIn;

  // Global loading state
  const isLoading = userProfileLoading || activitiesLoading || tracksLoading;

  const contextValue = {
    // User Profile
    userProfile,
    participant,
    wordpressUser,
    isNewUser,
    isUserLoggedIn,
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

    // Global state
    isLoading,

    // Cache control
    refreshAll: () => {
      fetchUserProfile(true);
      fetchActivities(true);
      fetchTracks(true);
    },

    // Clear cache
    clearCache: () => {
      setLastFetched({
        userProfile: null,
        activities: null,
        tracks: null
      });
    }
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};