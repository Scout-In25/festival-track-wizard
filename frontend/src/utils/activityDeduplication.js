/**
 * Activity Deduplication Utilities
 * Handles duplicate activity removal based on title hashing
 */

/**
 * Creates a simple hash from an activity title for deduplication
 * @param {string} title - The activity title/name
 * @returns {string} Normalized hash string
 */
export function createTitleHash(title) {
  if (!title || typeof title !== 'string') {
    return '';
  }
  
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace multiple spaces with single dash
    .replace(/[^\w-]/g, '')         // Remove all non-word characters except dashes
    .replace(/-+/g, '-')            // Replace multiple dashes with single dash
    .replace(/^-|-$/g, '');         // Remove leading/trailing dashes
}

/**
 * Deduplicates activities array based on title hashing
 * Preserves the first occurrence of each unique title
 * @param {Array} activities - Array of activity objects
 * @returns {Array} Deduplicated activities array
 */
export function deduplicateActivities(activities) {
  if (!Array.isArray(activities)) {
    console.warn('deduplicateActivities: Expected array, got', typeof activities);
    return [];
  }

  const seenHashes = new Set();
  const duplicateCount = { total: 0, removed: 0 };
  
  const uniqueActivities = activities.reduce((acc, activity) => {
    duplicateCount.total++;
    
    if (!activity || typeof activity !== 'object') {
      console.warn('deduplicateActivities: Invalid activity object', activity);
      return acc;
    }
    
    const titleHash = createTitleHash(activity.name || activity.title || '');
    
    // Skip activities with empty/invalid titles
    if (!titleHash) {
      console.warn('deduplicateActivities: Activity with empty title', activity);
      return acc;
    }
    
    // Add hash to activity object for debugging/tracking
    const activityWithHash = {
      ...activity,
      _titleHash: titleHash,
      _isDuplicate: false
    };
    
    if (!seenHashes.has(titleHash)) {
      seenHashes.add(titleHash);
      acc.push(activityWithHash);
    } else {
      duplicateCount.removed++;
      // // Optionally log duplicate for debugging
      // console.debug('Duplicate activity removed:', {
      //   title: activity.name || activity.title,
      //   hash: titleHash,
      //   id: activity.id
      // });
    }
    
    return acc;
  }, []);

  // Log deduplication results
  // console.info('Activity deduplication completed:', {
  //   originalCount: duplicateCount.total,
  //   duplicatesRemoved: duplicateCount.removed,
  //   finalCount: uniqueActivities.length,
  //   uniqueTitles: seenHashes.size
  // });

  return uniqueActivities;
}

/**
 * Advanced deduplication with fuzzy matching for similar titles
 * @param {Array} activities - Array of activity objects
 * @param {number} threshold - Similarity threshold (0-1), default 0.9
 * @returns {Array} Deduplicated activities array
 */
export function deduplicateActivitiesAdvanced(activities, threshold = 0.9) {
  if (!Array.isArray(activities)) {
    return [];
  }

  // Simple Levenshtein distance calculation
  function levenshteinDistance(str1, str2) {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[len2][len1];
  }

  function similarity(str1, str2) {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;
    
    const distance = levenshteinDistance(str1, str2);
    return (maxLength - distance) / maxLength;
  }

  const uniqueActivities = [];
  const processedTitles = [];

  for (const activity of activities) {
    const title = (activity.name || activity.title || '').toLowerCase().trim();
    
    if (!title) continue;

    let isDuplicate = false;
    
    // Check similarity with existing titles
    for (const existingTitle of processedTitles) {
      if (similarity(title, existingTitle) >= threshold) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      processedTitles.push(title);
      uniqueActivities.push({
        ...activity,
        _titleHash: createTitleHash(title),
        _isDuplicate: false
      });
    }
  }

  return uniqueActivities;
}

/**
 * Deduplicates activities based on both title and start time/date
 * Only removes activities that have the same normalized title AND the same start time
 * @param {Array} activities - Array of activity objects
 * @returns {Array} Deduplicated activities array
 */
