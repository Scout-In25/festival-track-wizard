/**
 * Activities API Service
 * Handles all activity-related API operations
 */
import { BaseApiService, apiRequest } from '../../apiUtils.js';
import { dataService } from '../dataService.js';

class ActivitiesService extends BaseApiService {
  constructor() {
    super('/activities');
  }


  /**
   * Get all activities
   * @returns {Promise} API response with activities array
   */
  async getAll() {
    return dataService.getActivities();
  }

  /**
   * Get activity by ID
   * @param {string} activityId - Activity UUID
   * @returns {Promise} API response with activity data
   */
  async getById(activityId) {
    return dataService.getActivityById(activityId);
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

  /**
   * Subscribe to an activity
   * @param {string} username - User's username
   * @param {string} activityId - Activity UUID
   * @returns {Promise} API response
   */
  async subscribe(username, activityId) {
    return dataService.subscribeToActivity(username, activityId);
  }

  /**
   * Unsubscribe from an activity
   * @param {string} username - User's username
   * @param {string} activityId - Activity UUID
   * @returns {Promise} API response
   */
  async unsubscribe(username, activityId) {
    return dataService.unsubscribeFromActivity(username, activityId);
  }
}

// Export singleton instance
export const activitiesService = new ActivitiesService();
export default activitiesService;
