/**
 * Tracks API Service
 * Handles all track-related API operations
 */
import { BaseApiService, apiRequest } from '../../apiUtils.js';

class TracksService extends BaseApiService {
  constructor() {
    super('/tracks');
  }

  /**
   * Get all tracks
   * @returns {Promise} API response with tracks array
   */
  async getAll() {
    return apiRequest('get', '/tracks/all');
  }

  /**
   * Get track by ID
   * @param {string} trackId - Track UUID
   * @returns {Promise} API response with track data
   */
  async getById(trackId) {
    return apiRequest('get', `/tracks/${trackId}`);
  }

  /**
   * Create new track
   * @param {object} trackData - Track data
   * @returns {Promise} API response with created track
   */
  async create(trackData) {
    return apiRequest('post', '/tracks/', trackData);
  }

  /**
   * Update track by ID
   * @param {string} trackId - Track UUID
   * @param {object} trackData - Updated track data
   * @returns {Promise} API response with updated track
   */
  async update(trackId, trackData) {
    return apiRequest('put', `/tracks/${trackId}`, trackData);
  }

  /**
   * Delete track by ID
   * @param {string} trackId - Track UUID
   * @returns {Promise} API response
   */
  async delete(trackId) {
    return apiRequest('delete', `/tracks/${trackId}`);
  }

  /**
   * Subscribe scout to track
   * @param {string} username - Scout username
   * @param {string} trackId - Track UUID
   * @returns {Promise} API response
   */
  async subscribeScout(username, trackId) {
    return apiRequest('put', `/tracks/subscribe/${username}/${trackId}`);
  }

  /**
   * Unsubscribe scout from track
   * @param {string} username - Scout username
   * @returns {Promise} API response
   */
  async unsubscribeScout(username) {
    return apiRequest('put', `/tracks/unsubscribe/${username}`);
  }

  /**
   * Add labels to track
   * @param {string} trackId - Track UUID
   * @param {string[]} labelIds - Array of label UUIDs
   * @returns {Promise} API response with updated track
   */
  async addLabels(trackId, labelIds) {
    return apiRequest('put', `/tracks/labels/${trackId}`, labelIds);
  }

  /**
   * Remove labels from track
   * @param {string} trackId - Track UUID
   * @param {string[]} labelIds - Array of label UUIDs to remove
   * @returns {Promise} API response with updated track
   */
  async removeLabels(trackId, labelIds) {
    return apiRequest('delete', `/tracks/labels/remove/${trackId}`, labelIds);
  }
}

// Export singleton instance
export const tracksService = new TracksService();
export default tracksService;
