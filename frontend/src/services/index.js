/**
 * Services Index
 * Central export point for all API services
 */

// Import all services
import participantsService from './api/participantsService.js';
import tracksService from './api/tracksService.js';
import activitiesService from './api/activitiesService.js';
import suggestionsService from './api/suggestionsService.js';

// Export all services
export {
  participantsService,
  tracksService,
  activitiesService,
  suggestionsService
};

// Default export with all services
export default {
  participants: participantsService,
  tracks: tracksService,
  activities: activitiesService,
  suggestions: suggestionsService
};
