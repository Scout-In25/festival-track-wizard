/**
 * Utility functions for API calls with X-API-KEY header
 */
import axios from 'axios';

/**
 * Get the API key from WordPress localized data or environment variables
 * @returns {string|null} The API key or null if not available
 */
export const getApiKey = () => {
  // Check if we're in development mode and have an environment variable
  if (import.meta.env.DEV && import.meta.env.VITE_API_KEY) {
    if (import.meta.env.VITE_DEBUG) {
      console.log('Using API key from environment variable (development mode)');
    }
    return import.meta.env.VITE_API_KEY;
  }

  // In production or when no env var is set, use WordPress data
  const apiKey = window.FestivalWizardData?.apiKey;
  if (!apiKey) {
    if (import.meta.env.DEV) {
      console.warn('No API key found. Please set VITE_API_KEY in your .env file for development, or configure it in WordPress admin.');
    } else {
      console.warn('No API key found. Please configure it in WordPress admin.');
    }
  }
  return apiKey || null;
};

/**
 * Get the API base URL from WordPress localized data or environment variables
 * @returns {string} The API base URL
 */
export const getApiBaseUrl = () => {
  // In development mode, use Vite proxy to avoid CORS issues
  if (import.meta.env.DEV) {
    if (import.meta.env.VITE_DEBUG) {
      console.log('Using Vite proxy for API calls (development mode)');
    }
    // All API calls will be proxied through /api in development
    return '/api';
  }

  // In production, use WordPress data
  // Important: In production, activitiesService will use WordPress AJAX instead
  const apiBaseUrl = window.FestivalWizardData?.apiBaseUrl;
  return apiBaseUrl || 'https://si25.timoklabbers.nl';
};

/**
 * Create an axios instance with proper headers including X-API-KEY
 * @returns {object} Configured axios instance
 */
export const createApiClient = () => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error('API key not configured. Please contact an administrator.');
  }

  return axios.create({
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json'
    }
  });
};

/**
 * Build a full API URL from a relative endpoint
 * @param {string} endpoint - Relative API endpoint (e.g., '/participants/')
 * @returns {string} Full API URL
 */
export const buildApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl();
  // Ensure endpoint starts with / and baseUrl doesn't end with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBaseUrl}${cleanEndpoint}`;
};

/**
 * Make an API request with proper error handling
 * @param {string} method - HTTP method (get, post, put, delete)
 * @param {string} endpoint - API endpoint (relative or absolute URL)
 * @param {object} data - Request data (for POST/PUT requests)
 * @param {object} config - Additional axios config
 * @returns {Promise} API response
 */
export const apiRequest = async (method, endpoint, data = null, config = {}) => {
  try {
    const apiClient = createApiClient();
    
    // Build full URL if endpoint is relative
    const url = endpoint.startsWith('http') ? endpoint : buildApiUrl(endpoint);
    
    if (import.meta.env.VITE_DEBUG) {
      console.log(`API ${method.toUpperCase()} request to:`, url);
      if (data) console.log('Request data:', data);
    }
    
    let response;
    switch (method.toLowerCase()) {
      case 'get':
        response = await apiClient.get(url, config);
        break;
      case 'post':
        response = await apiClient.post(url, data, config);
        break;
      case 'put':
        response = await apiClient.put(url, data, config);
        break;
      case 'delete':
        response = await apiClient.delete(url, config);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
    
    if (import.meta.env.VITE_DEBUG) {
      console.log(`API ${method.toUpperCase()} response:`, response.data);
    }
    
    return response;
  } catch (error) {
    // Handle common API errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('API key authentication failed. Please contact an administrator.');
    } else if (error.response?.status === 404) {
      throw new Error('Resource not found.');
    } else if (error.response?.status === 422) {
      const validationErrors = error.response.data?.detail || 'Validation failed.';
      throw new Error(`Validation error: ${JSON.stringify(validationErrors)}`);
    } else if (error.message.includes('API key not configured')) {
      throw error; // Re-throw configuration errors as-is
    } else {
      console.error('API request failed:', error);
      throw new Error('Request failed. Please try again.');
    }
  }
};

/**
 * Base API service class with common CRUD operations
 */
export class BaseApiService {
  constructor(baseEndpoint) {
    this.baseEndpoint = baseEndpoint;
  }

  /**
   * Get all items
   * @param {object} params - Query parameters
   * @returns {Promise} API response
   */
  async getAll(params = {}) {
    const config = params ? { params } : {};
    return apiRequest('get', `${this.baseEndpoint}/all`, null, config);
  }

  /**
   * Get item by ID
   * @param {string} id - Item ID
   * @returns {Promise} API response
   */
  async getById(id) {
    return apiRequest('get', `${this.baseEndpoint}/${id}`);
  }

  /**
   * Create new item
   * @param {object} data - Item data
   * @returns {Promise} API response
   */
  async create(data) {
    return apiRequest('post', `${this.baseEndpoint}/`, data);
  }

  /**
   * Update item by ID
   * @param {string} id - Item ID
   * @param {object} data - Updated item data
   * @returns {Promise} API response
   */
  async update(id, data) {
    return apiRequest('put', `${this.baseEndpoint}/${id}`, data);
  }

  /**
   * Delete item by ID
   * @param {string} id - Item ID
   * @returns {Promise} API response
   */
  async delete(id) {
    return apiRequest('delete', `${this.baseEndpoint}/${id}`);
  }
}
