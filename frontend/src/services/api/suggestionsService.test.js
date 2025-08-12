/**
 * Suggestions Service Unit Tests
 * Tests for all suggestion-related API operations with mocked calls
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { suggestionsService } from './suggestionsService.js';
import * as apiUtils from '../../apiUtils.js';

// Mock the apiRequest function
vi.mock('../../apiUtils.js', () => ({
  apiRequest: vi.fn(),
  BaseApiService: class {
    constructor(basePath) {
      this.basePath = basePath;
    }
  }
}));

describe('SuggestionsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSuggestions', () => {
    it('should fetch personalized suggestions for a scout successfully', async () => {
      const username = 'john_doe';
      const mockSuggestions = {
        suggested_tracks: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            title: 'Outdoor Adventure',
            description: 'Learn outdoor skills',
            category: 'outdoor',
            max_participants: 20,
            current_participants: 5,
            start_time: '2024-06-01T10:00:00Z',
            end_time: '2024-06-01T12:00:00Z',
            location: 'Forest Camp',
            match_score: 0.95,
            match_reasons: ['outdoor skills interest', 'available time slot']
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            title: 'Leadership Workshop',
            description: 'Develop leadership skills',
            category: 'leadership',
            max_participants: 15,
            current_participants: 8,
            start_time: '2024-06-01T14:00:00Z',
            end_time: '2024-06-01T16:00:00Z',
            location: 'Training Room',
            match_score: 0.87,
            match_reasons: ['leadership role', 'skill development interest']
          }
        ],
        suggested_activities: [
          {
            id: '123e4567-e89b-12d3-a456-426614174003',
            title: 'Campfire Stories',
            description: 'Evening storytelling session',
            type: 'social',
            start_time: '2024-06-01T20:00:00Z',
            end_time: '2024-06-01T21:00:00Z',
            location: 'Main Campfire',
            match_score: 0.78,
            match_reasons: ['social activity preference', 'evening availability']
          }
        ],
        user_preferences: {
          preferred_categories: ['outdoor', 'leadership'],
          preferred_times: ['morning', 'evening'],
          skill_level: 'intermediate',
          interests: ['nature', 'team building']
        },
        recommendation_metadata: {
          algorithm_version: '2.1',
          generated_at: '2024-01-01T12:00:00Z',
          total_suggestions: 3,
          confidence_score: 0.89
        }
      };

      apiUtils.apiRequest.mockResolvedValue({ data: mockSuggestions });

      const result = await suggestionsService.getSuggestions(username);

      expect(apiUtils.apiRequest).toHaveBeenCalledWith('get', `/suggestions/${username}`);
      expect(result.data).toEqual(mockSuggestions);
      expect(result.data.suggested_tracks).toHaveLength(2);
      expect(result.data.suggested_activities).toHaveLength(1);
    });

    it('should handle empty suggestions for a scout', async () => {
      const username = 'new_scout';
      const mockEmptySuggestions = {
        suggested_tracks: [],
        suggested_activities: [],
        user_preferences: {
          preferred_categories: [],
          preferred_times: [],
          skill_level: 'beginner',
          interests: []
        },
        recommendation_metadata: {
          algorithm_version: '2.1',
          generated_at: '2024-01-01T12:00:00Z',
          total_suggestions: 0,
          confidence_score: 0.0,
          reason: 'Insufficient user data for personalized recommendations'
        }
      };

      apiUtils.apiRequest.mockResolvedValue({ data: mockEmptySuggestions });

      const result = await suggestionsService.getSuggestions(username);

      expect(apiUtils.apiRequest).toHaveBeenCalledWith('get', `/suggestions/${username}`);
      expect(result.data).toEqual(mockEmptySuggestions);
      expect(result.data.suggested_tracks).toHaveLength(0);
      expect(result.data.suggested_activities).toHaveLength(0);
    });

    it('should handle 404 error for non-existent scout', async () => {
      const username = 'nonexistent_scout';
      const errorMessage = 'Resource not found: Scout not found';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(suggestionsService.getSuggestions(username)).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('get', `/suggestions/${username}`);
    });

    it('should handle API errors when fetching suggestions', async () => {
      const username = 'john_doe';
      const errorMessage = 'Failed to generate suggestions';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(suggestionsService.getSuggestions(username)).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('get', `/suggestions/${username}`);
    });

    it('should handle suggestions with high match scores', async () => {
      const username = 'experienced_scout';
      const mockHighScoreSuggestions = {
        suggested_tracks: [
          {
            id: '123e4567-e89b-12d3-a456-426614174004',
            title: 'Advanced Wilderness Survival',
            description: 'Expert-level survival techniques',
            category: 'outdoor',
            max_participants: 10,
            current_participants: 3,
            start_time: '2024-06-01T08:00:00Z',
            end_time: '2024-06-01T18:00:00Z',
            location: 'Remote Forest',
            match_score: 0.98,
            match_reasons: ['expert skill level', 'wilderness experience', 'full day availability']
          }
        ],
        suggested_activities: [],
        user_preferences: {
          preferred_categories: ['outdoor', 'survival'],
          preferred_times: ['full_day'],
          skill_level: 'expert',
          interests: ['wilderness', 'survival skills', 'challenge']
        },
        recommendation_metadata: {
          algorithm_version: '2.1',
          generated_at: '2024-01-01T12:00:00Z',
          total_suggestions: 1,
          confidence_score: 0.98
        }
      };

      apiUtils.apiRequest.mockResolvedValue({ data: mockHighScoreSuggestions });

      const result = await suggestionsService.getSuggestions(username);

      expect(result.data.suggested_tracks[0].match_score).toBeGreaterThan(0.95);
      expect(result.data.recommendation_metadata.confidence_score).toBeGreaterThan(0.95);
    });

    it('should handle suggestions with low match scores', async () => {
      const username = 'picky_scout';
      const mockLowScoreSuggestions = {
        suggested_tracks: [
          {
            id: '123e4567-e89b-12d3-a456-426614174005',
            title: 'Basic Cooking',
            description: 'Learn basic cooking skills',
            category: 'life_skills',
            max_participants: 20,
            current_participants: 15,
            start_time: '2024-06-01T16:00:00Z',
            end_time: '2024-06-01T18:00:00Z',
            location: 'Kitchen',
            match_score: 0.45,
            match_reasons: ['available time slot']
          }
        ],
        suggested_activities: [],
        user_preferences: {
          preferred_categories: ['outdoor', 'sports'],
          preferred_times: ['afternoon'],
          skill_level: 'intermediate',
          interests: ['adventure', 'competition']
        },
        recommendation_metadata: {
          algorithm_version: '2.1',
          generated_at: '2024-01-01T12:00:00Z',
          total_suggestions: 1,
          confidence_score: 0.45,
          reason: 'Limited matching options available'
        }
      };

      apiUtils.apiRequest.mockResolvedValue({ data: mockLowScoreSuggestions });

      const result = await suggestionsService.getSuggestions(username);

      expect(result.data.suggested_tracks[0].match_score).toBeLessThan(0.5);
      expect(result.data.recommendation_metadata.confidence_score).toBeLessThan(0.5);
    });

    it('should handle network errors', async () => {
      const username = 'john_doe';
      const errorMessage = 'Network error: Unable to connect to server';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(suggestionsService.getSuggestions(username)).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('get', `/suggestions/${username}`);
    });

    it('should handle authentication errors', async () => {
      const username = 'john_doe';
      const errorMessage = 'API key authentication failed';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(suggestionsService.getSuggestions(username)).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('get', `/suggestions/${username}`);
    });

    it('should handle server errors', async () => {
      const username = 'john_doe';
      const errorMessage = 'Internal server error: Recommendation engine unavailable';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(suggestionsService.getSuggestions(username)).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('get', `/suggestions/${username}`);
    });

    it('should handle malformed username', async () => {
      const username = '';
      const errorMessage = 'Validation error: username is required';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(suggestionsService.getSuggestions(username)).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('get', `/suggestions/${username}`);
    });

    it('should handle suggestions with mixed content types', async () => {
      const username = 'diverse_scout';
      const mockMixedSuggestions = {
        suggested_tracks: [
          {
            id: '123e4567-e89b-12d3-a456-426614174006',
            title: 'Photography Workshop',
            description: 'Learn nature photography',
            category: 'creative',
            max_participants: 12,
            current_participants: 7,
            start_time: '2024-06-01T09:00:00Z',
            end_time: '2024-06-01T11:00:00Z',
            location: 'Art Studio',
            match_score: 0.82,
            match_reasons: ['creative interest', 'morning preference']
          }
        ],
        suggested_activities: [
          {
            id: '123e4567-e89b-12d3-a456-426614174007',
            title: 'Nature Walk',
            description: 'Guided nature exploration',
            type: 'outdoor',
            start_time: '2024-06-01T15:00:00Z',
            end_time: '2024-06-01T16:30:00Z',
            location: 'Nature Trail',
            match_score: 0.91,
            match_reasons: ['outdoor preference', 'nature interest', 'moderate duration']
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174008',
            title: 'Board Game Tournament',
            description: 'Strategic board game competition',
            type: 'indoor',
            start_time: '2024-06-01T19:00:00Z',
            end_time: '2024-06-01T21:00:00Z',
            location: 'Game Room',
            match_score: 0.67,
            match_reasons: ['strategy interest', 'evening availability']
          }
        ],
        user_preferences: {
          preferred_categories: ['creative', 'outdoor', 'strategy'],
          preferred_times: ['morning', 'afternoon', 'evening'],
          skill_level: 'intermediate',
          interests: ['photography', 'nature', 'games']
        },
        recommendation_metadata: {
          algorithm_version: '2.1',
          generated_at: '2024-01-01T12:00:00Z',
          total_suggestions: 3,
          confidence_score: 0.80
        }
      };

      apiUtils.apiRequest.mockResolvedValue({ data: mockMixedSuggestions });

      const result = await suggestionsService.getSuggestions(username);

      expect(result.data.suggested_tracks).toHaveLength(1);
      expect(result.data.suggested_activities).toHaveLength(2);
      expect(result.data.user_preferences.interests).toContain('photography');
      expect(result.data.user_preferences.interests).toContain('nature');
      expect(result.data.user_preferences.interests).toContain('games');
    });
  });

  describe('development mode mock', () => {
    it('should return mock suggestions in development mode', async () => {
      // Create a temporary mock service to test dev mode directly
      const mockService = new (class extends suggestionsService.constructor {
        async getSuggestions(username) {
          // Force development mode behavior
          console.log(`[SuggestionsService] Returning mock suggestions for ${username}`);
          const mockData = this._generateMockSuggestions(username);
          
          // Simulate API response format
          return Promise.resolve({
            data: mockData,
            status: 200,
            statusText: 'OK'
          });
        }
      })();

      const username = 'test_user';
      const result = await mockService.getSuggestions(username);

      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('suggested_tracks');
      expect(result.data).toHaveProperty('suggested_activities');
      expect(result.data).toHaveProperty('tracks'); // Fallback property
      expect(result.data).toHaveProperty('activities'); // Fallback property
      expect(result.data.suggested_tracks).toHaveLength(2);
      expect(result.data.suggested_activities).toHaveLength(3);
      expect(result.data.tracks).toHaveLength(2);
      expect(result.data.activities).toHaveLength(3);
      
      // Check structure matches template
      expect(result.data.tracks[0]).toHaveProperty('id');
      expect(result.data.tracks[0]).toHaveProperty('title');
      expect(result.data.tracks[0]).toHaveProperty('match_score');
      expect(result.data.tracks[0]).toHaveProperty('score'); // Fallback for score
      expect(result.data.activities[0]).toHaveProperty('id');
      expect(result.data.activities[0]).toHaveProperty('score');
      
      // Verify scores are within expected range (1-100)
      expect(result.data.tracks[0].score).toBeGreaterThan(0);
      expect(result.data.tracks[0].score).toBeLessThanOrEqual(100);
      expect(result.data.activities[0].score).toBeGreaterThan(0);
      expect(result.data.activities[0].score).toBeLessThanOrEqual(100);
    });
  });

  describe('service initialization', () => {
    it('should initialize correctly', () => {
      expect(suggestionsService).toBeDefined();
      expect(typeof suggestionsService.getSuggestions).toBe('function');
    });
  });
});
