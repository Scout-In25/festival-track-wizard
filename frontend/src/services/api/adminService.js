/**
 * Admin API Service
 * Handles all admin-specific API operations
 */
import axios from 'axios';
import { apiRequest } from '../../apiUtils.js';

class AdminService {
  constructor() {
    this.ajaxUrl = window.FestivalWizardData?.ajaxUrl || '/wp-admin/admin-ajax.php';
    this.nonce = window.FestivalWizardData?.nonce || '';
    
    // In-memory cache for dev mode only
    if (this.isDevMode()) {
      this.devCache = {
        participants: null,
        participantsCacheTime: null,
        participantsCacheDuration: 5 * 60 * 1000 // 5 minutes
      };
      console.log('AdminService: Dev mode in-memory cache enabled');
    }
  }

  /**
   * Check if we're in dev mode
   */
  isDevMode() {
    return import.meta.env.DEV;
  }

  /**
   * Subscribe a user to an activity (admin only)
   * @param {string} username - Username to subscribe
   * @param {string} activityId - Activity ID
   * @returns {Promise} API response
   */
  async subscribeUserToActivity(username, activityId) {
    if (this.isDevMode()) {
      // In dev mode, use direct API call
      const response = await apiRequest('put', `/activities/subscribe/${username}/${activityId}`);
      return {
        success: true,
        data: response.data
      };
    }

    const formData = new FormData();
    formData.append('action', 'festival_admin_subscribe_user');
    formData.append('nonce', this.nonce);
    formData.append('username', username);
    formData.append('activity_id', activityId);

    try {
      const response = await axios.post(this.ajaxUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.data || 'Failed to subscribe user');
      }
    } catch (error) {
      console.error('Admin subscribe error:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe a user from an activity (admin only)
   * @param {string} username - Username to unsubscribe
   * @param {string} activityId - Activity ID
   * @returns {Promise} API response
   */
  async unsubscribeUserFromActivity(username, activityId) {
    if (this.isDevMode()) {
      // In dev mode, use direct API call
      const response = await apiRequest('put', `/activities/unsubscribe/${username}/${activityId}`);
      return {
        success: true,
        data: response.data
      };
    }

    const formData = new FormData();
    formData.append('action', 'festival_admin_unsubscribe_user');
    formData.append('nonce', this.nonce);
    formData.append('username', username);
    formData.append('activity_id', activityId);

    try {
      const response = await axios.post(this.ajaxUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.data || 'Failed to unsubscribe user');
      }
    } catch (error) {
      console.error('Admin unsubscribe error:', error);
      throw error;
    }
  }

  /**
   * Clear labels for a user (admin only)
   * @param {string} username - Username to clear labels for
   * @returns {Promise} API response
   */
  async clearUserLabels(username) {
    if (this.isDevMode()) {
      // In dev mode, use direct API call
      return apiRequest('post', `/labels/clear/${username}`);
    }

    const formData = new FormData();
    formData.append('action', 'festival_admin_clear_labels');
    formData.append('nonce', this.nonce);
    formData.append('username', username);

    try {
      const response = await axios.post(this.ajaxUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.data || 'Failed to clear user labels');
      }
    } catch (error) {
      console.error('Admin clear labels error:', error);
      throw error;
    }
  }

  /**
   * Get all participants (admin only)
   * @param {boolean} forceRefresh - Force refresh from server cache
   * @returns {Promise} API response with participants array
   */
  async getAllParticipants(forceRefresh = false) {
    if (this.isDevMode()) {
      // Check in-memory cache first (dev mode only)
      if (!forceRefresh && this.devCache.participants && this.devCache.participantsCacheTime) {
        const age = Date.now() - this.devCache.participantsCacheTime;
        if (age < this.devCache.participantsCacheDuration) {
          console.log(`AdminService: Using dev in-memory cache (age: ${Math.floor(age/1000)}s)`);
          return {
            success: true,
            data: this.devCache.participants,
            cache_info: {
              cached: true,
              cache_age: Math.floor(age / 1000),
              timestamp: Date.now(),
              source: 'dev_memory'
            }
          };
        }
      }
      
      // Fetch fresh data from API
      console.log('AdminService: Fetching fresh data from API' + (forceRefresh ? ' (forced)' : ' (cache expired)'));
      const response = await apiRequest('get', '/participants/');
      
      // Cache the response in memory (dev mode only)
      this.devCache.participants = response;
      this.devCache.participantsCacheTime = Date.now();
      console.log(`AdminService: Cached ${Array.isArray(response) ? response.length : 0} participants in dev memory`);
      
      return {
        success: true,
        data: response,
        cache_info: {
          cached: false,
          cache_age: 0,
          timestamp: Date.now(),
          source: 'dev_api'
        }
      };
    }

    const formData = new FormData();
    formData.append('action', 'festival_admin_get_all_participants');
    formData.append('nonce', this.nonce);
    if (forceRefresh) {
      formData.append('force_refresh', 'true');
    }

    try {
      const response = await axios.post(this.ajaxUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.data || 'Failed to fetch participants');
      }
    } catch (error) {
      console.error('Admin get participants error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const adminService = new AdminService();
export default adminService;