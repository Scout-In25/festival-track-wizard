# API Services Documentation

This directory contains all API service modules for the Festival Track Wizard application. The services provide a clean, organized way to interact with the Scout Track Management API.

## Architecture

The API services are organized into domain-specific modules:

- **participantsService** - Participant management operations
- **tracksService** - Track management and subscription operations  
- **activitiesService** - Activity management operations
- **suggestionsService** - Personalized suggestion operations

## Usage

### Basic Import

```javascript
// Import individual services
import { participantsService, tracksService } from './services/index.js';

// Or import all services as an object
import apiServices from './services/index.js';
```

### Example Usage

#### Participants

```javascript
import { participantsService } from './services/index.js';

// Get all participants
const participants = await participantsService.getAll();

// Get specific participant
const participant = await participantsService.getByUsername('john_doe');

// Create new participant
const newParticipant = await participantsService.create({
  username: 'jane_doe',
  email: 'jane@example.com',
  first_name: 'Jane',
  last_name: 'Doe',
  roles: ['participant'],
  metadata: {}
});

// Update participant
const updated = await participantsService.updateByUsername('jane_doe', {
  first_name: 'Jane Updated'
});

// Sync participant connections
await participantsService.syncConnections('participant-uuid', participantData);
```

#### Tracks

```javascript
import { tracksService } from './services/index.js';

// Get all tracks
const tracks = await tracksService.getAll();

// Get specific track
const track = await tracksService.getById('track-uuid');

// Create new track
const newTrack = await tracksService.create({
  title: 'Outdoor Adventure',
  description: 'Learn outdoor skills',
  category: 'outdoor',
  max_participants: 20,
  start_time: '2024-06-01T10:00:00Z',
  end_time: '2024-06-01T12:00:00Z',
  location: 'Forest Camp',
  metadata: {}
});

// Subscribe scout to track
await tracksService.subscribeScout('username', 'track-uuid');

// Unsubscribe scout from track
await tracksService.unsubscribeScout('username');

// Manage track labels
await tracksService.addLabels('track-uuid', ['label-uuid-1', 'label-uuid-2']);
await tracksService.removeLabels('track-uuid', ['label-uuid-1']);
```

#### Activities

```javascript
import { activitiesService } from './services/index.js';

// Get all activities
const activities = await activitiesService.getAll();

// Get specific activity
const activity = await activitiesService.getById('activity-uuid');

// Create new activity (Admin only)
const newActivity = await activitiesService.create({
  title: 'Campfire Stories',
  description: 'Evening storytelling session',
  type: 'social',
  start_time: '2024-06-01T20:00:00Z',
  end_time: '2024-06-01T21:00:00Z',
  location: 'Main Campfire',
  metadata: {}
});
```

#### Suggestions

```javascript
import { suggestionsService } from './services/index.js';

// Get personalized suggestions for a scout
const suggestions = await suggestionsService.getSuggestions('username');
console.log(suggestions.data.suggested_tracks);
console.log(suggestions.data.suggested_activities);
```

## Error Handling

All services use the centralized error handling from `apiUtils.js`. Common error scenarios:

```javascript
try {
  const participant = await participantsService.getByUsername('nonexistent');
} catch (error) {
  if (error.message.includes('Resource not found')) {
    // Handle 404 error
  } else if (error.message.includes('API key authentication failed')) {
    // Handle authentication error
  } else if (error.message.includes('Validation error')) {
    // Handle validation error
  } else {
    // Handle general error
  }
}
```

## Configuration

Services automatically use the API configuration from:

1. **Development**: Environment variables (`VITE_API_KEY`, `VITE_API_BASE_URL`)
2. **Production**: WordPress localized data (`window.FestivalWizardData`)

## Testing

Mock implementations are available in `__mocks__/services/index.js`:

```javascript
// In your test files
import { participantsService } from '../__mocks__/services/index.js';

// All methods are mocked with vi.fn()
expect(participantsService.getAll).toHaveBeenCalled();
```

## API Endpoints Reference

### Participants
- `GET /participants/` - Get all participants
- `GET /participants/{username}` - Get participant by username
- `POST /participants/` - Create participant
- `PUT /participants/{username}` - Update participant
- `DELETE /participants/{username}` - Delete participant
- `POST /participants/connection/sync` - Sync participant connections

### Tracks
- `GET /tracks/all` - Get all tracks
- `GET /tracks/{track_id}` - Get track by ID
- `POST /tracks/` - Create track
- `PUT /tracks/{track_id}` - Update track
- `DELETE /tracks/{track_id}` - Delete track
- `PUT /tracks/subscribe/{username}/{track_id}` - Subscribe scout to track
- `PUT /tracks/unsubscribe/{username}` - Unsubscribe scout from track
- `PUT /tracks/labels/{track_id}` - Add labels to track
- `DELETE /tracks/labels/remove/{track_id}` - Remove labels from track

### Activities
- `GET /activities/all` - Get all activities
- `GET /activities/{activity_id}` - Get activity by ID
- `POST /activities/` - Create activity (Admin only)
- `PUT /activities/{activity_id}` - Update activity (Admin only)

### Suggestions
- `GET /suggestions/suggestions/{username}` - Get suggestions for scout

## Type Definitions

TypeScript-style JSDoc definitions are available in `../types/api.js` for better IDE support and documentation.

## Best Practices

1. **Always handle errors** - Use try/catch blocks around service calls
2. **Use TypeScript JSDoc** - Import type definitions for better IDE support
3. **Mock in tests** - Use the provided mock implementations for testing
4. **Centralized imports** - Import services from the main index file
5. **Consistent patterns** - All services follow the same patterns for similar operations

## Contributing

When adding new endpoints:

1. Add the method to the appropriate service class
2. Update the mock implementation
3. Add JSDoc type definitions
4. Update this documentation
5. Add tests for the new functionality
