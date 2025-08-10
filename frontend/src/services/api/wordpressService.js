/**
 * WordPress AJAX Service
 * Handles WordPress-specific AJAX operations
 */
import axios from 'axios';

class WordPressService {
  /**
   * Get WordPress AJAX URL
   * @returns {string} The AJAX URL
   */
  getAjaxUrl() {
    if (import.meta.env.DEV) {
      // In development, we might not have WordPress data
      return window.FestivalWizardData?.ajaxUrl || '/wp-admin/admin-ajax.php';
    }
    return window.FestivalWizardData?.ajaxUrl || '/wp-admin/admin-ajax.php';
  }

  /**
   * Get WordPress nonce
   * @returns {string} The nonce
   */
  getNonce() {
    return window.FestivalWizardData?.nonce || '';
  }

  /**
   * Make WordPress AJAX request
   * @param {string} action - WordPress action name
   * @param {object} data - Additional data to send
   * @returns {Promise} Response data
   */
  async ajaxRequest(action, data = {}) {
    const formData = new FormData();
    formData.append('action', action);
    formData.append('nonce', this.getNonce());

    // Add any additional data
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });

    try {
      const response = await axios.post(this.getAjaxUrl(), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success === false) {
        throw new Error(response.data.data || 'Request failed');
      }

      return response.data.data;
    } catch (error) {
      if (error.response?.data?.data) {
        throw new Error(error.response.data.data);
      }
      throw error;
    }
  }

  /**
   * Get current participant profile
   * Fetches the participant profile for the logged-in WordPress user
   * @returns {Promise} Response with participant and wordpress_user data
   */
  async getCurrentParticipantProfile() {
    return this.ajaxRequest('festival_participant_profile');
  }

  /**
   * Get current WordPress user data
   * @returns {object|null} User data from localized script
   */
  getCurrentUser() {
    return window.FestivalWizardData?.currentUser || null;
  }

  /**
   * Check if user is logged in
   * @returns {boolean} True if user data is available
   */
  isUserLoggedIn() {
    // First check the explicit isLoggedIn flag if available
    if (typeof window.FestivalWizardData?.isLoggedIn === 'boolean') {
      return window.FestivalWizardData.isLoggedIn;
    }
    // Fallback to checking if user data exists
    const user = this.getCurrentUser();
    return !!(user && user.username);
  }
}

// Export singleton instance
export const wordpressService = new WordPressService();
export default wordpressService;