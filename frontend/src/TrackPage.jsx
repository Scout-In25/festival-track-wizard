import React, { useState, useEffect } from 'react';
import { apiRequest } from './apiUtils';

const TrackPage = () => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Example function for future API integration
  const loadTracks = async () => {
    setLoading(true);
    setError(null);
    try {
      // This is a placeholder - replace with actual API endpoint when available
      // const response = await apiRequest('get', 'https://si25.nl/REST/tracks/');
      // setTracks(response.data);
      
      // For now, just log that the API utility is ready
      console.log('TrackPage: API utility ready for future track loading');
    } catch (err) {
      setError(err.message);
      console.error('Failed to load tracks:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Tracks</h1>
      <p>Placeholder for intro text.</p>

      <h2>Filters</h2>
      <div>
        {/* Placeholder for pill buttons */}
        <button>Filter 1</button>
        <button>Filter 2</button>
        <button>Filter 3</button>
      </div>

      <div>
        {/* Placeholder for Experience dropdown */}
        <label htmlFor="experience-dropdown">Experience:</label>
        <select id="experience-dropdown">
          <option value="">Select an experience</option>
          <option value="experience1">Experience 1</option>
          <option value="experience2">Experience 2</option>
        </select>
      </div>

      <div>
        {/* Container for Track List */}
        <h3>Day - Date (Placeholder)</h3>
        {error && (
          <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
            Error: {error}
          </div>
        )}
        {loading ? (
          <p>Loading tracks...</p>
        ) : (
          <ul>
            <li>(time start) - (time end) - title event - status (icon: green, red, grey)</li>
            <li>(time start) - (time end) - title event - status (icon: green, red, grey)</li>
          </ul>
        )}
      </div>

      {/* Uncomment this button when you want to test API connectivity */}
      {/* <button onClick={loadTracks} disabled={loading}>
        {loading ? 'Loading...' : 'Load Tracks'}
      </button> */}
    </div>
  );
};

export default TrackPage;
