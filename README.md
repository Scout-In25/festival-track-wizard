# Festival Track Wizard

A personalized festival tracking wizard for Scout-In25. This WordPress plugin provides a dynamic frontend application built with React, allowing logged-in users to create and manage their own festival tracks.

## Usage

To use the Festival Track Wizard, simply add the following shortcode to any WordPress post or page:

```
[festival_track_wizard]
```

This shortcode will render the interactive wizard for logged-in users. If a user is not logged in, a message will be displayed prompting them to log in or create an account to access the wizard.

## What it Does

The Festival Track Wizard is designed to help attendees of Scout-In25 create and manage their personalized festival schedules. It provides an intuitive interface for users to select and organize their preferred events, workshops, and activities, ensuring they can make the most of their festival experience. The wizard interacts with the WordPress backend to handle user data and preferences.

## Local Development

To run the frontend application locally for development purposes:

1.  Navigate to the `frontend/` directory:
    ```bash
    cd frontend/
    ```
2.  Install the necessary Node.js dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    This will typically start a development server at `http://localhost:5173` (or another available port), allowing you to work on the React application with hot-reloading.

## Build and Upload as a WordPress Plugin

To build the plugin and prepare it for upload to a WordPress site:

1.  Navigate to the `frontend/` directory:
    ```bash
    cd frontend/
    ```
2.  Run the build script:
    ```bash
    npm run build
    ```
    This command performs several actions:
    *   It executes `../scripts/increment-version.sh` to update the plugin version.
    *   It compiles the React application using Vite, outputting `index.js` and `style.css` into the `build/` directory in the project root.
    *   It then executes `../scripts/bundle-plugin.sh`, which creates a `festival-track-wizard.zip` file in the project root. This zip file contains `festival-track-wizard.php` and the `build/` directory, making it ready for WordPress.

3.  **Upload to WordPress**:
    *   Log in to your WordPress admin dashboard.
    *   Go to `Plugins` > `Add New`.
    *   Click on the `Upload Plugin` button.
    *   Choose the `festival-track-wizard.zip` file from your project root and click `Install Now`.
    *   After installation, click `Activate Plugin`.

Your Festival Track Wizard plugin should now be active and ready for use on your WordPress site.
