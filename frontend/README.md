# Festival Track Wizard - Frontend Development

A React-based frontend for the Festival Track Wizard WordPress plugin, providing an interactive interface for Scout-In25 attendees to create and manage personalized festival tracks.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Development Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and configure your settings
# See Environment Variables section for details
```

### 3. Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Views & Navigation

The application provides three main views accessible during development:

### 1. Main Wizard (Default)
Interactive wizard interface for creating personalized festival tracks.
- **Environment**: `VITE_DEV_AUTH_MODE=logged_in` (default)
- **Direct URL**: `http://localhost:5173#wizard`
- **WordPress**: `[festival_track_wizard]` shortcode

### 2. Activities List / Simple Mode
Browsable list of all festival activities - used for both the activities list and simple mode.
- **Environment**: `VITE_SHOW_TRACKS_ONLY=true`
- **Direct URL**: `http://localhost:5173#activities-list`
- **WordPress**: `[festival_track_simple]` shortcode

### 3. Track Results
Final track results and schedule display.
- **Environment**: `VITE_DEV_AUTH_MODE=not_logged_in`
- **Direct URL**: `http://localhost:5173#track`

> **Note**: The `[festival_track_simple]` shortcode renders the ActivitiesListPage component, same as `#activities-list`.

### Environment Variables

Create a `.env` file in the frontend directory with the following configuration:

```bash
# Required: API key for development (overrides WordPress setting)
VITE_API_KEY=your-actual-api-key-here

# Optional: API base URL (defaults to production)
VITE_API_BASE_URL=https://si25.timoklabbers.nl

# Optional: Enable debug logging
VITE_DEBUG=true

# Optional: Development authentication simulation
# Values: logged_in | not_logged_in
VITE_DEV_AUTH_MODE=logged_in

# Optional: Show activities list instead of wizard
VITE_SHOW_TRACKS_ONLY=false
```

### Development Modes

The application supports multiple development modes:

#### 1. Real API Mode (Recommended)
- Set `VITE_API_KEY` to your actual API key
- Uses live API endpoints with X-API-KEY authentication
- Perfect for testing real functionality

#### 2. Mock Data Mode
- Leave `VITE_API_KEY` empty or set to `your-api-key-here`
- Automatically falls back to mock data
- Useful when API is unavailable

#### 3. WordPress Integration Mode
- Run alongside a local WordPress installation
- Configure API key in WordPress admin
- Test full integration workflow

### Accessing Different Pages in Development

The application provides different entry points based on configuration:

#### Main Wizard Page
```bash
# Default when VITE_DEV_AUTH_MODE=logged_in
http://localhost:5173
```

#### Activities List Page
```bash
# Set VITE_SHOW_TRACKS_ONLY=true in .env
http://localhost:5173
```

#### Unauthenticated State
```bash
# Set VITE_DEV_AUTH_MODE=not_logged_in in .env
http://localhost:5173
```

## API Services & Utilities

### Overview

The application uses a comprehensive API service architecture with centralized utilities:

