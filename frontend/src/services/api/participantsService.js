/**
 * Participants API Service
 * Handles all participant-related API operations
 */
import { BaseApiService, apiRequest } from '../../apiUtils.js';

class ParticipantsService extends BaseApiService {
  constructor() {
    super('/participants');
  }

  /**
   * Get all participants
   * @returns {Promise} API response with participants array
   */
  async getAll() {
    return apiRequest('get', '/participants/');
  }

  /**
   * Get participant by username
   * @param {string} username - Participant username
   * @returns {Promise} API response with participant data
   */
  async getByUsername(username) {
    return apiRequest('get', `/participants/${username}`);
  }

  /**
   * Create new participant
   * @param {object} participantData - Participant data
   * @returns {Promise} API response with created participant
   */
  async create(participantData) {
    return apiRequest('post', '/participants/', participantData);
  }

  /**
   * Update participant by username
   * @param {string} username - Participant username
   * @param {object} participantData - Updated participant data
   * @returns {Promise} API response with updated participant
   */
  async updateByUsername(username, participantData) {
    return apiRequest('put', `/participants/${username}`, participantData);
  }

  /**
   * Delete participant by username
   * @param {string} username - Participant username
   * @returns {Promise} API response
   */
  async deleteByUsername(username) {
    return apiRequest('delete', `/participants/${username}`);
  }

  /**
   * Sync participant connections
   * @param {string} participantId - Participant UUID
   * @param {object} participantData - Participant data for sync
   * @returns {Promise} API response
   */
  async syncConnections(participantId, participantData) {
    return apiRequest('post', `/participants/connection/sync?participant_id=${participantId}`, participantData);
  }
}

// Export singleton instance
export const participantsService = new ParticipantsService();
export default participantsService;
