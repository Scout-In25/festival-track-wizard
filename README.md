# Festival Track Wizard

[![WordPress Plugin](https://img.shields.io/badge/WordPress-Plugin-blue.svg)](https://wordpress.org)
[![React](https://img.shields.io/badge/React-18.2.0-61dafb.svg)](https://reactjs.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#license)
[![Version](https://img.shields.io/badge/Version-1.14-orange.svg)](package.json)

A WordPress plugin that enables **Scout-In25** attendees to create personalized festival tracks through an interactive React interface. Built specifically for the Dutch scouting community's premier leadership festival.

## About Scout-In25

**Scout-In25** is a biennial festival for Dutch scouting volunteers and leaders, taking place September 19-21, 2025, at Scoutinglandgoed Zeewolde. The event focuses on professional development, networking, and community building within the scouting movement.

This plugin helps attendees navigate the festival's diverse offerings and create customized schedules based on their interests and scouting roles.

## Features

- 🎯 **Interactive Track Wizard** - Personalized activity recommendations
- 📋 **Activity Browser** - Explore all festival activities and workshops  
- 👥 **Participant Management** - Handle scout registrations and profiles
- 🔐 **WordPress Integration** - Seamless user authentication
- 📱 **Mobile Responsive** - Works on all devices
- 🛡️ **Secure API** - Protected data access with API key authentication
- 🎨 **Accessible Design** - Inclusive user experience

## Demo

Visit the [live demo](https://scout-in.scouting.nl/programma/) to see the Festival Track Wizard in action.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Development](#development)
- [API Documentation](#api-integration)
- [Testing](#testing)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

## Installation

### WordPress Plugin Installation

1. **Download** the latest `festival-track-wizard.zip` from [releases](https://github.com/your-org/festival-track-wizard/releases)
2. **Upload** to WordPress: Admin → Plugins → Add New → Upload Plugin
3. **Activate** the plugin
4. **Configure** API settings (see [Configuration](#configuration))

### Manual Installation

```bash
git clone https://github.com/your-org/festival-track-wizard.git
cd festival-track-wizard
cd frontend && npm install && npm run build
```

## Configuration

### Required Setup

1. Navigate to **Settings → Festival Track Wizard** in WordPress Admin
2. Enter your **API Key** (required for Scout-In25 API access)
3. Set **API Base URL** (defaults to `https://si25.timoklabbers.nl`)
4. Save configuration

### Environment Variables

For development, create `frontend/.env`:

```env
VITE_API_KEY=your-scout-in25-api-key
VITE_API_BASE_URL=https://si25.timoklabbers.nl
VITE_DEBUG=true
```

## Usage

### Shortcodes

Add these shortcodes to any WordPress page or post:

| Shortcode | Description | Access Level |
|-----------|-------------|--------------|
| `[festival_track_wizard]` | Full interactive wizard interface | Logged-in users |
| `[festival_track_simple]` | Public activity list view | Everyone |

### Example Usage

```html
<!-- Full wizard for registered users -->
[festival_track_wizard]

<!-- Public activity browser -->
[festival_track_simple]
```

### User Roles

The system supports different scouting roles:
- **Bevers** (Beavers) - Ages 5-7
- **Welpen** (Cubs) - Ages 7-11  
- **Scouts** - Ages 11-15
- **Explorers** - Ages 15-18
- **Leadership** - Adult volunteers and leaders

## Development

### Prerequisites

- **Node.js** 16+ and npm
- **PHP** 7.4+ (for WordPress)
- **WordPress** 5.0+ development environment (optional)

### Quick Start

```bash
# Clone and setup
git clone https://github.com/your-org/festival-track-wizard.git
cd festival-track-wizard/frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API credentials

# Start development server
npm run dev
# Open http://localhost:5173
```

### Project Structure

```
festival-track-wizard/
├── festival-track-wizard.php    # Main WordPress plugin file
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── services/           # API service layer
│   │   │   ├── api/           # Individual API services
│   │   │   └── index.js       # Service exports
│   │   ├── types/             # Type definitions
│   │   └── __mocks__/         # Test mocks
│   ├── tests/                 # E2E tests
│   └── build/                 # Compiled assets (generated)
├── scripts/                   # Build automation
│   ├── increment-version.sh   # Version management
│   └── bundle-plugin.sh       # Plugin packaging
└── build/                     # WordPress plugin assets (generated)
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build production bundle + create plugin zip
npm test            # Run unit tests
npm run test:e2e    # Run Playwright E2E tests
npm run preview     # Preview production build
```

### Development Modes

- **Real API Mode**: Set `VITE_API_KEY` to test with live Scout-In25 API
- **Mock Mode**: Leave `VITE_API_KEY` empty to use mock data
- **WordPress Mode**: Test full integration with local WordPress

## API Integration

### Scout-In25 API

The plugin integrates with the official Scout-In25 API:

- **Base URL**: `https://si25.timoklabbers.nl`
- **Authentication**: X-API-KEY header
- **Format**: JSON REST API

### Available Services

```javascript
import { 
  participantsService, 
  tracksService, 
  activitiesService, 
  suggestionsService 
} from './services';

// Get all festival activities
const activities = await activitiesService.getAll();

// Get personalized track suggestions
const suggestions = await suggestionsService.getSuggestions(username);

// Subscribe scout to a track
await tracksService.subscribeScout(username, trackId);
```

### API Endpoints

| Service | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Participants | `/participants/` | GET/POST | Manage scout profiles |
| Tracks | `/tracks/all` | GET | Festival track information |
| Activities | `/activities/all` | GET | All festival activities |
| Suggestions | `/suggestions/suggestions/{username}` | GET | Personalized recommendations |

## Testing

### Unit Tests

```bash
npm test
```

Tests use Vitest and React Testing Library with mocked API services.

### End-to-End Tests

```bash
npm run test:e2e
```

Cross-browser testing with Playwright, including mobile responsive tests.

### Test Coverage

- Component rendering and interactions
- API service functionality  
- WordPress integration scenarios
- Mobile responsive behavior

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Code Standards

- Follow React best practices
- Use TypeScript JSDoc for better IDE support
- Write tests for new features
- Follow WordPress coding standards for PHP
- Use conventional commit messages

## Troubleshooting

### Common Issues

**API Authentication Errors**
```bash
# Verify API key configuration
# Check WordPress Admin → Settings → Festival Track Wizard
# Enable debug logging: VITE_DEBUG=true
```

**Build Issues**
```bash
# Clear dependencies and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 16+
```

**WordPress Integration**
- Ensure user is logged in for full wizard access
- Verify plugin is activated
- Check shortcode syntax in page/post content

### Debug Tools

- Set `VITE_DEBUG=true` for detailed API logging
- Use browser developer tools Network tab
- Check WordPress debug.log for PHP errors
- Use React Developer Tools for component inspection

## Roadmap

- [ ] Multi-language support (Dutch/English)
- [ ] Offline mode capabilities
- [ ] Calendar integration
- [ ] Group management features
- [ ] Advanced filtering options

## Support

- **Documentation**: See this README and inline code documentation
- **Issues**: [GitHub Issues](https://github.com/your-org/festival-track-wizard/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/festival-track-wizard/discussions)
- **Scout-In25**: [Official Festival Website](https://scout-in.nl)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

### Authors

- **D de Zeeuw** - *Initial work* - [NEKO media](https://neko-media.nl)

### Acknowledgments

- **Scouting Nederland** - For Scout-In25 festival organization
- **Scout-In25 Team** - For API development and support
- **Scouting Community** - For feedback and testing

### Built With

- [React](https://reactjs.org) - Frontend framework
- [WordPress](https://wordpress.org) - CMS integration
- [Vite](https://vitejs.dev) - Build tool
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Axios](https://axios-http.com) - HTTP client

---

**Scout-In25**: *"... to the Future!"* | September 19-21, 2025 | Zeewolde, Netherlands
