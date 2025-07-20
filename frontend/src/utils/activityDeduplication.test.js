/**
 * Tests for activity deduplication utilities
 */
import { describe, it, expect } from 'vitest';
import { 
  createTitleHash, 
  validateActivities,
  deduplicateActivities,
  deduplicateActivitiesByTitleAndTime,
  analyzeDuplicates 
} from './activityDeduplication.js';

describe('createTitleHash', () => {
  it('should create consistent hashes for identical titles', () => {
    const title1 = 'Workshop: Advanced Scouting Techniques';
    const title2 = 'Workshop: Advanced Scouting Techniques';
    
    expect(createTitleHash(title1)).toBe(createTitleHash(title2));
  });

  it('should normalize spaces and special characters', () => {
    const title1 = '  Workshop:   Advanced   Scouting!!!  ';
    const title2 = 'Workshop Advanced Scouting';
    
    const hash1 = createTitleHash(title1);
    const hash2 = createTitleHash(title2);
    
    expect(hash1).toBe('workshop-advanced-scouting');
    expect(hash2).toBe('workshop-advanced-scouting');
  });

  it('should handle case insensitivity', () => {
    const title1 = 'OUTDOOR ACTIVITIES';
    const title2 = 'outdoor activities';
    const title3 = 'Outdoor Activities';
    
    const hash = createTitleHash(title1);
    expect(createTitleHash(title2)).toBe(hash);
    expect(createTitleHash(title3)).toBe(hash);
  });

  it('should handle empty or invalid inputs', () => {
    expect(createTitleHash('')).toBe('');
    expect(createTitleHash(null)).toBe('');
    expect(createTitleHash(undefined)).toBe('');
    expect(createTitleHash(123)).toBe('');
  });
});

describe('validateActivities', () => {
  it('should keep valid activities with all required fields', () => {
    const activities = [
      {
        id: '1',
        name: 'Workshop A',
        start_time: '2025-09-19T10:00:00Z',
        end_time: '2025-09-19T11:00:00Z'
      },
      {
        id: '2',
        title: 'Workshop B',
        start_time: '2025-09-19T12:00:00Z',
        end_time: '2025-09-19T13:00:00Z'
      }
    ];

    const result = validateActivities(activities);
    
    expect(result).toHaveLength(2);
    expect(result.map(a => a.id)).toEqual(['1', '2']);
  });

  it('should remove activities without name or title', () => {
    const activities = [
      { id: '1', name: 'Valid Workshop', start_time: '2025-09-19T10:00:00Z', end_time: '2025-09-19T11:00:00Z' },
      { id: '2', start_time: '2025-09-19T12:00:00Z', end_time: '2025-09-19T13:00:00Z' }, // No name/title
      { id: '3', name: '', start_time: '2025-09-19T14:00:00Z', end_time: '2025-09-19T15:00:00Z' }, // Empty name
      { id: '4', name: '   ', start_time: '2025-09-19T16:00:00Z', end_time: '2025-09-19T17:00:00Z' }, // Whitespace only
      { id: '5', name: null, start_time: '2025-09-19T18:00:00Z', end_time: '2025-09-19T19:00:00Z' } // Null name
    ];

    const result = validateActivities(activities);
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should remove activities without start_time', () => {
    const activities = [
      { id: '1', name: 'Valid Workshop', start_time: '2025-09-19T10:00:00Z', end_time: '2025-09-19T11:00:00Z' },
      { id: '2', name: 'No Start Time', end_time: '2025-09-19T13:00:00Z' }, // No start_time
      { id: '3', name: 'Null Start Time', start_time: null, end_time: '2025-09-19T15:00:00Z' } // Null start_time
    ];

    const result = validateActivities(activities);
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should remove activities without end_time', () => {
    const activities = [
      { id: '1', name: 'Valid Workshop', start_time: '2025-09-19T10:00:00Z', end_time: '2025-09-19T11:00:00Z' },
      { id: '2', name: 'No End Time', start_time: '2025-09-19T12:00:00Z' }, // No end_time
      { id: '3', name: 'Null End Time', start_time: '2025-09-19T14:00:00Z', end_time: null } // Null end_time
    ];

    const result = validateActivities(activities);
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should remove invalid objects', () => {
    const activities = [
      { id: '1', name: 'Valid Workshop', start_time: '2025-09-19T10:00:00Z', end_time: '2025-09-19T11:00:00Z' },
      null, // Null object
      undefined, // Undefined object
      'invalid string', // String instead of object
      42 // Number instead of object
    ];

    const result = validateActivities(activities);
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should handle mixed valid and invalid activities', () => {
    const activities = [
      { id: '1', name: 'Valid Workshop A', start_time: '2025-09-19T10:00:00Z', end_time: '2025-09-19T11:00:00Z' },
      { id: '2', name: 'Missing End Time', start_time: '2025-09-19T12:00:00Z' },
      { id: '3', title: 'Valid Workshop B', start_time: '2025-09-19T14:00:00Z', end_time: '2025-09-19T15:00:00Z' },
      { id: '4', start_time: '2025-09-19T16:00:00Z', end_time: '2025-09-19T17:00:00Z' }, // No name
      { id: '5', name: 'Valid Workshop C', start_time: '2025-09-19T18:00:00Z', end_time: '2025-09-19T19:00:00Z' }
    ];

    const result = validateActivities(activities);
    
    expect(result).toHaveLength(3);
    expect(result.map(a => a.id)).toEqual(['1', '3', '5']);
  });

  it('should handle empty or invalid input', () => {
    expect(validateActivities([])).toEqual([]);
    expect(validateActivities(null)).toEqual([]);
    expect(validateActivities(undefined)).toEqual([]);
    expect(validateActivities('not-an-array')).toEqual([]);
  });

  it('should accept activities with either name or title field', () => {
    const activities = [
      { id: '1', name: 'Workshop A', start_time: '2025-09-19T10:00:00Z', end_time: '2025-09-19T11:00:00Z' },
      { id: '2', title: 'Workshop B', start_time: '2025-09-19T12:00:00Z', end_time: '2025-09-19T13:00:00Z' },
      { id: '3', name: 'Workshop C', title: 'Ignored Title', start_time: '2025-09-19T14:00:00Z', end_time: '2025-09-19T15:00:00Z' }
    ];

    const result = validateActivities(activities);
    
    expect(result).toHaveLength(3);
    expect(result.map(a => a.id)).toEqual(['1', '2', '3']);
  });
});

