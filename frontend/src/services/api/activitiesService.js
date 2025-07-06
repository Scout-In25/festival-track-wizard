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
   * Get all activities
   * @returns {Promise} API response with activities array
   */
  async getAll() {
    return apiRequest('get', '/activities/all');
  }

  /**
   * Get activity by ID
   * @param {string} activityId - Activity UUID
   * @returns {Promise} API response with activity data
   */
  async getById(activityId) {
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
