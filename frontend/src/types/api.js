/**
 * API Type Definitions
 * JSDoc type definitions for API requests and responses
 */

/**
 * @typedef {Object} ParticipantCreate
 * @property {string} username - Participant username
 * @property {string} email - Participant email
 * @property {string} first_name - Participant first name
 * @property {string} last_name - Participant last name
 * @property {string[]} roles - Array of participant roles
 * @property {Object} metadata - Additional participant metadata
 */

/**
 * @typedef {Object} ParticipantResponse
 * @property {string} id - Participant UUID
 * @property {string} username - Participant username
 * @property {string} email - Participant email
 * @property {string} first_name - Participant first name
 * @property {string} last_name - Participant last name
 * @property {string[]} roles - Array of participant roles
 * @property {Object} metadata - Additional participant metadata
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 */

/**
 * @typedef {Object} TrackCreate
 * @property {string} title - Track title
 * @property {string} description - Track description
 * @property {string} category - Track category
 * @property {number} max_participants - Maximum number of participants
 * @property {string} start_time - Track start time (ISO 8601)
 * @property {string} end_time - Track end time (ISO 8601)
 * @property {string} location - Track location
 * @property {Object} metadata - Additional track metadata
 */

/**
 * @typedef {Object} TrackUpdate
 * @property {string} [title] - Track title
 * @property {string} [description] - Track description
 * @property {string} [category] - Track category
 * @property {number} [max_participants] - Maximum number of participants
 * @property {string} [start_time] - Track start time (ISO 8601)
 * @property {string} [end_time] - Track end time (ISO 8601)
 * @property {string} [location] - Track location
 * @property {Object} [metadata] - Additional track metadata
 */

/**
 * @typedef {Object} TrackResponse
 * @property {string} id - Track UUID
 * @property {string} title - Track title
 * @property {string} description - Track description
 * @property {string} category - Track category
 * @property {number} max_participants - Maximum number of participants
 * @property {number} current_participants - Current number of participants
 * @property {string} start_time - Track start time (ISO 8601)
 * @property {string} end_time - Track end time (ISO 8601)
 * @property {string} location - Track location
 * @property {string[]} labels - Array of label IDs
 * @property {Object} metadata - Additional track metadata
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 */

/**
 * @typedef {Object} ActivityCreate
 * @property {string} title - Activity title
 * @property {string} description - Activity description
 * @property {string} type - Activity type
 * @property {string} start_time - Activity start time (ISO 8601)
 * @property {string} end_time - Activity end time (ISO 8601)
 * @property {string} location - Activity location
 * @property {Object} metadata - Additional activity metadata
 */

/**
 * @typedef {Object} ActivityUpdate
 * @property {string} [title] - Activity title
 * @property {string} [description] - Activity description
 * @property {string} [type] - Activity type
 * @property {string} [start_time] - Activity start time (ISO 8601)
 * @property {string} [end_time] - Activity end time (ISO 8601)
 * @property {string} [location] - Activity location
 * @property {Object} [metadata] - Additional activity metadata
 */

/**
 * @typedef {Object} ActivityResponse
 * @property {string} id - Activity UUID
 * @property {string} title - Activity title
 * @property {string} description - Activity description
 * @property {string} type - Activity type
 * @property {string} start_time - Activity start time (ISO 8601)
 * @property {string} end_time - Activity end time (ISO 8601)
 * @property {string} location - Activity location
 * @property {Object} metadata - Additional activity metadata
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 */

/**
 * @typedef {Object} SuggestionsResponse
 * @property {string} username - Scout username
 * @property {TrackResponse[]} suggested_tracks - Array of suggested tracks
 * @property {ActivityResponse[]} suggested_activities - Array of suggested activities
 * @property {Object} metadata - Additional suggestion metadata
 */

/**
 * @typedef {Object} HTTPValidationError
 * @property {Object[]} detail - Array of validation error details
 */

/**
 * @typedef {Object} ApiResponse
 * @property {*} data - Response data
 * @property {number} status - HTTP status code
 * @property {string} statusText - HTTP status text
 * @property {Object} headers - Response headers
 */

// Export types for JSDoc usage
export {};
