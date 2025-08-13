import React, { useState, useEffect } from 'react';
import { useDataContext } from './contexts/DataProvider';
import adminService from './services/api/adminService';
import HighCapacityPanel from './components/HighCapacityPanel';

const Statistics = () => {
  const { activities, activitiesLoading, activitiesError, fetchActivities } = useDataContext();
  
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(true);
  const [participantsError, setParticipantsError] = useState(null);
  const [cacheInfo, setCacheInfo] = useState(null);
  
  // Cache duration for participants (5 minutes)
  const PARTICIPANTS_CACHE_DURATION = 5 * 60 * 1000;
  const [participantsCacheTime, setParticipantsCacheTime] = useState(null);

  // Fetch all data on mount
  useEffect(() => {
    fetchParticipants();
    // Ensure activities are loaded
    fetchActivities();
  }, [fetchActivities]);

  const fetchParticipants = async (force = false) => {
    // Check cache first
    const now = Date.now();
    if (!force && participantsCacheTime && (now - participantsCacheTime < PARTICIPANTS_CACHE_DURATION) && participants.length > 0) {
      console.log('Statistics: Using cached participants data');
      return;
    }

    setParticipantsLoading(true);
    setParticipantsError(null);
    try {
      console.log('Statistics: Fetching fresh participants data', force ? '(forced refresh)' : '');
      const response = await adminService.getAllParticipants(force);
      
      // Extract participants data from various possible response structures
      let participantsData = [];
      if (response) {
        // Try different possible data locations
        if (Array.isArray(response.data)) {
          // Direct data array: { data: [...] }
          participantsData = response.data;
        } else if (Array.isArray(response.data?.data)) {
          // Nested data: { data: { data: [...] } }
          participantsData = response.data.data;
        } else if (Array.isArray(response)) {
          // Direct array response
          participantsData = response;
        } else if (response.success && Array.isArray(response.data)) {
          // Success wrapper: { success: true, data: [...] }
          participantsData = response.data;
        }
      }
      
      setParticipants(participantsData);
      
      // Handle cache info if available
      if (response.cache_info) {
        setCacheInfo(response.cache_info);
      }
      
      setParticipantsCacheTime(now);
      console.log(`Statistics: Loaded ${participantsData.length} participants`);
    } catch (error) {
      console.error('Error fetching participants:', error);
      const errorMsg = error.message || 'Fout bij het ophalen van deelnemers';
      setParticipantsError(errorMsg);
    } finally {
      setParticipantsLoading(false);
    }
  };

  return (
    <div className="statistics-container p-6 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Scout-In25 Statistics</h1>
        <p className="text-gray-600 mt-2">Event overview and activity statistics</p>
        <div className="text-sm text-gray-500 mt-1">
          {activitiesLoading ? (
            <span className="text-amber-600">Activities loading...</span>
          ) : activitiesError ? (
            <span className="text-red-600">Error loading activities</span>
          ) : (
            <span>{Array.isArray(activities) ? activities.length : 0} activities loaded</span>
          )}
          {" • "}
          {participantsLoading ? (
            <span className="text-amber-600">Participants loading...</span>
          ) : participantsError ? (
            <span className="text-red-600">Error loading participants</span>
          ) : (
            <span>
              {Array.isArray(participants) ? participants.length : 0} participants loaded
              {cacheInfo && (
                <span className="ml-1 text-xs">
                  ({cacheInfo.cached ? `cache ${Math.floor(cacheInfo.cache_age / 60)}m${cacheInfo.cache_age % 60}s` : 'fresh'})
                </span>
              )}
            </span>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total participants:</span>
                <span className="font-semibold">
                  {participantsLoading ? (
                    <span className="text-gray-400">Loading...</span>
                  ) : Array.isArray(participants) ? (
                    participants.length
                  ) : (
                    <span className="text-red-500">Error</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total activities:</span>
                <span className="font-semibold">
                  {activitiesLoading ? (
                    <span className="text-gray-400">Loading...</span>
                  ) : Array.isArray(activities) ? (
                    activities.length
                  ) : (
                    <span className="text-red-500">Error</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total subscriptions:</span>
                <span className="font-semibold text-indigo-600">
                  {participantsLoading ? (
                    <span className="text-gray-400">Loading...</span>
                  ) : Array.isArray(participants) ? (
                    participants.reduce((total, participant) => {
                      return total + (Array.isArray(participant.activities) ? participant.activities.length : 0);
                    }, 0)
                  ) : (
                    <span className="text-red-500">Error</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg. subscriptions per person:</span>
                <span className="font-semibold text-cyan-600">
                  {participantsLoading ? (
                    <span className="text-gray-400">Loading...</span>
                  ) : Array.isArray(participants) && participants.length > 0 ? (
                    (() => {
                      // Only include participants who have completed the wizard (have labels)
                      const completedWizardParticipants = participants.filter(p => p.labels && p.labels.length > 0);
                      
                      if (completedWizardParticipants.length === 0) {
                        return "N/A";
                      }
                      
                      const totalSubscriptions = completedWizardParticipants.reduce((total, participant) => {
                        return total + (Array.isArray(participant.activities) ? participant.activities.length : 0);
                      }, 0);
                      const average = totalSubscriptions / completedWizardParticipants.length;
                      return average.toFixed(1);
                    })()
                  ) : (
                    <span className="text-red-500">Error</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average occupancy:</span>
                <span className="font-semibold text-orange-600">
                  {activitiesLoading ? (
                    <span className="text-gray-400">Loading...</span>
                  ) : Array.isArray(activities) && activities.length > 0 ? (
                    (() => {
                      const validActivities = activities.filter(activity => 
                        activity.capacity && activity.capacity > 0 && 
                        typeof activity.current_subscriptions === 'number'
                      );
                      
                      if (validActivities.length === 0) return "N/A";
                      
                      const totalPercentage = validActivities.reduce((total, activity) => {
                        const percentage = (activity.current_subscriptions / activity.capacity) * 100;
                        return total + Math.min(percentage, 100); // Cap at 100%
                      }, 0);
                      
                      const averagePercentage = totalPercentage / validActivities.length;
                      return `${averagePercentage.toFixed(1)}%`;
                    })()
                  ) : (
                    <span className="text-red-500">Error</span>
                  )}
                </span>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-3">
              <div className="border-b pb-2 mb-2">
                <h3 className="text-sm font-medium text-gray-700 mb-1">Ticket Types</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weekend tickets:</span>
                    <span className="font-semibold text-blue-600">
                      {participantsLoading ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : Array.isArray(participants) ? (
                        participants.filter(p => p.ticket_type === 'weekend' || p.ticket_type === 'standard').length
                      ) : (
                        <span className="text-red-500">Error</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Day tickets:</span>
                    <span className="font-semibold text-purple-600">
                      {participantsLoading ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : Array.isArray(participants) ? (
                        participants.filter(p => p.ticket_type === 'day' || p.ticket_type === 'organizer').length
                      ) : (
                        <span className="text-red-500">Error</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="border-b pb-2 mb-2">
                <h3 className="text-sm font-medium text-gray-700 mb-1">Wizard Status</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wizard completed:</span>
                    <span className="font-semibold text-green-600">
                      {participantsLoading ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : Array.isArray(participants) ? (
                        participants.filter(p => p.labels && p.labels.length > 0).length
                      ) : (
                        <span className="text-red-500">Error</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wizard not completed:</span>
                    <span className="font-semibold text-amber-600">
                      {participantsLoading ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : Array.isArray(participants) ? (
                        participants.filter(p => !p.labels || p.labels.length === 0).length
                      ) : (
                        <span className="text-red-500">Error</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activities Panel */}
        <div className="lg:col-span-2">
          <HighCapacityPanel activities={activities || []} />
        </div>
      </div>
    </div>
  );
};

export default Statistics;