/**
 * Activities Service Unit Tests
 * Tests for all activity-related API operations with mocked calls
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { activitiesService } from './activitiesService.js';
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

describe('ActivitiesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all activities successfully', async () => {
      const mockActivities = [
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          title: 'Campfire Stories',
          description: 'Evening storytelling session',
          type: 'social',
          start_time: '2024-06-01T20:00:00Z',
          end_time: '2024-06-01T21:00:00Z',
          location: 'Main Campfire',
          metadata: {},
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174003',
          title: 'First Aid Workshop',
          description: 'Learn basic first aid skills',
          type: 'workshop',
          start_time: '2024-06-01T14:00:00Z',
          end_time: '2024-06-01T16:00:00Z',
          location: 'Training Room',
          metadata: {},
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      apiUtils.apiRequest.mockResolvedValue({ data: mockActivities });

      const result = await activitiesService.getAll();

      expect(apiUtils.apiRequest).toHaveBeenCalledWith('get', '/activities/all');
      expect(result.data).toEqual(mockActivities);
    });

    it('should handle API errors when fetching activities', async () => {
      const errorMessage = 'Failed to fetch activities';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(activitiesService.getAll()).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('get', '/activities/all');
    });

    it('should return empty array when no activities exist', async () => {
      apiUtils.apiRequest.mockResolvedValue({ data: [] });

      const result = await activitiesService.getAll();

      expect(apiUtils.apiRequest).toHaveBeenCalledWith('get', '/activities/all');
      expect(result.data).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should fetch activity by ID successfully', async () => {
      const activityId = '123e4567-e89b-12d3-a456-426614174002';
      const mockActivity = {
        id: activityId,
        title: 'Campfire Stories',
        description: 'Evening storytelling session',
        type: 'social',
        start_time: '2024-06-01T20:00:00Z',
        end_time: '2024-06-01T21:00:00Z',
        location: 'Main Campfire',
        metadata: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      apiUtils.apiRequest.mockResolvedValue({ data: mockActivity });

      const result = await activitiesService.getById(activityId);

      expect(apiUtils.apiRequest).toHaveBeenCalledWith('get', `/activities/${activityId}`);
      expect(result.data).toEqual(mockActivity);
    });

    it('should handle 404 error for non-existent activity', async () => {
      const activityId = 'nonexistent-activity-id';
      const errorMessage = 'Resource not found';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(activitiesService.getById(activityId)).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('get', `/activities/${activityId}`);
    });

    it('should handle malformed UUID error', async () => {
      const activityId = 'invalid-uuid';
      const errorMessage = 'Invalid UUID format';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(activitiesService.getById(activityId)).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('get', `/activities/${activityId}`);
    });
  });

  describe('create', () => {
    it('should create a new activity successfully (Admin only)', async () => {
      const activityData = {
        title: 'New Workshop',
        description: 'A new workshop for testing',
        type: 'workshop',
        start_time: '2024-06-01T10:00:00Z',
        end_time: '2024-06-01T12:00:00Z',
        location: 'Workshop Room',
        metadata: {
          max_participants: 15,
          required_materials: ['notebook', 'pen']
        }
      };

      const mockCreatedActivity = {
        id: '123e4567-e89b-12d3-a456-426614174004',
        ...activityData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      apiUtils.apiRequest.mockResolvedValue({ data: mockCreatedActivity });

      const result = await activitiesService.create(activityData);

      expect(apiUtils.apiRequest).toHaveBeenCalledWith('post', '/activities/', activityData);
      expect(result.data).toEqual(mockCreatedActivity);
    });

    it('should handle validation errors when creating activity', async () => {
      const activityData = {
        title: '',
        description: 'Invalid activity',
        type: 'invalid-type',
        start_time: 'invalid-date',
        end_time: 'invalid-date',
        location: '',
        metadata: {}
      };

      const errorMessage = 'Validation error: title is required';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(activitiesService.create(activityData)).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('post', '/activities/', activityData);
    });

    it('should handle authorization errors for non-admin users', async () => {
      const activityData = {
        title: 'Unauthorized Activity',
        description: 'This should fail',
        type: 'workshop',
        start_time: '2024-06-01T10:00:00Z',
        end_time: '2024-06-01T12:00:00Z',
        location: 'Workshop Room',
        metadata: {}
      };

      const errorMessage = 'Insufficient permissions: Admin access required';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(activitiesService.create(activityData)).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('post', '/activities/', activityData);
    });

    it('should handle time conflict errors', async () => {
      const activityData = {
        title: 'Conflicting Activity',
        description: 'This conflicts with another activity',
        type: 'workshop',
        start_time: '2024-06-01T10:00:00Z',
        end_time: '2024-06-01T12:00:00Z',
        location: 'Workshop Room',
        metadata: {}
      };

      const errorMessage = 'Schedule conflict: Another activity is scheduled at this time';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(activitiesService.create(activityData)).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('post', '/activities/', activityData);
    });
  });

  describe('update', () => {
    it('should update activity successfully (Admin only)', async () => {
      const activityId = '123e4567-e89b-12d3-a456-426614174002';
      const updateData = {
        title: 'Updated Activity Title',
        description: 'Updated description',
        location: 'New Location'
      };

      const mockUpdatedActivity = {
        id: activityId,
        title: 'Updated Activity Title',
        description: 'Updated description',
        type: 'social',
        start_time: '2024-06-01T20:00:00Z',
        end_time: '2024-06-01T21:00:00Z',
        location: 'New Location',
        metadata: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      };

      apiUtils.apiRequest.mockResolvedValue({ data: mockUpdatedActivity });

      const result = await activitiesService.update(activityId, updateData);

      expect(apiUtils.apiRequest).toHaveBeenCalledWith('put', `/activities/${activityId}`, updateData);
      expect(result.data).toEqual(mockUpdatedActivity);
    });

    it('should handle errors when updating non-existent activity', async () => {
      const activityId = 'nonexistent-activity-id';
      const updateData = { title: 'Updated' };
      const errorMessage = 'Resource not found';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(activitiesService.update(activityId, updateData)).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('put', `/activities/${activityId}`, updateData);
    });

    it('should handle authorization errors for non-admin users', async () => {
      const activityId = '123e4567-e89b-12d3-a456-426614174002';
      const updateData = { title: 'Unauthorized Update' };
      const errorMessage = 'Insufficient permissions: Admin access required';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(activitiesService.update(activityId, updateData)).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('put', `/activities/${activityId}`, updateData);
    });

    it('should handle validation errors when updating activity', async () => {
      const activityId = '123e4567-e89b-12d3-a456-426614174002';
      const updateData = {
        title: '',
        start_time: 'invalid-date',
        end_time: 'before-start-time'
      };
      const errorMessage = 'Validation error: end_time must be after start_time';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(activitiesService.update(activityId, updateData)).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('put', `/activities/${activityId}`, updateData);
    });
  });

  describe('service initialization', () => {
    it('should initialize with correct base path', () => {
      expect(activitiesService.basePath).toBe('/activities');
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const errorMessage = 'Network error: Unable to connect to server';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(activitiesService.getAll()).rejects.toThrow(errorMessage);
    });

    it('should handle server errors', async () => {
      const errorMessage = 'Internal server error';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(activitiesService.getAll()).rejects.toThrow(errorMessage);
    });

    it('should handle authentication errors', async () => {
      const errorMessage = 'API key authentication failed';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(activitiesService.getAll()).rejects.toThrow(errorMessage);
    });
  });
});
