# Scout-In25 Admin Interface Usage

## Overview
The admin interface provides administrators and editors with tools to manage user activities and preferences.

## Access Requirements
1. Must be logged in to WordPress
2. Must have either **Administrator** or **Editor** role
3. Must include `&kompas` query parameter in the URL

## How to Access
1. Create a new WordPress page
2. Add the shortcode: `[festival_track_admin]`
3. Access the page with the kompas parameter: `https://yoursite.com/admin-page/?kompas`

## Features

### 1. Subscribe User to Activity
- Select a user from the dropdown
- Choose an activity to subscribe them to
- View their current activities
- Click "Inschrijven" to subscribe

### 2. Unsubscribe User from Activity
- Select a user from the dropdown
- Choose from their current activities
- Click "Uitschrijven" to remove them

### 3. Reset User Preferences (Clear Labels)
- Select a user from the dropdown
- View their current labels
- Click "Voorkeuren Resetten" to clear all labels
- User will need to complete the wizard again

### 4. Statistics Dashboard
- View total participants
- View total activities
- See how many users have/haven't completed the wizard

### 5. Participants Overview Table
- View all participants in a table format
- See their username, name, email, activities count, and label status

## Development Testing
To test the admin interface in development mode:

1. Set environment variable: `VITE_ADMIN_MODE=true`
2. Ensure you have a valid `VITE_USERNAME` set
3. Ensure you have a valid `VITE_API_KEY` set
4. Run `npm run dev`

The admin interface will work directly with the API in development mode, bypassing WordPress AJAX.

## Security
- All operations require valid WordPress authentication
- Admin/Editor role is verified server-side
- The `&kompas` parameter acts as an additional security layer
- All AJAX requests include WordPress nonce verification