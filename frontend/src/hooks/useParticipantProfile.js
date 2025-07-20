/**
 * Custom hook for accessing participant profile from context
 * Now acts as a convenience wrapper around useDataContext
 */
import { useDataContext } from '../contexts/DataProvider.jsx';

export const useParticipantProfile = () => {
  const { 
    userProfile,
    participant, 
    wordpressUser, 
    isNewUser, 
    userProfileLoading: loading, 
    userProfileError: error,
    fetchUserProfile
  } = useDataContext();

  return {
    loading,
    error,
    participant,
    wordpressUser,
    isNewUser,
    userProfile,
    refetch: () => fetchUserProfile(true) // Force refresh
  };
};

export default useParticipantProfile;