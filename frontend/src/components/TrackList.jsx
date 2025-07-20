/**
 * TrackList Component
 * Example component demonstrating the use of API services
 */
import React from 'react';
import { useDataContext } from '../contexts/DataProvider.jsx';

const TrackList = () => {
  const { 
    tracks, 
    tracksLoading: loading, 
    tracksError: error, 
    subscribeToTrack 
  } = useDataContext();

  const handleSubscribe = async (trackId, username = 'current_user') => {
    const result = await subscribeToTrack(trackId, username);
    
    if (result.success) {
      alert('Successfully subscribed to track!');
    } else {
      alert(`Failed to subscribe: ${result.error}`);
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
                <div>
                  <strong>Time:</strong> {new Date(track.start_time).toLocaleString()} - {new Date(track.end_time).toLocaleString()}
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => handleSubscribe(track.id)}
                  disabled={track.current_participants >= track.max_participants}
                  className={`w-full px-4 py-2 rounded font-medium ${
                    track.current_participants >= track.max_participants
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {track.current_participants >= track.max_participants ? 'Full' : 'Subscribe'}
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
