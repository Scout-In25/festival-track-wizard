import React, { useState, useEffect } from 'react';
import { useDataContext } from './contexts/DataProvider';
import { useToast } from './hooks/useToast';
import adminService from './services/api/adminService';
import activitiesService from './services/api/activitiesService';
import participantsService from './services/api/participantsService';
import HighCapacityPanel from './components/HighCapacityPanel';

const Admin = () => {
  const { showToast } = useToast();
  const { activities, activitiesLoading, activitiesError, fetchActivities } = useDataContext();
  
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(true);
  const [participantsError, setParticipantsError] = useState(null);
  const [participantsCacheTime, setParticipantsCacheTime] = useState(null);
  
  // Cache duration for participants (5 minutes)
  const PARTICIPANTS_CACHE_DURATION = 5 * 60 * 1000;
  
  // Form states
  const [subscriptionForm, setSubscriptionForm] = useState({ username: '', activityId: '' });
  const [clearLabelsForm, setClearLabelsForm] = useState({ username: '' });
  
  // Search filter state
  const [participantFilter, setParticipantFilter] = useState('');
  
  // Pagination state
  const [displayCount, setDisplayCount] = useState(100);
  const PARTICIPANTS_PER_PAGE = 100;
  
  // Activities table state
  const [activityFilter, setActivityFilter] = useState('');
  const [activitySort, setActivitySort] = useState({ column: 'name', direction: 'asc' });
  const [activityDisplayCount, setActivityDisplayCount] = useState(100);
  const ACTIVITIES_PER_PAGE = 100;
  
  // Cache info state
  const [cacheInfo, setCacheInfo] = useState(null);
  const [syncing, setSyncing] = useState(false);
  
  // Loading states for each action
  const [subscribing, setSubscribing] = useState(false);
  const [unsubscribing, setUnsubscribing] = useState(false);
  const [clearingLabels, setClearingLabels] = useState(false);
  const [clearingActivities, setClearingActivities] = useState(false);
  
  // Collapsible panel states
  const [bezettingCollapsed, setBezettingCollapsed] = useState(false);
  const [participantsCollapsed, setParticipantsCollapsed] = useState(false);
  const [activitiesCollapsed, setActivitiesCollapsed] = useState(false);

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
      console.log('Admin: Using cached participants data');
      return;
    }

    setParticipantsLoading(true);
    setParticipantsError(null);
    try {
      console.log('Admin: Fetching fresh participants data', force ? '(forced refresh)' : '');
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
      
      // Debug logging
      console.log('Admin: Raw participants response:', response);
      console.log('Admin: Response structure analysis:', {
        responseType: typeof response,
        isArray: Array.isArray(response),
        hasData: !!response?.data,
        dataType: typeof response?.data,
        dataIsArray: Array.isArray(response?.data),
        hasNestedData: !!response?.data?.data,
        nestedDataType: typeof response?.data?.data,
        nestedDataIsArray: Array.isArray(response?.data?.data),
      });
      console.log('Admin: Processed participants data:', participantsData);
      console.log('Admin: First participant example:', participantsData[0]);
      
      // Handle cache info if available
      if (response.cache_info) {
        setCacheInfo(response.cache_info);
        console.log('Admin: Cache info:', response.cache_info);
      }
      
      setParticipantsCacheTime(now);
      console.log(`Admin: Loaded ${participantsData.length} participants`);
    } catch (error) {
      console.error('Error fetching participants:', error);
      const errorMsg = error.message || 'Fout bij het ophalen van deelnemers';
      setParticipantsError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setParticipantsLoading(false);
    }
  };

  const handleSubscribeUser = async (e) => {
    e.preventDefault();
    if (!subscriptionForm.username || !subscriptionForm.activityId) {
      showToast('Vul alle velden in', 'error');
      return;
    }

    setSubscribing(true);
    try {
      await adminService.subscribeUserToActivity(subscriptionForm.username, subscriptionForm.activityId);
      showToast(`${subscriptionForm.username} succesvol ingeschreven`, 'success');
      setSubscriptionForm({ username: '', activityId: '' });
      // Refresh participants to update their activities
      fetchParticipants(true);
    } catch (error) {
      console.error('Error subscribing user:', error);
      showToast('Fout bij het inschrijven van gebruiker', 'error');
    } finally {
      setSubscribing(false);
    }
  };

  const handleUnsubscribeUser = async (e) => {
    e.preventDefault();
    if (!subscriptionForm.username || !subscriptionForm.activityId) {
      showToast('Vul alle velden in', 'error');
      return;
    }

    setUnsubscribing(true);
    try {
      await adminService.unsubscribeUserFromActivity(subscriptionForm.username, subscriptionForm.activityId);
      showToast(`${subscriptionForm.username} succesvol uitgeschreven`, 'success');
      setSubscriptionForm({ username: '', activityId: '' });
      // Refresh participants to update their activities
      fetchParticipants(true);
    } catch (error) {
      console.error('Error unsubscribing user:', error);
      showToast('Fout bij het uitschrijven van gebruiker', 'error');
    } finally {
      setUnsubscribing(false);
    }
  };

  const handleClearLabels = async (e) => {
    e.preventDefault();
    if (!clearLabelsForm.username) {
      showToast('Vul een gebruikersnaam in', 'error');
      return;
    }

    if (!window.confirm(`Weet je zeker dat je de voorkeuren van ${clearLabelsForm.username} wilt resetten?`)) {
      return;
    }

    setClearingLabels(true);
    try {
      await adminService.clearUserLabels(clearLabelsForm.username);
      showToast(`Voorkeuren van ${clearLabelsForm.username} succesvol gereset`, 'success');
      setClearLabelsForm({ username: '' });
      // Refresh participants to update their labels
      fetchParticipants(true);
    } catch (error) {
      console.error('Error clearing labels:', error);
      showToast('Fout bij het resetten van voorkeuren', 'error');
    } finally {
      setClearingLabels(false);
    }
  };

  // Get participant's current activities for display
  const getParticipantActivities = (username) => {
    if (!Array.isArray(participants)) return [];
    const participant = participants.find(p => p.username === username);
    if (!participant || !participant.activities) return [];
    return participant.activities;
  };

  // Filter participants based on search term (works on full dataset)
  const filteredParticipants = React.useMemo(() => {
    if (!Array.isArray(participants) || !participantFilter.trim()) {
      return participants;
    }
    
    const searchTerm = participantFilter.toLowerCase().trim();
    return participants.filter(participant => {
      // Search in username, first name, last name, email, and labels
      const searchableFields = [
        participant.username,
        participant.first_name,
        participant.last_name,
        participant.email,
        ...(Array.isArray(participant.labels) ? participant.labels : [])
      ].filter(Boolean); // Remove null/undefined values
      
      // Check if any field contains the search term
      return searchableFields.some(field => 
        field.toString().toLowerCase().includes(searchTerm)
      );
    });
  }, [participants, participantFilter]);
  
  // Get participants to display (filtered + paginated)
  const displayedParticipants = React.useMemo(() => {
    if (!Array.isArray(filteredParticipants)) return [];
    return filteredParticipants.slice(0, displayCount);
  }, [filteredParticipants, displayCount]);
  
  // Reset display count when filter changes
  React.useEffect(() => {
    setDisplayCount(PARTICIPANTS_PER_PAGE);
  }, [participantFilter]);
  
  // Filter activities based on search term
  const filteredActivities = React.useMemo(() => {
    if (!Array.isArray(activities) || !activityFilter.trim()) {
      return activities || [];
    }
    
    const searchTerm = activityFilter.toLowerCase().trim();
    return activities.filter(activity => {
      const searchableFields = [
        activity.name,
        activity.id?.toString(),
        activity.location
      ].filter(Boolean);
      
      return searchableFields.some(field => 
        field.toString().toLowerCase().includes(searchTerm)
      );
    });
  }, [activities, activityFilter]);
  
  // Sort activities
  const sortedActivities = React.useMemo(() => {
    if (!Array.isArray(filteredActivities)) return [];
    
    const sortedArray = [...filteredActivities];
    
    sortedArray.sort((a, b) => {
      let aValue, bValue;
      
      switch (activitySort.column) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'id':
          aValue = a.id || '';
          bValue = b.id || '';
          break;
        case 'load':
          const aCapacity = a.capacity || a.metadata?.max_participants || 0;
          const bCapacity = b.capacity || b.metadata?.max_participants || 0;
          const aCurrent = a.current_subscriptions || a.current_participants || 0;
          const bCurrent = b.current_subscriptions || b.current_participants || 0;
          aValue = aCapacity > 0 ? (aCurrent / aCapacity) * 100 : 0;
          bValue = bCapacity > 0 ? (bCurrent / bCapacity) * 100 : 0;
          break;
        case 'date':
          aValue = new Date(a.start_time || 0);
          bValue = new Date(b.start_time || 0);
          break;
        case 'time':
          aValue = new Date(a.start_time || 0);
          bValue = new Date(b.start_time || 0);
          break;
        default:
          aValue = '';
          bValue = '';
      }
      
      if (aValue < bValue) return activitySort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return activitySort.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sortedArray;
  }, [filteredActivities, activitySort]);
  
  // Get activities to display (sorted + paginated)
  const displayedActivities = React.useMemo(() => {
    if (!Array.isArray(sortedActivities)) return [];
    return sortedActivities.slice(0, activityDisplayCount);
  }, [sortedActivities, activityDisplayCount]);
  
  // Reset activity display count when filter changes
  React.useEffect(() => {
    setActivityDisplayCount(ACTIVITIES_PER_PAGE);
  }, [activityFilter]);
  
  // Handle sync participants (force refresh)
  const handleSyncParticipants = async () => {
    setSyncing(true);
    try {
      await fetchParticipants(true); // Force refresh
      showToast('Deelnemers gesynchroniseerd vanuit externe bron', 'success');
    } catch (error) {
      console.error('Sync failed:', error);
      showToast('Fout bij synchroniseren van deelnemers', 'error');
    } finally {
      setSyncing(false);
    }
  };
  
  // Handle activity row click - copy ID to form
  const handleActivityRowClick = (activityId) => {
    setSubscriptionForm(prev => ({ ...prev, activityId: activityId.toString() }));
    showToast(`Activiteit ID '${activityId}' ingevuld in het formulier`, 'success');
  };
  
  // Handle activity column sort
  const handleActivitySort = (column) => {
    setActivitySort(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  // Handle remove all activities
  const handleRemoveAllActivities = async () => {
    if (!clearLabelsForm.username) {
      showToast('Vul een gebruikersnaam in', 'error');
      return;
    }

    if (!window.confirm(`Weet je zeker dat je alle activiteiten van ${clearLabelsForm.username} wilt verwijderen?`)) {
      return;
    }

    setClearingActivities(true);
    try {
      const userActivities = getParticipantActivities(clearLabelsForm.username);
      
      if (userActivities.length === 0) {
        showToast(`${clearLabelsForm.username} heeft geen activiteiten om te verwijderen`, 'info');
        return;
      }

      // Remove all activities one by one
      for (const activityId of userActivities) {
        await adminService.unsubscribeUserFromActivity(clearLabelsForm.username, activityId);
      }
      
      showToast(`Alle ${userActivities.length} activiteiten van ${clearLabelsForm.username} verwijderd`, 'success');
      // Refresh participants to update their activities
      fetchParticipants(true);
    } catch (error) {
      console.error('Error removing all activities:', error);
      showToast('Fout bij het verwijderen van activiteiten', 'error');
    } finally {
      setClearingActivities(false);
    }
  };

  // Remove blocking loading states - show page immediately and load data async

  return (
    <div className="admin-container p-6 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Scout-In25 Kompas</h1>
        <p className="text-gray-600 mt-2">Beheerpaneel voor activiteitenbeheer</p>
        <div className="text-sm text-gray-500 mt-1">
          {activitiesLoading ? (
            <span className="text-amber-600">Activiteiten laden...</span>
          ) : activitiesError ? (
            <span className="text-red-600">Fout bij laden activiteiten</span>
          ) : (
            <span>{Array.isArray(activities) ? activities.length : 0} activiteiten geladen</span>
          )}
          {" • "}
          {participantsLoading ? (
            <span className="text-amber-600">Deelnemers laden...</span>
          ) : participantsError ? (
            <span className="text-red-600">Fout bij laden deelnemers</span>
          ) : (
            <span>
              {Array.isArray(participants) ? participants.length : 0} deelnemers geladen
              {cacheInfo && (
                <span className="ml-1 text-xs">
                  ({cacheInfo.cached ? `cache ${Math.floor(cacheInfo.cache_age / 60)}m${cacheInfo.cache_age % 60}s` : 'fresh'}
                  {import.meta.env.DEV && cacheInfo.source && (
                    <span className="ml-1 text-purple-600">[{cacheInfo.source}]</span>
                  )})
                </span>
              )}
            </span>
          )}
          <button
            onClick={handleSyncParticipants}
            disabled={syncing || participantsLoading}
            className="ml-3 bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded text-xs transition-colors disabled:opacity-50"
            title="Synchroniseer deelnemers vanuit externe bron"
          >
            {syncing ? '⟳ Sync...' : '⟳ Sync'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Subscription Management */}
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col">
          <h2 className="text-xl font-semibold mb-4">Activiteit Beheer</h2>
          <div className="space-y-4 flex-grow">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gebruikersnaam
              </label>
              <input
                type="text"
                value={subscriptionForm.username}
                onChange={(e) => setSubscriptionForm({ ...subscriptionForm, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Voer gebruikersnaam in..."
                disabled={subscribing || unsubscribing}
              />
              <p className="text-xs text-gray-500 mt-1">Tip: Controleer de deelnemerstabel hieronder voor beschikbare gebruikersnamen</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Activiteit ID
              </label>
              <input
                type="text"
                value={subscriptionForm.activityId}
                onChange={(e) => setSubscriptionForm({ ...subscriptionForm, activityId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Activiteit ID..."
                disabled={subscribing || unsubscribing}
              />
              <p className="text-xs text-gray-500 mt-1">Klik op een activiteit in het activiteiten paneel om hier het ID in te kopieren.</p>
            </div>

            {subscriptionForm.username && (
              <div className="text-sm text-gray-600">
                <strong>Huidige activiteiten:</strong>
                {(() => {
                  const userActivities = getParticipantActivities(subscriptionForm.username);
                  return userActivities.length > 0 ? (
                    <ul className="mt-1">
                      {userActivities.map(actId => {
                        const activity = Array.isArray(activities) ? activities.find(a => a.id == actId) : null;
                        return activity ? (
                          <li key={actId}>• {activity.name}</li>
                        ) : (
                          <li key={actId} className="text-gray-500">• ID: {actId}</li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-1">Geen activiteiten</p>
                  );
                })()}
              </div>
            )}

          </div>
          <div className="flex space-x-3 mt-4">
            <button
              onClick={handleSubscribeUser}
              disabled={subscribing || unsubscribing || !subscriptionForm.username || !subscriptionForm.activityId || activitiesLoading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {subscribing ? 'Bezig...' : activitiesLoading ? 'Laden...' : 'Inschrijven'}
            </button>
            
            <button
              onClick={handleUnsubscribeUser}
              disabled={subscribing || unsubscribing || !subscriptionForm.username || !subscriptionForm.activityId || activitiesLoading}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {unsubscribing ? 'Bezig...' : activitiesLoading ? 'Laden...' : 'Uitschrijven'}
            </button>
          </div>
        </div>

        {/* Clear Labels Form */}
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col">
          <h2 className="text-xl font-semibold mb-4">Voorkeuren & Activiteiten</h2>
          <form onSubmit={handleClearLabels} className="flex flex-col flex-grow">
            <div className="space-y-4 flex-grow">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gebruikersnaam
              </label>
              <input
                type="text"
                value={clearLabelsForm.username}
                onChange={(e) => setClearLabelsForm({ username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Voer gebruikersnaam in..."
                disabled={clearingLabels || clearingActivities}
              />
              <p className="text-xs text-gray-500 mt-1">Tip: Controleer de deelnemerstabel hieronder voor beschikbare gebruikersnamen</p>
            </div>

            {clearLabelsForm.username && (
              <div className="text-sm text-gray-600 space-y-2">
                <div>
                  <strong>Huidige labels:</strong>
                  {(() => {
                    if (!Array.isArray(participants)) return <p className="mt-1">Laden...</p>;
                    const participant = participants.find(p => p.username === clearLabelsForm.username);
                    return participant && participant.labels && participant.labels.length > 0 ? (
                      <p className="mt-1">{participant.labels.join(', ')}</p>
                    ) : (
                      <p className="mt-1">Geen labels</p>
                    );
                  })()}
                </div>
                
                <div>
                  <strong>Huidige activiteiten:</strong>
                  {(() => {
                    const userActivities = getParticipantActivities(clearLabelsForm.username);
                    return userActivities.length > 0 ? (
                      <p className="mt-1">{userActivities.length} activiteit(en) ingeschreven</p>
                    ) : (
                      <p className="mt-1">Geen activiteiten</p>
                    );
                  })()}
                </div>
              </div>
            )}

            <p className="text-sm text-red-600">
              ⚠️ Dit verwijdert alle voorkeuren en/of activiteiten van de gebruiker.
            </p>

            </div>
            <div className="flex space-x-3 mt-4">
              <button
                type="submit"
                disabled={clearingLabels || clearingActivities || !clearLabelsForm.username || participantsLoading}
                className="flex-1 bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {clearingLabels ? 'Bezig...' : participantsLoading ? 'Deelnemers laden...' : 'Alle voorkeuren'}
              </button>
              
              <button
                type="button"
                onClick={handleRemoveAllActivities}
                disabled={clearingLabels || clearingActivities || !clearLabelsForm.username || participantsLoading}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {clearingActivities ? 'Bezig...' : participantsLoading ? 'Deelnemers laden...' : 'Alle activiteiten'}
              </button>
            </div>
          </form>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Statistieken</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Totaal deelnemers:</span>
                <span className="font-semibold">
                  {participantsLoading ? (
                    <span className="text-gray-400">Laden...</span>
                  ) : Array.isArray(participants) ? (
                    <>
                      {participants.length}
                      {participantFilter && Array.isArray(filteredParticipants) && filteredParticipants.length !== participants.length && (
                        <span className="text-sm text-gray-500 ml-2">({filteredParticipants.length} zichtbaar)</span>
                      )}
                    </>
                  ) : (
                    <span className="text-red-500">Fout</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Totaal activiteiten:</span>
                <span className="font-semibold">
                  {activitiesLoading ? (
                    <span className="text-gray-400">Laden...</span>
                  ) : Array.isArray(activities) ? (
                    activities.length
                  ) : (
                    <span className="text-red-500">Fout</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Totaal inschrijvingen:</span>
                <span className="font-semibold text-indigo-600">
                  {participantsLoading ? (
                    <span className="text-gray-400">Laden...</span>
                  ) : Array.isArray(participants) ? (
                    participants.reduce((total, participant) => {
                      return total + (Array.isArray(participant.activities) ? participant.activities.length : 0);
                    }, 0)
                  ) : (
                    <span className="text-red-500">Fout</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gem. inschrijvingen per persoon:</span>
                <span className="font-semibold text-cyan-600">
                  {participantsLoading ? (
                    <span className="text-gray-400">Laden...</span>
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
                    <span className="text-red-500">Fout</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gemiddelde bezetting:</span>
                <span className="font-semibold text-orange-600">
                  {activitiesLoading ? (
                    <span className="text-gray-400">Laden...</span>
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
                    <span className="text-red-500">Fout</span>
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
                        <span className="text-gray-400">Laden...</span>
                      ) : Array.isArray(participants) ? (
                        participants.filter(p => p.ticket_type === 'weekend' || p.ticket_type === 'standard').length
                      ) : (
                        <span className="text-red-500">Fout</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Day tickets:</span>
                    <span className="font-semibold text-purple-600">
                      {participantsLoading ? (
                        <span className="text-gray-400">Laden...</span>
                      ) : Array.isArray(participants) ? (
                        participants.filter(p => p.ticket_type === 'day' || p.ticket_type === 'organizer').length
                      ) : (
                        <span className="text-red-500">Fout</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="border-b pb-2 mb-2">
                <h3 className="text-sm font-medium text-gray-700 mb-1">Wizard Status</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wizard voltooid:</span>
                    <span className="font-semibold text-green-600">
                      {participantsLoading ? (
                        <span className="text-gray-400">Laden...</span>
                      ) : Array.isArray(participants) ? (
                        participants.filter(p => p.labels && p.labels.length > 0).length
                      ) : (
                        <span className="text-red-500">Fout</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wizard niet voltooid:</span>
                    <span className="font-semibold text-amber-600">
                      {participantsLoading ? (
                        <span className="text-gray-400">Laden...</span>
                      ) : Array.isArray(participants) ? (
                        participants.filter(p => !p.labels || p.labels.length === 0).length
                      ) : (
                        <span className="text-red-500">Fout</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* High Capacity Activities Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md">
            <div 
              className="flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setBezettingCollapsed(!bezettingCollapsed)}
            >
              <h2 className="text-xl font-semibold">Bezetting</h2>
              <svg 
                className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${bezettingCollapsed ? '' : 'rotate-180'}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {!bezettingCollapsed && (
              <div className="px-6 pb-6">
                <HighCapacityPanel activities={activities || []} embedded={true} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tables Section - Full Width Stacked */}
      <div className="mt-8 space-y-6">
        {/* Participants Table */}
        <div className="bg-white rounded-lg shadow-md flex flex-col">
          <div 
            className="flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setParticipantsCollapsed(!participantsCollapsed)}
          >
            <h2 className="text-xl font-semibold">Deelnemers Overzicht</h2>
            <svg 
              className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${participantsCollapsed ? '' : 'rotate-180'}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {!participantsCollapsed && (
            <div className="px-6 pb-6 flex flex-col flex-grow" style={{ maxHeight: '75vh' }}>
              <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-gray-500">
                {participantFilter ? (
                  <span>
                    {displayedParticipants.length} van {filteredParticipants.length} gefilterd
                  </span>
                ) : (
                  <span>
                    {displayedParticipants.length} van {Array.isArray(participants) ? participants.length : 0}
                  </span>
                )}
              </div>
              <button
                onClick={() => fetchParticipants(true)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                style={{ padding: '6px 12px !important' }}
                title="Deelnemers vernieuwen"
              >
                ↻
              </button>
            </div>
          </div>
          
          {/* Search Filter */}
          <div className="mb-4 flex-shrink-0">
            <div className="relative">
              <input
                type="text"
                value={participantFilter}
                onChange={(e) => setParticipantFilter(e.target.value)}
                placeholder="Zoek deelnemers..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {participantFilter && (
                <button
                  onClick={() => setParticipantFilter('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  title="Filter wissen"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Scrollable Table Container */}
          <div className="overflow-auto flex-grow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gebruikersnaam
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Naam
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activiteiten
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Labels
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {participantsLoading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm">
                      Laden...
                    </td>
                  </tr>
                ) : !Array.isArray(participants) || participants.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center">
                      <div className="text-sm">
                        {participantsError ? (
                          <div className="text-red-600">
                            <div className="font-medium">Fout bij laden</div>
                            <button
                              onClick={() => fetchParticipants(true)}
                              className="mt-1 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                            >
                              Retry
                            </button>
                          </div>
                        ) : (
                          <div>Geen deelnemers</div>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : displayedParticipants.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center">
                      <div className="text-gray-500 text-sm">
                        {participantFilter ? (
                          <div>
                            <div>Geen resultaten voor "{participantFilter}"</div>
                            <button
                              onClick={() => setParticipantFilter('')}
                              className="mt-1 text-blue-600 hover:text-blue-800 text-xs underline"
                            >
                              Filter wissen
                            </button>
                          </div>
                        ) : (
                          <div>Geen deelnemers</div>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedParticipants.map(participant => (
                    <tr 
                      key={participant.username} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSubscriptionForm(prev => ({ ...prev, username: participant.username }));
                        setClearLabelsForm({ username: participant.username });
                        showToast(`Gebruiker '${participant.username}' ingevuld`, 'success');
                      }}
                      title="Klik om gebruiker in te vullen"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <span className="text-blue-600">
                          {participant.username}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {participant.first_name} {participant.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {participant.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {participant.activities && Array.isArray(participant.activities) && participant.activities.length > 0 ? (
                          <div>
                            <span className="text-blue-600 font-medium">
                              {participant.activities.length} activiteit(en)
                            </span>
                            <div className="text-xs text-gray-400 mt-1">
                              {participant.activities.slice(0, 3).map(actId => {
                                const activity = Array.isArray(activities) ? activities.find(a => a.id == actId) : null;
                                return activity ? activity.name : `ID: ${actId}`;
                              }).join(', ')}
                              {participant.activities.length > 3 && '...'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Geen</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {participant.labels && Array.isArray(participant.labels) && participant.labels.length > 0 ? (
                          <div>
                            <span className="text-green-600 font-medium">
                              {participant.labels.length} label(s)
                            </span>
                            <div className="text-xs text-gray-400 mt-1 whitespace-nowrap overflow-hidden" style={{ textOverflow: 'ellipsis', userSelect: 'text' }}>
                              {participant.labels.join(', ')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-amber-600">Wizard niet voltooid</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {Array.isArray(filteredParticipants) && filteredParticipants.length > displayCount && (
            <div className="mt-4 flex justify-center flex-shrink-0">
              <button
                onClick={() => setDisplayCount(prev => prev + PARTICIPANTS_PER_PAGE)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Meer laden ({Math.min(PARTICIPANTS_PER_PAGE, filteredParticipants.length - displayCount)})
              </button>
            </div>
          )}
            </div>
          )}
        </div>

        {/* Activities Table */}
        <div className="bg-white rounded-lg shadow-md flex flex-col">
          <div 
            className="flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setActivitiesCollapsed(!activitiesCollapsed)}
          >
            <h2 className="text-xl font-semibold">Activiteiten Overzicht</h2>
            <svg 
              className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${activitiesCollapsed ? '' : 'rotate-180'}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {!activitiesCollapsed && (
            <div className="px-6 pb-6 flex flex-col flex-grow" style={{ maxHeight: '75vh' }}>
              <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-gray-500">
                {activityFilter ? (
                  <span>
                    {displayedActivities.length} van {filteredActivities.length} gefilterd
                  </span>
                ) : (
                  <span>
                    {displayedActivities.length} van {Array.isArray(activities) ? activities.length : 0}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Search Filter */}
          <div className="mb-4 flex-shrink-0">
            <div className="relative">
              <input
                type="text"
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                placeholder="Zoek activiteiten..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {activityFilter && (
                <button
                  onClick={() => setActivityFilter('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  title="Filter wissen"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Scrollable Table Container */}
          <div className="overflow-auto flex-grow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleActivitySort('date')}
                    title="Sorteer op datum"
                  >
                    <div className="flex items-center">
                      Tijd
                      {activitySort.column === 'date' && (
                        <span className="ml-1">
                          {activitySort.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleActivitySort('name')}
                    title="Sorteer op naam"
                  >
                    <div className="flex items-center">
                      Activiteit
                      {activitySort.column === 'name' && (
                        <span className="ml-1">
                          {activitySort.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleActivitySort('id')}
                    title="Sorteer op ID"
                  >
                    <div className="flex items-center">
                      ID
                      {activitySort.column === 'id' && (
                        <span className="ml-1">
                          {activitySort.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleActivitySort('load')}
                    title="Sorteer op bezetting"
                  >
                    <div className="flex items-center">
                      Bezetting
                      {activitySort.column === 'load' && (
                        <span className="ml-1">
                          {activitySort.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activitiesLoading ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-4 text-center text-sm">
                      Laden...
                    </td>
                  </tr>
                ) : !Array.isArray(activities) || activities.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-4 text-center">
                      <div className="text-sm">
                        {activitiesError ? (
                          <div className="text-red-600">
                            <div className="font-medium">Fout bij laden</div>
                          </div>
                        ) : (
                          <div>Geen activiteiten</div>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : displayedActivities.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-4 text-center">
                      <div className="text-gray-500 text-sm">
                        {activityFilter ? (
                          <div>
                            <div>Geen resultaten voor "{activityFilter}"</div>
                            <button
                              onClick={() => setActivityFilter('')}
                              className="mt-1 text-blue-600 hover:text-blue-800 text-xs underline"
                            >
                              Filter wissen
                            </button>
                          </div>
                        ) : (
                          <div>Geen activiteiten</div>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedActivities.map(activity => {
                    const capacity = activity.capacity || activity.metadata?.max_participants || 0;
                    const current = activity.current_subscriptions || activity.current_participants || 0;
                    const percentage = capacity > 0 ? Math.min((current / capacity) * 100, 100) : 0;
                    
                    // Determine color based on fullness
                    let progressColor = '#10b981'; // green
                    if (percentage >= 90) {
                      progressColor = '#ef4444'; // red
                    } else if (percentage >= 70) {
                      progressColor = '#f59e0b'; // orange/yellow
                    }
                    
                    const startDate = new Date(activity.start_time);
                    const endDate = new Date(activity.end_time);
                    
                    return (
                      <tr 
                        key={activity.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleActivityRowClick(activity.id)}
                        title="Klik om ID in te vullen"
                      >
                        <td className="px-4 py-2 text-xs text-gray-500">
                          <div>{startDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</div>
                          <div>{startDate.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}-{endDate.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <div className="font-medium text-gray-900 truncate" style={{ maxWidth: '200px' }}>
                            {activity.name}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500 font-mono">
                          {activity.id}
                        </td>
                        <td className="px-4 py-2">
                          <div className="w-full">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-600">{current}/{capacity}</span>
                              <span className="text-xs text-gray-600">{percentage.toFixed(0)}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: progressColor
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {Array.isArray(filteredActivities) && filteredActivities.length > activityDisplayCount && (
            <div className="mt-4 flex justify-center flex-shrink-0">
              <button
                onClick={() => setActivityDisplayCount(prev => prev + ACTIVITIES_PER_PAGE)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Meer laden ({Math.min(ACTIVITIES_PER_PAGE, filteredActivities.length - activityDisplayCount)})
              </button>
            </div>
          )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;