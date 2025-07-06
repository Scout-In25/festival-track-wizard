/**
 * Suggestions API Service
 * Handles all suggestion-related API operations
 */
import { apiRequest } from '../../apiUtils.js';

class SuggestionsService {
  /**
   * Get suggestions for a scout by username
   * @param {string} username - Scout username
   * @returns {Promise} API response with suggestions data
   */
  async getSuggestions(username) {
    return apiRequest('get', `/suggestions/suggestions/${username}`);
  }
}

// Export singleton instance
export const suggestionsService = new SuggestionsService();
export default suggestionsService;