describe('deduplicateActivities', () => {
  it('should remove duplicate activities with same title', () => {
    const activities = [
      { id: '1', name: 'Workshop A', start_time: '2025-09-19T10:00:00Z' },
      { id: '2', name: 'Workshop B', start_time: '2025-09-19T11:00:00Z' },
      { id: '3', name: 'Workshop A', start_time: '2025-09-19T12:00:00Z' }, // Duplicate
      { id: '4', name: 'Workshop C', start_time: '2025-09-19T13:00:00Z' }
    ];

    const result = deduplicateActivities(activities);
    
    expect(result).toHaveLength(3);
    expect(result.map(a => a.id)).toEqual(['1', '2', '4']);
    expect(result.every(a => a._titleHash)).toBe(true);
  });

  it('should preserve first occurrence of duplicate', () => {
    const activities = [
      { id: '1', name: 'Workshop A', location: 'Room 1' },
      { id: '2', name: 'Workshop A', location: 'Room 2' }, // Duplicate
    ];

    const result = deduplicateActivities(activities);
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
    expect(result[0].location).toBe('Room 1');
  });

  it('should handle activities with normalized title variations', () => {
    const activities = [
      { id: '1', name: 'Workshop: Advanced Scouting!' },
      { id: '2', name: '  Workshop   Advanced Scouting  ' }, // Same after normalization
      { id: '3', name: 'Workshop - Advanced Scouting' }, // Same after normalization
    ];

    const result = deduplicateActivities(activities);
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should handle empty or invalid input', () => {
    expect(deduplicateActivities([])).toEqual([]);
    expect(deduplicateActivities(null)).toEqual([]);
    expect(deduplicateActivities(undefined)).toEqual([]);
    expect(deduplicateActivities('not-an-array')).toEqual([]);
  });

  it('should handle activities with missing titles', () => {
    const activities = [
      { id: '1', name: 'Valid Workshop' },
      { id: '2' }, // No name
      { id: '3', name: '' }, // Empty name
      { id: '4', name: null }, // Null name
    ];

    const result = deduplicateActivities(activities);
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });
});

