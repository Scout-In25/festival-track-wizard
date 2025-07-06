# Festival Track Wizard - Frontend Development

This is the React frontend for the Festival Track Wizard WordPress plugin.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Key (for development)
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and set your API key
# VITE_API_KEY=your-actual-api-key-here
```

### 3. Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm test` - Run unit tests
- `npm run test:e2e` - Run Playwright end-to-end tests
- `npm run preview` - Preview production build locally

## Environment Variables

Create a `.env` file in the frontend directory with:

```bash
# Required: API key for development
VITE_API_KEY=your-api-key-here

# Optional: Enable debug logging
VITE_DEBUG=true

# Optional: Custom API base URL
VITE_API_BASE_URL=https://si25.nl/REST
```

## API Key Priority

1. **Development**: Uses `VITE_API_KEY` from `.env` file
2. **Production**: Uses API key configured in WordPress admin

## Testing

### Unit Tests
```bash
npm test
```

### End-to-End Tests
```bash
npm run test:e2e
```

## Building for Production

The build process automatically:
1. Increments the version number
2. Builds the React app
3. Creates a WordPress plugin zip file

```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── apiUtils.js      # API utility functions
│   ├── Wizard.jsx       # Main wizard component
│   ├── TrackPage.jsx    # Track results page
│   └── main.jsx         # App entry point
├── tests/               # Playwright E2E tests
├── .env.example         # Environment variables template
└── package.json
```

## Development Notes

- The app uses Vite for fast development and building
- API calls automatically include the X-API-KEY header
- All API utilities are centralized in `apiUtils.js`
- Tests use Vitest for unit tests and Playwright for E2E tests

For more detailed API configuration information, see `../API_CONFIGURATION.md`.
