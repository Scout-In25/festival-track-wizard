/**
 * Services Index
 * Central export point for all API services
 */

// Import all services
import participantsService from './api/participantsService.js';
import tracksService from './api/tracksService.js';
import activitiesService from './api/activitiesService.js';
import suggestionsService from './api/suggestionsService.js';
import wordpressService from './api/wordpressService.js';
import dataService from './dataService.js';

// Export all services
export {
  participantsService,
  tracksService,
  activitiesService,
  suggestionsService,
  wordpressService,
  dataService
};

// Default export with all services
export default {
  participants: participantsService,
  tracks: tracksService,
  activities: activitiesService,
  suggestions: suggestionsService,
  wordpress: wordpressService,
  data: dataService
};
