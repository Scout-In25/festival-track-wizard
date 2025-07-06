/**
 * Participants Service Unit Tests
 * Tests for all participant-related API operations with mocked calls
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { participantsService } from './participantsService.js';
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

describe('ParticipantsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all participants successfully', async () => {
      const mockParticipants = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          username: 'john_doe',
          email: 'john@example.com',
          first_name: 'John',
          last_name: 'Doe',
          roles: ['participant'],
          metadata: {},
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      apiUtils.apiRequest.mockResolvedValue({ data: mockParticipants });

      const result = await participantsService.getAll();

      expect(apiUtils.apiRequest).toHaveBeenCalledWith('get', '/participants/');
      expect(result.data).toEqual(mockParticipants);
    });

    it('should handle API errors when fetching participants', async () => {
      const errorMessage = 'Failed to fetch participants';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(participantsService.getAll()).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('get', '/participants/');
    });
  });

  describe('getByUsername', () => {
    it('should fetch participant by username successfully', async () => {
      const mockParticipant = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'john_doe',
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Doe',
        roles: ['participant'],
        metadata: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      apiUtils.apiRequest.mockResolvedValue({ data: mockParticipant });

      const result = await participantsService.getByUsername('john_doe');

      expect(apiUtils.apiRequest).toHaveBeenCalledWith('get', '/participants/john_doe');
      expect(result.data).toEqual(mockParticipant);
    });

    it('should handle 404 error for non-existent participant', async () => {
      const errorMessage = 'Resource not found';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(participantsService.getByUsername('nonexistent')).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('get', '/participants/nonexistent');
    });
  });

  describe('create', () => {
    it('should create a new participant successfully', async () => {
      const participantData = {
        username: 'jane_doe',
        email: 'jane@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        roles: ['participant'],
        metadata: {}
      };

      const mockCreatedParticipant = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        ...participantData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      apiUtils.apiRequest.mockResolvedValue({ data: mockCreatedParticipant });

      const result = await participantsService.create(participantData);

      expect(apiUtils.apiRequest).toHaveBeenCalledWith('post', '/participants/', participantData);
      expect(result.data).toEqual(mockCreatedParticipant);
    });

    it('should handle validation errors when creating participant', async () => {
      const participantData = {
        username: '',
        email: 'invalid-email',
        first_name: 'Jane',
        last_name: 'Doe',
        roles: [],
        metadata: {}
      };

      const errorMessage = 'Validation error: username is required';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(participantsService.create(participantData)).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('post', '/participants/', participantData);
    });
  });

  describe('updateByUsername', () => {
    it('should update participant successfully', async () => {
      const updateData = {
        first_name: 'John Updated',
        last_name: 'Doe Updated'
      };

      const mockUpdatedParticipant = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'john_doe',
        email: 'john@example.com',
        first_name: 'John Updated',
        last_name: 'Doe Updated',
        roles: ['participant'],
        metadata: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      };

      apiUtils.apiRequest.mockResolvedValue({ data: mockUpdatedParticipant });

      const result = await participantsService.updateByUsername('john_doe', updateData);

      expect(apiUtils.apiRequest).toHaveBeenCalledWith('put', '/participants/john_doe', updateData);
      expect(result.data).toEqual(mockUpdatedParticipant);
    });

    it('should handle errors when updating non-existent participant', async () => {
      const updateData = { first_name: 'Updated' };
      const errorMessage = 'Resource not found';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(participantsService.updateByUsername('nonexistent', updateData)).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('put', '/participants/nonexistent', updateData);
    });
  });

  describe('deleteByUsername', () => {
    it('should delete participant successfully', async () => {
      apiUtils.apiRequest.mockResolvedValue({ data: {} });

      const result = await participantsService.deleteByUsername('john_doe');

      expect(apiUtils.apiRequest).toHaveBeenCalledWith('delete', '/participants/john_doe');
      expect(result.data).toEqual({});
    });

    it('should handle errors when deleting non-existent participant', async () => {
      const errorMessage = 'Resource not found';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(participantsService.deleteByUsername('nonexistent')).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('delete', '/participants/nonexistent');
    });
  });

  describe('syncConnections', () => {
    it('should sync participant connections successfully', async () => {
      const participantId = '123e4567-e89b-12d3-a456-426614174000';
      const participantData = {
        username: 'john_doe',
        connections: ['connection1', 'connection2']
      };

      apiUtils.apiRequest.mockResolvedValue({ data: {} });

      const result = await participantsService.syncConnections(participantId, participantData);

      expect(apiUtils.apiRequest).toHaveBeenCalledWith(
        'post',
        `/participants/connection/sync?participant_id=${participantId}`,
        participantData
      );
      expect(result.data).toEqual({});
    });

    it('should handle errors when syncing connections', async () => {
      const participantId = '123e4567-e89b-12d3-a456-426614174000';
      const participantData = { username: 'john_doe' };
      const errorMessage = 'Sync failed';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(participantsService.syncConnections(participantId, participantData)).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith(
        'post',
        `/participants/connection/sync?participant_id=${participantId}`,
        participantData
      );
    });
  });

  describe('service initialization', () => {
    it('should initialize with correct base path', () => {
      expect(participantsService.basePath).toBe('/participants');
    });
  });
});
