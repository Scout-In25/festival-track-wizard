/**
 * WordPress Service Tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import wordpressService from './wordpressService.js';

// Mock axios
vi.mock('axios');

describe('WordPressService', () => {
  const mockAjaxUrl = '/wp-admin/admin-ajax.php';
  const mockNonce = 'test-nonce-123';
  const mockUserData = {
    username: 'test_user',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    displayName: 'Test User'
  };

  beforeEach(() => {
    // Mock window.FestivalWizardData
    window.FestivalWizardData = {
      ajaxUrl: mockAjaxUrl,
      nonce: mockNonce,
      currentUser: mockUserData
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete window.FestivalWizardData;
  });

  describe('getAjaxUrl', () => {
    it('should return AJAX URL from WordPress data', () => {
      expect(wordpressService.getAjaxUrl()).toBe(mockAjaxUrl);
    });

    it('should return default URL when WordPress data not available', () => {
      delete window.FestivalWizardData;
      expect(wordpressService.getAjaxUrl()).toBe('/wp-admin/admin-ajax.php');
    });
  });

  describe('getNonce', () => {
    it('should return nonce from WordPress data', () => {
      expect(wordpressService.getNonce()).toBe(mockNonce);
    });

    it('should return empty string when nonce not available', () => {
      delete window.FestivalWizardData;
      expect(wordpressService.getNonce()).toBe('');
    });
  });

  describe('ajaxRequest', () => {
    it('should make successful AJAX request', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { result: 'test' }
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await wordpressService.ajaxRequest('test_action', { param: 'value' });

      expect(axios.post).toHaveBeenCalledWith(
        mockAjaxUrl,
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      );
      expect(result).toEqual({ result: 'test' });
    });

    it('should handle WordPress error response', async () => {
      const mockResponse = {
        data: {
          success: false,
          data: 'Error message'
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      await expect(wordpressService.ajaxRequest('test_action')).rejects.toThrow('Error message');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      axios.post.mockRejectedValue(networkError);

      await expect(wordpressService.ajaxRequest('test_action')).rejects.toThrow('Network error');
    });
  });

  describe('getCurrentParticipantProfile', () => {
    it('should fetch participant profile successfully', async () => {
      const mockProfile = {
        participant: {
          id: '123',
          username: 'test_user',
          email: 'test@example.com'
        },
        wordpress_user: mockUserData
      };
      
      const mockResponse = {
        data: {
          success: true,
          data: mockProfile
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await wordpressService.getCurrentParticipantProfile();

      expect(axios.post).toHaveBeenCalled();
      const formData = axios.post.mock.calls[0][1];
      expect(formData.get('action')).toBe('festival_participant_profile');
      expect(formData.get('nonce')).toBe(mockNonce);
      expect(result).toEqual(mockProfile);
    });

    it('should handle participant not found', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            participant: null,
            wordpress_user: mockUserData
          }
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await wordpressService.getCurrentParticipantProfile();

      expect(result.participant).toBeNull();
      expect(result.wordpress_user).toEqual(mockUserData);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user data', () => {
      expect(wordpressService.getCurrentUser()).toEqual(mockUserData);
    });

    it('should return null when no user data available', () => {
      delete window.FestivalWizardData;
      expect(wordpressService.getCurrentUser()).toBeNull();
    });
  });

  describe('isUserLoggedIn', () => {
    it('should return true when user is logged in', () => {
      expect(wordpressService.isUserLoggedIn()).toBe(true);
    });

    it('should return false when no user data', () => {
      delete window.FestivalWizardData;
      expect(wordpressService.isUserLoggedIn()).toBe(false);
    });

    it('should return false when user has no username', () => {
      window.FestivalWizardData.currentUser = { email: 'test@example.com' };
      expect(wordpressService.isUserLoggedIn()).toBe(false);
    });
  });
});