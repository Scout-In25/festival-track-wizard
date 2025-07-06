# Festival Track Wizard - API Key Configuration

This document explains how to configure and use the X-API-KEY for the Festival Track Wizard WordPress plugin.

## Overview

The Festival Track Wizard plugin now supports secure API key configuration to authenticate requests to external APIs. The API key is stored securely in WordPress and passed to the React frontend for use in API calls.

## Configuration

### WordPress Admin Configuration

1. **Access Settings**: Navigate to `Settings > Festival Track Wizard` in your WordPress admin panel
2. **Enter API Key**: Input your X-API-KEY in the provided field
3. **Save Settings**: Click "Save Changes" to store the configuration

### Alternative Access

You can also access the settings page directly via the "Settings" link on the Plugins page next to the Festival Track Wizard plugin.

## Security Features

- **Admin Only**: Only users with `manage_options` capability (typically administrators) can configure the API key
- **Sanitization**: API keys are sanitized before storage
- **Nonce Protection**: Settings form is protected with WordPress nonces
- **Graceful Degradation**: Plugin shows appropriate messages when API key is not configured

## Frontend Integration

### API Key Availability

The API key is made available to the React frontend through WordPress's `wp_localize_script` function:

```javascript
// Access the API key in React components
const apiKey = window.FestivalWizardData?.apiKey;
```

### API Utility Functions

The plugin includes a comprehensive API utility module (`frontend/src/apiUtils.js`) that provides:

- **getApiKey()**: Retrieves the API key from WordPress data
- **createApiClient()**: Creates an axios instance with proper headers
- **apiRequest()**: Makes API requests with error handling

### Usage Example

```javascript
import { apiRequest } from './apiUtils';

// Make an API call with automatic X-API-KEY header
try {
  const response = await apiRequest('post', 'https://api.example.com/endpoint', data);
  console.log('Success:', response.data);
} catch (error) {
  console.error('API Error:', error.message);
}
```

## Error Handling

The system provides comprehensive error handling:

- **Missing API Key**: Users see appropriate messages based on their permissions
- **Authentication Errors**: 401/403 responses show specific API key error messages
- **Network Errors**: Generic error messages for other failures

## Current API Endpoints

- **Form Submission**: `{API_BASE_URL}/REST/formsubmit/` (POST)
- **Future Endpoints**: The system is ready for additional API endpoints as needed

The default API base URL is `https://si25.timoklabbers.nl` but can be configured in WordPress admin.

## Development Setup

### Environment Variables (Development)

For local development, you can use environment variables instead of configuring the API key in WordPress:

1. **Copy the example file**: `cp frontend/.env.example frontend/.env`
2. **Edit the .env file**: Set your API key in the `VITE_API_KEY` variable
3. **Run development server**: `npm run dev` in the frontend directory

Example `.env` file:
```bash
# API Key for development (overrides WordPress setting)
VITE_API_KEY=your-actual-api-key-here

# Optional: Enable debug logging
VITE_DEBUG=true
```

### Priority Order

The API key is resolved in this order:
1. **Development mode**: `VITE_API_KEY` environment variable (if running `npm run dev`)
2. **Production mode**: WordPress admin configured API key

### WordPress Setup (Alternative)

For local development with WordPress:

1. Set up a local WordPress environment with the plugin installed
2. Configure the API key through the WordPress admin interface
3. Run the development server with `npm run dev` in the frontend directory

## Development Notes

### Adding New API Calls

To add new API calls:

1. Import the API utility: `import { apiRequest } from './apiUtils';`
2. Use the `apiRequest` function with appropriate HTTP method and endpoint
3. Handle errors appropriately in your component

### Testing

- Ensure the API key is configured in WordPress admin
- Check browser console for any API-related errors
- Verify that the X-API-KEY header is included in network requests

## Troubleshooting

### Common Issues

1. **"API key not configured"**: Administrator needs to set the API key in WordPress admin
2. **"API key authentication failed"**: The configured API key may be invalid or expired
3. **Plugin not loading**: Check that user is logged in and API key is configured

### Debug Steps

1. Check WordPress admin settings page for API key configuration
2. Verify user permissions (must be logged in)
3. Check browser console for JavaScript errors
4. Inspect network requests to ensure X-API-KEY header is present

## Security Considerations

- The API key is visible to authenticated frontend users (this is necessary for client-side API calls)
- Only WordPress administrators can configure the API key
- The API key is stored in WordPress options table
- Consider implementing additional server-side validation if needed

## Future Enhancements

Potential improvements for enhanced security:

- Server-side proxy for API calls to hide API key from frontend
- API key encryption in database
- Role-based API key access
- API key rotation functionality
