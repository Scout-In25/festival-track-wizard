/**
 * Labels API Service
 * Handles all label assignment operations
 */
import { apiRequest } from '../../apiUtils.js';

class LabelsService {
  /**
   * Assign labels to users
   * @param {Array} assignmentData - Array of assignment objects with username and labels
   * @returns {Promise} API response
   */
  async assignLabels(assignmentData) {
    return apiRequest('post', '/labels/assign', assignmentData);
  }
}

// Export singleton instance
export const labelsService = new LabelsService();
export default labelsService;