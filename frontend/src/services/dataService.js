/**
 * Unified Data Service
 * Consolidates data fetching for user profiles and activities across environments
 */
import { wordpressService } from './api/wordpressService.js';
import { participantsService } from './api/participantsService.js';
import { apiRequest } from '../apiUtils.js';

class DataService {
  /**
   * Check if WordPress environment is available
   * @returns {boolean} True if WordPress AJAX is available
   */
  isWordPressEnvironment() {
    return typeof window !== 'undefined' && 
           window.FestivalWizardData && 
           window.FestivalWizardData.ajaxUrl &&
           !import.meta.env.DEV;
  }


  /**
   * Make WordPress AJAX request
   * @param {string} action - WordPress AJAX action
   * @param {object} data - Additional data to send
   * @returns {Promise} API response
   */
  async wordpressAjaxRequest(action, data = {}) {
    const formData = new FormData();
    formData.append('action', action);
    formData.append('nonce', window.FestivalWizardData.nonce);
    
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });

    const response = await fetch(window.FestivalWizardData.ajaxUrl, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`WordPress AJAX request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      console.error('WordPress AJAX error:', result);
      // Try to extract meaningful error message
      const errorMessage = result.data?.message || result.data || 'WordPress AJAX request failed';
      throw new Error(errorMessage);
    }

    return result.data;
  }

  /**
   * Get user profile with unified environment handling
   * @returns {Promise} User profile data
   */
  async getUserProfile() {
    // WordPress environment
    if (this.isWordPressEnvironment()) {
      return wordpressService.getCurrentParticipantProfile();
    }

    // Development mode - fetch real participant from API using env username
    if (import.meta.env.DEV && import.meta.env.VITE_USERNAME) {
      console.log('DataService: Fetching participant from API using username:', import.meta.env.VITE_USERNAME);
      
      try {
        const participantResponse = await participantsService.getByUsername(import.meta.env.VITE_USERNAME);
        console.log('DataService: Participant API response:', participantResponse);
        
        // Create WordPress user data for consistency with WordPress environment
        const wordpressUserData = {
          username: participantResponse.data.username || import.meta.env.VITE_USERNAME,
          email: participantResponse.data.email || '',
          first_name: participantResponse.data.firstname || '',
          last_name: participantResponse.data.surname || '',
          display_name: `${participantResponse.data.firstname} ${participantResponse.data.surname}`
        };
        
        return {
          participant: participantResponse.data,
          wordpress_user: wordpressUserData
        };
      } catch (error) {
        console.error('DataService: Failed to fetch participant from API:', error);
        throw new Error(`Failed to fetch participant: ${error.message}`);
      }
    }

    // No user profile source available
    throw new Error('No user profile source available');
  }

  /**
   * Get activities with unified environment handling
   * @returns {Promise} Activities data
   */
  async getActivities() {
    // WordPress environment
    if (this.isWordPressEnvironment()) {
      return { data: await this.wordpressAjaxRequest('festival_activities_all') };
    }

    // Development or external API
    return apiRequest('get', '/activities/all');
  }

  /**
   * Get activity by ID with unified environment handling
   * @param {string} activityId - Activity UUID
   * @returns {Promise} Activity data
   */
  async getActivityById(activityId) {
    // WordPress environment
    if (this.isWordPressEnvironment()) {
      return { data: await this.wordpressAjaxRequest('festival_activities_get', { activity_id: activityId }) };
    }

    // Development or external API
    return apiRequest('get', `/activities/${activityId}`);
  }

  /**
   * Check if user is logged in (unified across environments)
   * @returns {boolean} True if user is logged in
   */
  isUserLoggedIn() {
    // WordPress environment
    if (this.isWordPressEnvironment()) {
      return wordpressService.isUserLoggedIn();
    }

    // Development mode with username configured
    if (import.meta.env.DEV && import.meta.env.VITE_USERNAME) {
      return true;
    }

    // External API - assume logged in if we have API key
    return !!window.FestivalWizardData?.apiKey || !!import.meta.env.VITE_API_KEY;
  }

  /**
   * Subscribe to an activity
   * @param {string} username - User's username
   * @param {string} activityId - Activity UUID
   * @returns {Promise} API response
   */
  async subscribeToActivity(username, activityId) {
    // WordPress environment
    if (this.isWordPressEnvironment()) {
      return { data: await this.wordpressAjaxRequest('festival_activities_subscribe', { 
        username, 
        activity_id: activityId 
      }) };
    }

    // Development or external API
    return apiRequest('put', `/activities/subscribe/${username}/${activityId}`);
  }

  /**
   * Unsubscribe from an activity
   * @param {string} username - User's username
   * @param {string} activityId - Activity UUID
   * @returns {Promise} API response
   */
  async unsubscribeFromActivity(username, activityId) {
    // WordPress environment
    if (this.isWordPressEnvironment()) {
      return { data: await this.wordpressAjaxRequest('festival_activities_unsubscribe', { 
        username, 
        activity_id: activityId 
      }) };
    }

    // Development or external API
    return apiRequest('put', `/activities/unsubscribe/${username}/${activityId}`);
  }
}

// Export singleton instance
export const dataService = new DataService();
export default dataService;