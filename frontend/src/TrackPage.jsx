import React, { useEffect } from 'react';
import TrackList from './components/TrackList';
import { useDataContext } from './contexts/DataProvider.jsx';

const TrackPage = () => {
  const { 
    userProfile, 
    participant, 
    wordpressUser, 
    isUserLoggedIn, 
    userProfileLoading, 
    userProfileError 
  } = useDataContext();
  
  useEffect(() => {
    // Log profile data when it becomes available
    if (userProfile) {
      console.log('TrackPage: User profile loaded from context:', userProfile);
      
      if (participant) {
        console.log('TrackPage: Participant data:', {
          username: participant.username,
          name: `${participant.first_name} ${participant.last_name}`,
          email: participant.email,
          ticket_type: participant.ticket_type,
          track: participant.track,
          activities: participant.activities,
          labels: participant.labels,
          reviews: participant.reviews
        });
      }
      
      if (wordpressUser) {
        console.log('TrackPage: WordPress user data:', {
          username: wordpressUser.username,
          email: wordpressUser.email,
          display_name: wordpressUser.display_name
        });
      }
    } else if (userProfileError) {
      console.error('TrackPage: User profile error:', userProfileError);
    } else if (!isUserLoggedIn) {
      console.log('TrackPage: User not logged in');
    }
  }, [userProfile, participant, wordpressUser, isUserLoggedIn, userProfileError]);

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

      {/* TrackList component handles fetching and displaying tracks */}
      <TrackList />
    </div>
  );
};

export default TrackPage;
