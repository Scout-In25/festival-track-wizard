/**
 * Tracks Service Unit Tests
 * Tests for all track-related API operations with mocked calls
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tracksService } from './tracksService.js';
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

describe('TracksService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all tracks successfully', async () => {
      const mockTracks = [
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
          labels: [],
          metadata: {},
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      apiUtils.apiRequest.mockResolvedValue({ data: mockTracks });

      const result = await tracksService.getAll();

      expect(apiUtils.apiRequest).toHaveBeenCalledWith('get', '/tracks/all');
      expect(result.data).toEqual(mockTracks);
    });

    it('should handle API errors when fetching tracks', async () => {
      const errorMessage = 'Failed to fetch tracks';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(tracksService.getAll()).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('get', '/tracks/all');
    });
  });

  describe('getById', () => {
    it('should fetch track by ID successfully', async () => {
      const trackId = '123e4567-e89b-12d3-a456-426614174001';
      const mockTrack = {
        id: trackId,
        title: 'Outdoor Adventure',
        description: 'Learn outdoor skills',
        category: 'outdoor',
        max_participants: 20,
        current_participants: 5,
        start_time: '2024-06-01T10:00:00Z',
        end_time: '2024-06-01T12:00:00Z',
        location: 'Forest Camp',
        labels: [],
        metadata: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      apiUtils.apiRequest.mockResolvedValue({ data: mockTrack });

      const result = await tracksService.getById(trackId);

      expect(apiUtils.apiRequest).toHaveBeenCalledWith('get', `/tracks/${trackId}`);
      expect(result.data).toEqual(mockTrack);
    });

    it('should handle 404 error for non-existent track', async () => {
      const trackId = 'nonexistent-track-id';
      const errorMessage = 'Resource not found';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(tracksService.getById(trackId)).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('get', `/tracks/${trackId}`);
    });
  });

  describe('create', () => {
    it('should create a new track successfully', async () => {
      const trackData = {
        title: 'New Track',
        description: 'A new track for testing',
        category: 'indoor',
        max_participants: 15,
        start_time: '2024-06-01T14:00:00Z',
        end_time: '2024-06-01T16:00:00Z',
        location: 'Indoor Hall',
        metadata: {}
      };

      const mockCreatedTrack = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        ...trackData,
        current_participants: 0,
        labels: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      apiUtils.apiRequest.mockResolvedValue({ data: mockCreatedTrack });

      const result = await tracksService.create(trackData);

      expect(apiUtils.apiRequest).toHaveBeenCalledWith('post', '/tracks/', trackData);
      expect(result.data).toEqual(mockCreatedTrack);
    });

    it('should handle validation errors when creating track', async () => {
      const trackData = {
        title: '',
        description: 'Invalid track',
        category: 'invalid',
        max_participants: -1,
        start_time: 'invalid-date',
        end_time: 'invalid-date',
        location: '',
        metadata: {}
      };

      const errorMessage = 'Validation error: title is required';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(tracksService.create(trackData)).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('post', '/tracks/', trackData);
    });
  });

  describe('update', () => {
    it('should update track successfully', async () => {
      const trackId = '123e4567-e89b-12d3-a456-426614174001';
      const updateData = {
        title: 'Updated Track Title',
        max_participants: 25
      };

      const mockUpdatedTrack = {
        id: trackId,
        title: 'Updated Track Title',
        description: 'Learn outdoor skills',
        category: 'outdoor',
        max_participants: 25,
        current_participants: 5,
        start_time: '2024-06-01T10:00:00Z',
        end_time: '2024-06-01T12:00:00Z',
        location: 'Forest Camp',
        labels: [],
        metadata: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      };

      apiUtils.apiRequest.mockResolvedValue({ data: mockUpdatedTrack });

      const result = await tracksService.update(trackId, updateData);

      expect(apiUtils.apiRequest).toHaveBeenCalledWith('put', `/tracks/${trackId}`, updateData);
      expect(result.data).toEqual(mockUpdatedTrack);
    });

    it('should handle errors when updating non-existent track', async () => {
      const trackId = 'nonexistent-track-id';
      const updateData = { title: 'Updated' };
      const errorMessage = 'Resource not found';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(tracksService.update(trackId, updateData)).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('put', `/tracks/${trackId}`, updateData);
    });
  });

  describe('delete', () => {
    it('should delete track successfully', async () => {
      const trackId = '123e4567-e89b-12d3-a456-426614174001';
      apiUtils.apiRequest.mockResolvedValue({ data: {} });

      const result = await tracksService.delete(trackId);

      expect(apiUtils.apiRequest).toHaveBeenCalledWith('delete', `/tracks/${trackId}`);
      expect(result.data).toEqual({});
    });

    it('should handle errors when deleting non-existent track', async () => {
      const trackId = 'nonexistent-track-id';
      const errorMessage = 'Resource not found';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(tracksService.delete(trackId)).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('delete', `/tracks/${trackId}`);
    });
  });

  describe('subscribeScout', () => {
    it('should subscribe scout to track successfully', async () => {
      const username = 'john_doe';
      const trackId = '123e4567-e89b-12d3-a456-426614174001';
      apiUtils.apiRequest.mockResolvedValue({ data: {} });

      const result = await tracksService.subscribeScout(username, trackId);

      expect(apiUtils.apiRequest).toHaveBeenCalledWith('put', `/tracks/subscribe/${username}/${trackId}`);
      expect(result.data).toEqual({});
    });

    it('should handle errors when subscribing to full track', async () => {
      const username = 'john_doe';
      const trackId = '123e4567-e89b-12d3-a456-426614174001';
      const errorMessage = 'Track is full';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(tracksService.subscribeScout(username, trackId)).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('put', `/tracks/subscribe/${username}/${trackId}`);
    });
  });

  describe('unsubscribeScout', () => {
    it('should unsubscribe scout from track successfully', async () => {
      const username = 'john_doe';
      apiUtils.apiRequest.mockResolvedValue({ data: {} });

      const result = await tracksService.unsubscribeScout(username);

      expect(apiUtils.apiRequest).toHaveBeenCalledWith('put', `/tracks/unsubscribe/${username}`);
      expect(result.data).toEqual({});
    });

    it('should handle errors when unsubscribing scout not in track', async () => {
      const username = 'john_doe';
      const errorMessage = 'Scout not subscribed to any track';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(tracksService.unsubscribeScout(username)).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('put', `/tracks/unsubscribe/${username}`);
    });
  });

  describe('addLabels', () => {
    it('should add labels to track successfully', async () => {
      const trackId = '123e4567-e89b-12d3-a456-426614174001';
      const labelIds = ['label-1', 'label-2'];

      const mockUpdatedTrack = {
        id: trackId,
        title: 'Outdoor Adventure',
        description: 'Learn outdoor skills',
        category: 'outdoor',
        max_participants: 20,
        current_participants: 5,
        start_time: '2024-06-01T10:00:00Z',
        end_time: '2024-06-01T12:00:00Z',
        location: 'Forest Camp',
        labels: labelIds,
        metadata: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      };

      apiUtils.apiRequest.mockResolvedValue({ data: mockUpdatedTrack });

      const result = await tracksService.addLabels(trackId, labelIds);

      expect(apiUtils.apiRequest).toHaveBeenCalledWith('put', `/tracks/labels/${trackId}`, labelIds);
      expect(result.data).toEqual(mockUpdatedTrack);
    });

    it('should handle errors when adding labels to non-existent track', async () => {
      const trackId = 'nonexistent-track-id';
      const labelIds = ['label-1'];
      const errorMessage = 'Resource not found';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(tracksService.addLabels(trackId, labelIds)).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('put', `/tracks/labels/${trackId}`, labelIds);
    });
  });

  describe('removeLabels', () => {
    it('should remove labels from track successfully', async () => {
      const trackId = '123e4567-e89b-12d3-a456-426614174001';
      const labelIds = ['label-1'];

      const mockUpdatedTrack = {
        id: trackId,
        title: 'Outdoor Adventure',
        description: 'Learn outdoor skills',
        category: 'outdoor',
        max_participants: 20,
        current_participants: 5,
        start_time: '2024-06-01T10:00:00Z',
        end_time: '2024-06-01T12:00:00Z',
        location: 'Forest Camp',
        labels: ['label-2'],
        metadata: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      };

      apiUtils.apiRequest.mockResolvedValue({ data: mockUpdatedTrack });

      const result = await tracksService.removeLabels(trackId, labelIds);

      expect(apiUtils.apiRequest).toHaveBeenCalledWith('delete', `/tracks/labels/remove/${trackId}`, labelIds);
      expect(result.data).toEqual(mockUpdatedTrack);
    });

    it('should handle errors when removing labels from non-existent track', async () => {
      const trackId = 'nonexistent-track-id';
      const labelIds = ['label-1'];
      const errorMessage = 'Resource not found';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(tracksService.removeLabels(trackId, labelIds)).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('delete', `/tracks/labels/remove/${trackId}`, labelIds);
    });
  });

  describe('service initialization', () => {
    it('should initialize with correct base path', () => {
      expect(tracksService.basePath).toBe('/tracks');
    });
  });
});
