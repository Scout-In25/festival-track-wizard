/**
 * Activities API Service
 * Handles all activity-related API operations
 */
import { BaseApiService, apiRequest } from '../../apiUtils.js';

class ActivitiesService extends BaseApiService {
  constructor() {
    super('/activities');
  }

  /**
   * Check if WordPress environment is available
   * @returns {boolean} True if WordPress AJAX is available
   */
  isWordPressEnvironment() {
    return typeof window !== 'undefined' && 
           window.FestivalWizardData && 
           window.FestivalWizardData.ajaxUrl;
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
    
    // Add additional data
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
      throw new Error(result.data || 'WordPress AJAX request failed');
    }

    return { data: result.data };
  }

  /**
   * Get all activities
   * @returns {Promise} API response with activities array
   */
  async getAll() {
    if (this.isWordPressEnvironment()) {
      return this.wordpressAjaxRequest('festival_activities_all');
    }
    return apiRequest('get', '/activities/all');
  }

  /**
   * Get activity by ID
   * @param {string} activityId - Activity UUID
   * @returns {Promise} API response with activity data
   */
  async getById(activityId) {
    if (this.isWordPressEnvironment()) {
      return this.wordpressAjaxRequest('festival_activities_get', { activity_id: activityId });
    }
    return apiRequest('get', `/activities/${activityId}`);
  }

  /**
   * Create new activity (Admin only)
   * @param {object} activityData - Activity data
   * @returns {Promise} API response with created activity
   */
  async create(activityData) {
    return apiRequest('post', '/activities/', activityData);
  }

  /**
   * Update activity by ID (Admin only)
   * @param {string} activityId - Activity UUID
   * @param {object} activityData - Updated activity data
   * @returns {Promise} API response with updated activity
   */
  async update(activityId, activityData) {
    return apiRequest('put', `/activities/${activityId}`, activityData);
  }
}

// Export singleton instance
export const activitiesService = new ActivitiesService();
export default activitiesService;
