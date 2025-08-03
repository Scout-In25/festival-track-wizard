/**
 * TrackList Component
 * Example component demonstrating the use of API services
 */
import React from 'react';
import { useDataContext } from '../contexts/DataProvider.jsx';
import { useToast } from '../hooks/useToast';

const TrackList = () => {
  const { 
    tracks, 
    tracksLoading: loading, 
    tracksError: error, 
    subscribeToTrack,
    participant,
    activities,
    isUserLoggedIn
  } = useDataContext();
  const { showInfo, showError } = useToast();

  // Time overlap utility function (from ActivitiesListPage)
  const hasTimeOverlap = (item1, item2) => {
    const start1 = new Date(item1.start_time);
    const end1 = new Date(item1.end_time);
    const start2 = new Date(item2.start_time);
    const end2 = new Date(item2.end_time);
    return start1 < end2 && start2 < end1;
  };

  // Get user's subscribed activities
  const getSubscribedActivities = () => {
    if (!participant?.activities || !activities.length) return [];
    return activities.filter(activity => participant.activities.includes(activity.id));
  };

  // Check if track conflicts with user's subscribed activities or current track
  const hasTrackConflict = (track) => {
    if (!isUserLoggedIn || !participant) {
      return false;
    }
    
    // If tracks don't have timing information, they can't have time-based conflicts
    if (!track.start_time || !track.end_time) {
      return false;
    }
    
    const subscribedActivities = getSubscribedActivities();
    
    // Check conflict with subscribed activities
    const hasActivityConflict = subscribedActivities.some(activity => {
      return hasTimeOverlap(track, activity);
    });
    
    // Check conflict with current track (if user has one and it has timing)
    const hasCurrentTrackConflict = participant.track && 
      participant.track.id !== track.id && 
      participant.track.start_time && 
      participant.track.end_time &&
      hasTimeOverlap(track, participant.track);
    
    return hasActivityConflict || hasCurrentTrackConflict;
  };

  // Get track status including conflict detection
  const getTrackStatus = (track) => {

    // Check if track is full first
    if (track.current_participants >= track.max_participants) {
      return 'full';
    }
    
    // Check for time conflicts
    const hasConflict = hasTrackConflict(track);
    
    if (hasConflict) {
      return 'conflict';
    }
    
    return 'available';
  };

  const handleSubscribe = async (trackId, username = 'current_user') => {
    const result = await subscribeToTrack(trackId, username);
    
    if (result.success) {
      showInfo('Successfully subscribed to track!');
    } else {
      showError(`Failed to subscribe: ${result.error}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Loading tracks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Available Tracks</h2>
      
      {tracks.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No tracks available at the moment.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tracks.map((track) => (
            <div key={track.id} className="bg-white rounded-lg shadow-md p-6 border">
              <h3 className="text-xl font-semibold mb-2">{track.title}</h3>
              <p className="text-gray-600 mb-3">{track.description}</p>
              
              <div className="space-y-2 text-sm text-gray-500">
                <div><strong>Category:</strong> {track.category}</div>
                <div><strong>Location:</strong> {track.location}</div>
                <div>
                  <strong>Participants:</strong> {track.current_participants}/{track.max_participants}
                </div>
                {track.start_time && track.end_time && (
                  <div>
                    <strong>Time:</strong> {new Date(track.start_time).toLocaleString()} - {new Date(track.end_time).toLocaleString()}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <button
                  onClick={() => handleSubscribe(track.id)}
                  disabled={getTrackStatus(track) === 'full'}
                  className={`w-full px-4 py-2 rounded font-medium ${
                    getTrackStatus(track) === 'full'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : getTrackStatus(track) === 'conflict'
                      ? 'bg-orange-500 text-white hover:bg-orange-600 border-2 border-orange-400'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  title={
                    getTrackStatus(track) === 'conflict' 
                      ? 'Time conflict with your schedule'
                      : getTrackStatus(track) === 'full'
                      ? 'Track is full'
                      : 'Subscribe to this track'
                  }
                >
                  {getTrackStatus(track) === 'full' 
                    ? 'Full' 
                    : getTrackStatus(track) === 'conflict'
                    ? '⚠️ Time Conflict'
                    : 'Subscribe'
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrackList;