- **apiUtils.js** - Core API utilities and authentication
- **services/** - Domain-specific API service classes
- **types/api.js** - TypeScript-style type definitions

### Core API Utilities

```javascript
import { 
  getApiKey, 
  getApiBaseUrl, 
  createApiClient, 
  apiRequest 
} from './apiUtils.js';

// Get configured API key
const apiKey = getApiKey();

// Make authenticated API request
const response = await apiRequest('GET', '/participants/all');
```

### Available Services

#### Participants Service
```javascript
import { participantsService } from './services/index.js';

// Get all participants
const participants = await participantsService.getAll();

// Get participant by username
const participant = await participantsService.getByUsername('john_doe');

// Create new participant
const newParticipant = await participantsService.create({
  username: 'jane_doe',
  email: 'jane@example.com',
  first_name: 'Jane',
  last_name: 'Doe',
  roles: ['participant']
});

// Sync participant connections
await participantsService.syncConnections('participant-uuid', data);
```

#### Tracks Service
```javascript
import { tracksService } from './services/index.js';

// Get all tracks
const tracks = await tracksService.getAll();

// Subscribe scout to track
await tracksService.subscribeScout('username', 'track-uuid');

// Manage track labels
await tracksService.addLabels('track-uuid', ['label-uuid-1', 'label-uuid-2']);
```

#### Activities Service
```javascript
import { activitiesService } from './services/index.js';

// Get all activities
const activities = await activitiesService.getAll();

// Get specific activity
const activity = await activitiesService.getById('activity-uuid');
```

#### Suggestions Service
```javascript
import { suggestionsService } from './services/index.js';

// Get personalized suggestions
const suggestions = await suggestionsService.getSuggestions('username');
console.log(suggestions.data.suggested_tracks);
console.log(suggestions.data.suggested_activities);
```

### API Endpoints Reference

| Service | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Participants | `/participants/` | GET | Get all participants |
| Participants | `/participants/{username}` | GET | Get participant by username |
| Participants | `/participants/` | POST | Create participant |
| Participants | `/participants/connection/sync` | POST | Sync connections |
| Tracks | `/tracks/all` | GET | Get all tracks |
| Tracks | `/tracks/{track_id}` | GET | Get track by ID |
| Tracks | `/tracks/subscribe/{username}/{track_id}` | PUT | Subscribe to track |
| Tracks | `/tracks/unsubscribe/{username}` | PUT | Unsubscribe from track |
| Activities | `/activities/all` | GET | Get all activities |
| Activities | `/activities/{activity_id}` | GET | Get activity by ID |
| Suggestions | `/suggestions/suggestions/{username}` | GET | Get suggestions |

### Error Handling

All API services provide consistent error handling:

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

## WordPress Integration

### Plugin Overview

The Festival Track Wizard is a WordPress plugin that provides two shortcodes for embedding the React application:

```wordpress
[festival_track_wizard]      # Full wizard interface
[festival_track_simple]      # Simple mode interface
```

### WordPress Admin Configuration

#### 1. Access Settings
Navigate to `Settings > Festival Track Wizard` in WordPress admin

#### 2. Configure API Settings
- **X-API-KEY**: Required for API authentication
- **API Base URL**: Defaults to `https://si25.timoklabbers.nl`

#### 3. Security Features
- Only administrators can configure API settings
- Settings protected with WordPress nonces
- API keys are sanitized before storage

### Plugin Installation

#### Automated Build & Deploy
```bash
# Build and create plugin zip
npm run build

# This creates festival-track-wizard.zip in project root
```

#### WordPress Installation
1. Go to `Plugins > Add New` in WordPress admin
2. Click `Upload Plugin`
3. Upload the generated `festival-track-wizard.zip`
4. Activate the plugin

### WordPress Data Integration

The plugin provides the following data to the React application:

```javascript
// Available in window.FestivalWizardData
{
  ajaxUrl: '/wp-admin/admin-ajax.php',
  nonce: 'wordpress-nonce',
  currentUser: 'Display Name',
  apiKey: 'configured-api-key',
  apiBaseUrl: 'https://si25.timoklabbers.nl'
}
```

### User Authentication

- Plugin only displays for logged-in WordPress users
- Unauthenticated users see login prompt with Scout-In registration link
- Admin users see configuration warnings when API key is missing

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production and create WordPress plugin zip
- `npm test` - Run unit tests with Vitest
- `npm run test:e2e` - Run Playwright end-to-end tests
- `npm run preview` - Preview production build locally

## Project Architecture

```
frontend/
├── src/
│   ├── components/
│   │   └── TrackList.jsx           # Reusable components
│   ├── services/                   # API service layer
│   │   ├── api/
│   │   │   ├── participantsService.js
│   │   │   ├── tracksService.js
│   │   │   ├── activitiesService.js
│   │   │   └── suggestionsService.js
│   │   ├── index.js                # Service exports
│   │   └── README.md               # Service documentation
│   ├── types/
│   │   └── api.js                  # Type definitions
│   ├── __mocks__/                  # Test mocks
│   │   ├── apiUtils.js
│   │   └── services/
│   ├── apiUtils.js                 # Core API utilities
│   ├── Wizard.jsx                  # Main wizard component
│   ├── TrackPage.jsx               # Track results page
│   ├── ActivitiesListPage.jsx      # Activities list page
│   ├── main.jsx                    # App entry point
│   ├── versionUtils.js             # Version management
│   ├── index.css                   # Global styles
│   ├── styles.scss                 # SCSS styles
│   └── dev-only.css                # Development-only styles
├── tests/                          # E2E tests
│   ├── wizard.spec.js
│   └── activities-list.spec.js
├── .env.example                    # Environment template
├── package.json
├── vite.config.js                  # Vite configuration
├── tailwind.config.js              # Tailwind CSS config
└── playwright.config.js            # E2E test config
```

## Testing

### Unit Tests
```bash
npm test
```
- Uses Vitest and Testing Library
- Includes mocked API services
- Tests component behavior and interactions

### End-to-End Tests
```bash
npm run test:e2e
```
- Uses Playwright for cross-browser testing
- Tests complete user workflows
- Includes mobile responsive testing

### Test Configuration
- Test files: `*.test.js` for unit tests
- E2E files: `tests/*.spec.js`
- Mocks available in `__mocks__/` directory

## Development Best Practices

### Code Organization
- Use services for all API interactions
- Centralize error handling in apiUtils
- Follow React best practices for component structure
- Use TypeScript JSDoc for better IDE support

### Environment Management
- Never commit real API keys
- Use `.env.example` as template
- Set appropriate environment variables for different modes
- Test with both real API and mock data

### API Integration
- Always handle errors appropriately
- Use the provided service classes
- Include proper authentication headers
- Follow the established patterns for new endpoints

### WordPress Integration
- Test with actual WordPress installation
- Verify shortcode functionality
- Test user authentication scenarios
- Ensure admin configuration works

### Performance
- Use React.memo for expensive components
- Implement proper loading states
- Handle network errors gracefully
- Optimize bundle size with tree shaking

## Debugging & Troubleshooting

### Common Issues

#### API Authentication Errors
```bash
# Check environment variables
echo $VITE_API_KEY

# Enable debug logging
VITE_DEBUG=true npm run dev
```

#### WordPress Integration Issues
- Verify user is logged in
- Check API key configuration in WordPress admin
- Ensure shortcode is properly embedded

#### Development Server Issues
- Clear node_modules and reinstall
- Check for port conflicts
- Verify environment file configuration

### Debug Tools
- Set `VITE_DEBUG=true` for detailed API logging
- Use browser developer tools network tab
- Check console for error messages
- Use React Developer Tools for component inspection

## Contributing

### Adding New Features
1. Create service methods in appropriate service class
2. Add mock implementations for testing
3. Update type definitions
4. Add tests for new functionality
5. Update documentation

### API Integration
1. Follow existing patterns in service classes
2. Use BaseApiService for common CRUD operations
3. Implement proper error handling
4. Add JSDoc documentation

### WordPress Features
1. Test with actual WordPress installation
2. Follow WordPress coding standards
3. Ensure proper security measures
4. Test user permission scenarios

For detailed API service documentation, see `src/services/README.md`.