export function deduplicateActivitiesByTitleAndTime(activities) {
  if (!Array.isArray(activities)) {
    console.warn('deduplicateActivitiesByTitleAndTime: Expected array, got', typeof activities);
    return [];
  }

  const seenCombinations = new Set();
  const duplicateCount = { total: 0, removed: 0 };
  
  const uniqueActivities = activities.reduce((acc, activity) => {
    duplicateCount.total++;
    
    if (!activity || typeof activity !== 'object') {
      console.warn('deduplicateActivitiesByTitleAndTime: Invalid activity object', activity);
      return acc;
    }
    
    const titleHash = createTitleHash(activity.name || activity.title || '');
    const startTime = activity.start_time || '';
    
    // Skip activities with empty/invalid titles
    if (!titleHash) {
      console.warn('deduplicateActivitiesByTitleAndTime: Activity with empty title', activity);
      return acc;
    }
    
    // Create combined key: titleHash + normalized start time
    const timeKey = startTime ? new Date(startTime).toISOString() : 'no-time';
    const combinedKey = `${titleHash}|${timeKey}`;
    
    // Add combined key to activity object for debugging/tracking
    const activityWithKeys = {
      ...activity,
      _titleHash: titleHash,
      _timeKey: timeKey,
      _combinedKey: combinedKey,
      _isDuplicate: false
    };
    
    if (!seenCombinations.has(combinedKey)) {
      seenCombinations.add(combinedKey);
      acc.push(activityWithKeys);
    } else {
      duplicateCount.removed++;
      // Log duplicate for debugging
      console.debug('Duplicate activity removed (title + time):', {
        title: activity.name || activity.title,
        startTime: startTime,
        hash: titleHash,
        timeKey: timeKey,
        combinedKey: combinedKey,
        id: activity.id
      });
    }
    
    return acc;
  }, []);

  // Log deduplication results
  console.info('Activity deduplication by title and time completed:', {
    originalCount: duplicateCount.total,
    duplicatesRemoved: duplicateCount.removed,
    finalCount: uniqueActivities.length,
    uniqueCombinations: seenCombinations.size
  });

  return uniqueActivities;
}

/**
 * Validates activities and removes bad entries
 * Removes activities that don't have required fields (name/title, start_time, end_time)
 * @param {Array} activities - Array of activity objects
 * @returns {Array} Validated activities array
 */
export function validateActivities(activities) {
  if (!Array.isArray(activities)) {
    console.warn('validateActivities: Expected array, got', typeof activities);
    return [];
  }

  const validationStats = {
    total: activities.length,
    removed: 0,
    reasons: {
      missingName: 0,
      missingStartTime: 0,
      missingEndTime: 0,
      invalidObject: 0
    }
  };

  const validActivities = activities.filter(activity => {
    // Check if activity is a valid object
    if (!activity || typeof activity !== 'object') {
      validationStats.removed++;
      validationStats.reasons.invalidObject++;
      console.debug('Invalid activity object removed:', activity);
      return false;
    }

    // Check for name/title
    const name = activity.name || activity.title;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      validationStats.removed++;
      validationStats.reasons.missingName++;
      console.debug('Activity removed - missing name/title:', {
        id: activity.id,
        name: activity.name,
        title: activity.title
      });
      return false;
    }

    // Check for start_time
    if (!activity.start_time || activity.start_time === null) {
      validationStats.removed++;
      validationStats.reasons.missingStartTime++;
      console.debug('Activity removed - missing start_time:', {
        id: activity.id,
        name: name,
        start_time: activity.start_time
      });
      return false;
    }

    // Check for end_time
    if (!activity.end_time || activity.end_time === null) {
      validationStats.removed++;
      validationStats.reasons.missingEndTime++;
      console.debug('Activity removed - missing end_time:', {
        id: activity.id,
        name: name,
        end_time: activity.end_time
      });
      return false;
    }

    // Activity passed all validation checks
    return true;
  });

  // Log validation results
  console.info('Activity validation completed:', {
    originalCount: validationStats.total,
    removedCount: validationStats.removed,
    validCount: validActivities.length,
    removalReasons: validationStats.reasons,
    removalRate: ((validationStats.removed / validationStats.total) * 100).toFixed(1) + '%'
  });

  return validActivities;
}

/**
 * Debug utility to analyze duplicate patterns
 * @param {Array} activities - Array of activity objects
 * @returns {Object} Analysis results
 */
export function analyzeDuplicates(activities) {
  if (!Array.isArray(activities)) {
    return { error: 'Invalid input' };
  }

  const titleCounts = new Map();
  const hashCounts = new Map();
  
  activities.forEach(activity => {
    const title = activity.name || activity.title || 'NO_TITLE';
    const hash = createTitleHash(title);
    
    titleCounts.set(title, (titleCounts.get(title) || 0) + 1);
    hashCounts.set(hash, (hashCounts.get(hash) || 0) + 1);
  });

  const duplicateTitles = Array.from(titleCounts.entries())
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);

  const duplicateHashes = Array.from(hashCounts.entries())
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);

  return {
    totalActivities: activities.length,
    uniqueTitles: titleCounts.size,
    uniqueHashes: hashCounts.size,
    duplicateTitles: duplicateTitles.length,
    duplicateHashes: duplicateHashes.length,
    topDuplicates: duplicateTitles.slice(0, 10),
    analysis: {
      wouldRemove: activities.length - hashCounts.size,
      compressionRatio: ((activities.length - hashCounts.size) / activities.length * 100).toFixed(1) + '%'
    }
  };
}