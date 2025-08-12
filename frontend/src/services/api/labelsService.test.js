import { describe, it, expect, vi, beforeEach } from 'vitest';
import { labelsService } from './labelsService.js';
import * as apiUtils from '../../apiUtils.js';

// Mock the apiUtils module
vi.mock('../../apiUtils.js', () => ({
  apiRequest: vi.fn()
}));

describe('LabelsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('assignLabels', () => {
    it('should assign labels successfully', async () => {
      const assignmentData = {
        username: 'timo',
        labels: ['leiding', 'bevers', 'ervaren']
      };
      
      const mockResponse = {
        data: {
          success: true,
          message: 'Labels assigned successfully'
        }
      };

      apiUtils.apiRequest.mockResolvedValue(mockResponse);

      const result = await labelsService.assignLabels(assignmentData);

      expect(apiUtils.apiRequest).toHaveBeenCalledWith('post', '/labels/assign', assignmentData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty labels array', async () => {
      const assignmentData = {
        username: 'testuser',
        labels: []
      };
      
      const mockResponse = {
        data: {
          success: true,
          message: 'No labels to assign'
        }
      };

      apiUtils.apiRequest.mockResolvedValue(mockResponse);

      const result = await labelsService.assignLabels(assignmentData);

      expect(apiUtils.apiRequest).toHaveBeenCalledWith('post', '/labels/assign', assignmentData);
    });

    it('should handle API errors', async () => {
      const assignmentData = {
        username: 'nonexistent',
        labels: ['test']
      };
      
      const errorMessage = 'User not found';
      apiUtils.apiRequest.mockRejectedValue(new Error(errorMessage));

      await expect(labelsService.assignLabels(assignmentData)).rejects.toThrow(errorMessage);
      expect(apiUtils.apiRequest).toHaveBeenCalledWith('post', '/labels/assign', assignmentData);
    });

    it('should handle assignment with multiple labels', async () => {
      const assignmentData = {
        username: 'user1',
        labels: ['leiding', 'bevers', 'explorers', 'trainer']
      };
      
      const mockResponse = {
        data: {
          success: true,
          labelsAssigned: 4
        }
      };

      apiUtils.apiRequest.mockResolvedValue(mockResponse);

      const result = await labelsService.assignLabels(assignmentData);

      expect(apiUtils.apiRequest).toHaveBeenCalledWith('post', '/labels/assign', assignmentData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Service Availability', () => {
    it('should export labelsService instance', () => {
      expect(labelsService).toBeDefined();
      expect(typeof labelsService.assignLabels).toBe('function');
    });
  });
});