describe('deduplicateActivitiesByTitleAndTime', () => {
  it('should preserve activities with same title but different times', () => {
    const activities = [
      { id: '1', name: 'Workshop A', start_time: '2025-09-19T10:00:00Z' },
      { id: '2', name: 'Workshop A', start_time: '2025-09-19T14:00:00Z' }, // Same title, different time
      { id: '3', name: 'Workshop B', start_time: '2025-09-19T11:00:00Z' }
    ];

    const result = deduplicateActivitiesByTitleAndTime(activities);
    
    expect(result).toHaveLength(3); // All should be preserved
    expect(result.map(a => a.id)).toEqual(['1', '2', '3']);
  });

  it('should remove activities with same title AND same time', () => {
    const activities = [
      { id: '1', name: 'Workshop A', start_time: '2025-09-19T10:00:00Z' },
      { id: '2', name: 'Workshop B', start_time: '2025-09-19T11:00:00Z' },
      { id: '3', name: 'Workshop A', start_time: '2025-09-19T10:00:00Z' }, // Duplicate: same title AND time
      { id: '4', name: 'Workshop C', start_time: '2025-09-19T13:00:00Z' }
    ];

    const result = deduplicateActivitiesByTitleAndTime(activities);
    
    expect(result).toHaveLength(3);
    expect(result.map(a => a.id)).toEqual(['1', '2', '4']);
  });

  it('should handle normalized title variations with same time', () => {
    const activities = [
      { id: '1', name: 'Workshop: Advanced Scouting!', start_time: '2025-09-19T10:00:00Z' },
      { id: '2', name: '  Workshop   Advanced Scouting  ', start_time: '2025-09-19T10:00:00Z' }, // Same title + time after normalization
      { id: '3', name: 'Workshop - Advanced Scouting', start_time: '2025-09-19T14:00:00Z' }, // Same title, different time
    ];

    const result = deduplicateActivitiesByTitleAndTime(activities);
    
    expect(result).toHaveLength(2); // Only id '2' should be removed
    expect(result.map(a => a.id)).toEqual(['1', '3']);
  });

  it('should handle activities without start_time', () => {
    const activities = [
      { id: '1', name: 'Workshop A' }, // No start_time
      { id: '2', name: 'Workshop A' }, // No start_time - should be duplicate
      { id: '3', name: 'Workshop A', start_time: '2025-09-19T10:00:00Z' }, // Has start_time - should be preserved
    ];

    const result = deduplicateActivitiesByTitleAndTime(activities);
    
    expect(result).toHaveLength(2);
    expect(result.map(a => a.id)).toEqual(['1', '3']);
  });

  it('should add debugging properties to activities', () => {
    const activities = [
      { id: '1', name: 'Workshop A', start_time: '2025-09-19T10:00:00Z' }
    ];

    const result = deduplicateActivitiesByTitleAndTime(activities);
    
    expect(result[0]._titleHash).toBe('workshop-a');
    expect(result[0]._timeKey).toBe('2025-09-19T10:00:00.000Z');
    expect(result[0]._combinedKey).toBe('workshop-a|2025-09-19T10:00:00.000Z');
    expect(result[0]._isDuplicate).toBe(false);
  });

  it('should handle empty or invalid input', () => {
    expect(deduplicateActivitiesByTitleAndTime([])).toEqual([]);
    expect(deduplicateActivitiesByTitleAndTime(null)).toEqual([]);
    expect(deduplicateActivitiesByTitleAndTime(undefined)).toEqual([]);
    expect(deduplicateActivitiesByTitleAndTime('not-an-array')).toEqual([]);
  });
});

describe('analyzeDuplicates', () => {
  it('should provide correct duplicate analysis', () => {
    const activities = [
      { name: 'Workshop A' },
      { name: 'Workshop A' }, // Duplicate
      { name: 'Workshop B' },
      { name: 'Workshop C' },
      { name: 'Workshop C' }, // Duplicate
      { name: 'Workshop C' }, // Another duplicate
    ];

    const analysis = analyzeDuplicates(activities);
    
    expect(analysis.totalActivities).toBe(6);
    expect(analysis.uniqueTitles).toBe(3);
    expect(analysis.duplicateTitles).toBe(2);
    expect(analysis.analysis.wouldRemove).toBe(3);
  });

  it('should handle no duplicates', () => {
    const activities = [
      { name: 'Workshop A' },
      { name: 'Workshop B' },
      { name: 'Workshop C' },
    ];

    const analysis = analyzeDuplicates(activities);
    
    expect(analysis.totalActivities).toBe(3);
    expect(analysis.uniqueTitles).toBe(3);
    expect(analysis.duplicateTitles).toBe(0);
    expect(analysis.analysis.wouldRemove).toBe(0);
  });
});