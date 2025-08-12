<?php
/**
 * Plugin Name: Festival Track Wizard
 * Description: A personalized festival tracking wizard.
 * Version: 1.64
 * Author: D de Zeeuw / NEKO media
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Plugin activation hook to set default options
register_activation_hook(__FILE__, 'festival_track_wizard_activate');
function festival_track_wizard_activate() {
    add_option('festival_track_wizard_api_base_url', 'https://trackapi.catriox.nl');
}

add_shortcode('festival_track_wizard', function () {
    $api_key = get_option('festival_track_wizard_api_key', '');
    if (empty($api_key) && current_user_can('manage_options')) {
        return '<div class="notice notice-warning"><p>Festival Track Wizard: API key not configured. <a href="' . admin_url('options-general.php?page=festival-track-wizard-settings') . '">Configure it here</a>.</p></div>';
    } elseif (empty($api_key)) {
        return '<p>Festival Track Wizard is currently being configured. Please try again later.</p>';
    }
    
    // Festival track wizard renders simple mode but respects login status
    return '<div id="festival-track-wizard-root" data-display-mode="wizard-simple"></div>';
});

add_shortcode('festival_track_simple', function () {
    $api_key = get_option('festival_track_wizard_api_key', '');
    if (empty($api_key) && current_user_can('manage_options')) {
        return '<div class="notice notice-warning"><p>Festival Track Wizard: API key not configured. <a href="' . admin_url('options-general.php?page=festival-track-wizard-settings') . '">Configure it here</a>.</p></div>';
    } elseif (empty($api_key)) {
        return '<p>Festival Track Wizard is currently being configured. Please try again later.</p>';
    }
    
    // Festival track simple always shows as logged-out (read-only mode)
    return '<div id="festival-track-wizard-root" data-display-mode="simple-readonly"></div>';
});

add_action('wp_enqueue_scripts', 'festival_track_wizard_enqueue_assets');
function festival_track_wizard_enqueue_assets() {
    global $post;
    if (!is_a($post, 'WP_Post')) return;

    $has_wizard_shortcode = has_shortcode($post->post_content, 'festival_track_wizard');
    $has_simple_shortcode = has_shortcode($post->post_content, 'festival_track_simple');
    
    // Load assets if either shortcode is present (no login requirement for loading assets)
    if ($has_wizard_shortcode || $has_simple_shortcode) {
        $api_key = get_option('festival_track_wizard_api_key', '');
        
        // Check if wp-i18n is available, add it as dependency if so
        $dependencies = array();
        if (wp_script_is('wp-i18n', 'registered')) {
            $dependencies[] = 'wp-i18n';
        }
        
        wp_enqueue_script(
            'festival-track-wizard',
            plugin_dir_url(__FILE__) . 'build/index.js',
            $dependencies,
            filemtime(plugin_dir_path(__FILE__) . 'build/index.js'),
            true
        );

        wp_enqueue_style(
            'festival-track-wizard-style',
            plugin_dir_url(__FILE__) . 'build/style.css',
            array(),
            filemtime(plugin_dir_path(__FILE__) . 'build/style.css')
        );

        // Determine display mode
        $display_mode = 'full'; // default
        if ($has_simple_shortcode) {
            $display_mode = 'simple-readonly'; // Always shows as logged-out
        } else if ($has_wizard_shortcode) {
            $display_mode = 'wizard-simple'; // Simple list but respects login status
        }

        $current_user = wp_get_current_user();
        $user_data = null;
        
        // Only include user data if user is logged in AND not in simple-readonly mode
        if (is_user_logged_in() && $display_mode !== 'simple-readonly') {
            $user_data = array(
                'username' => $current_user->user_login,
                'email' => $current_user->user_email,
                'firstName' => $current_user->first_name,
                'lastName' => $current_user->last_name,
                'displayName' => $current_user->display_name,
                'ticket_type' => get_user_meta($current_user->ID, 'festival_ticket_type', true) ?: 'standard',
            );
        }
        
        wp_localize_script('festival-track-wizard', 'FestivalWizardData', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('festival_track_wizard_nonce'),
            'isLoggedIn' => is_user_logged_in() && $display_mode !== 'simple-readonly',
            'currentUser' => $user_data,
            'apiKey' => $api_key,
            'apiBaseUrl' => get_option('festival_track_wizard_api_base_url', 'https://trackapi.catriox.nl'),
            'displayMode' => $display_mode,
            'activitiesTitle' => get_option('festival_track_wizard_activities_title', 'Festival Activiteiten'),
            'activitiesIntro' => get_option('festival_track_wizard_activities_intro', 'Hier vind je alle activiteiten van Scout-In. Je kunt de activiteiten bekijken en beheren in deze lijst.'),
        ]);
    }
}

// Add admin menu
add_action('admin_menu', 'festival_track_wizard_admin_menu');
function festival_track_wizard_admin_menu() {
    add_options_page(
        'Festival Track Wizard Settings',
        'Festival Track Wizard',
        'manage_options',
        'festival-track-wizard-settings',
        'festival_track_wizard_settings_page'
    );
}

// Settings page
function festival_track_wizard_settings_page() {
    if (isset($_POST['submit'])) {
        check_admin_referer('festival_track_wizard_settings');
        
        $api_key = sanitize_text_field($_POST['festival_track_wizard_api_key']);
        $api_base_url = sanitize_text_field($_POST['festival_track_wizard_api_base_url']);
        $activities_title = sanitize_text_field($_POST['festival_track_wizard_activities_title']);
        $activities_intro = sanitize_textarea_field($_POST['festival_track_wizard_activities_intro']);
        
        update_option('festival_track_wizard_api_key', $api_key);
        update_option('festival_track_wizard_api_base_url', $api_base_url);
        update_option('festival_track_wizard_activities_title', $activities_title);
        update_option('festival_track_wizard_activities_intro', $activities_intro);
        
        echo '<div class="notice notice-success"><p>Settings saved!</p></div>';
    }
    
    $api_key = get_option('festival_track_wizard_api_key', '');
    $api_base_url = get_option('festival_track_wizard_api_base_url', 'https://trackapi.catriox.nl');
    $activities_title = get_option('festival_track_wizard_activities_title', 'Festival Activiteiten');
    $activities_intro = get_option('festival_track_wizard_activities_intro', 'Hier vind je alle activiteiten van Scout-In. Je kunt de activiteiten bekijken en beheren in deze lijst.');
    ?>
    <div class="wrap">
        <h1>Festival Track Wizard Settings</h1>
        <form method="post" action="">
            <?php wp_nonce_field('festival_track_wizard_settings'); ?>
            <table class="form-table">
                <tr>
                    <th scope="row">
                        <label for="festival_track_wizard_api_key">X-API-KEY</label>
                    </th>
                    <td>
                        <input 
                            type="text" 
                            id="festival_track_wizard_api_key" 
                            name="festival_track_wizard_api_key" 
                            value="<?php echo esc_attr($api_key); ?>" 
                            class="regular-text"
                            placeholder="Enter your API key"
                        />
                        <p class="description">
                            Enter the X-API-KEY required for the Festival Track Wizard API calls.
                        </p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label for="festival_track_wizard_api_base_url">API Base URL</label>
                    </th>
                    <td>
                        <input 
                            type="url" 
                            id="festival_track_wizard_api_base_url" 
                            name="festival_track_wizard_api_base_url" 
                            value="<?php echo esc_attr($api_base_url); ?>" 
                            class="regular-text"
                            placeholder="<?php echo esc_attr(get_option('festival_track_wizard_api_base_url', 'https://trackapi.catriox.nl')); ?>"
                        />
                        <p class="description">
                            Enter the base URL for the Festival Track Wizard API (without trailing slash).
                        </p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label for="festival_track_wizard_activities_title">Activities List Title</label>
                    </th>
                    <td>
                        <input 
                            type="text" 
                            id="festival_track_wizard_activities_title" 
                            name="festival_track_wizard_activities_title" 
                            value="<?php echo esc_attr($activities_title); ?>" 
                            class="regular-text"
                            placeholder="Festival Activiteiten"
                        />
                        <p class="description">
                            Enter the title to display at the top of the activities list page.
                        </p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label for="festival_track_wizard_activities_intro">Activities List Introduction</label>
                    </th>
                    <td>
                        <textarea 
                            id="festival_track_wizard_activities_intro" 
                            name="festival_track_wizard_activities_intro" 
                            rows="3"
                            class="large-text"
                            placeholder="Hier vind je alle activiteiten van Scout-In. Je kunt de activiteiten bekijken en beheren in deze lijst."
                        ><?php echo esc_textarea($activities_intro); ?></textarea>
                        <p class="description">
                            Enter the introduction text to display below the title on the activities list page.
                        </p>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
        
        <?php if (!empty($api_key)): ?>
            <div class="notice notice-info">
                <p><strong>Status:</strong> API key is configured and ready to use.</p>
            </div>
        <?php else: ?>
            <div class="notice notice-warning">
                <p><strong>Warning:</strong> No API key configured. The Festival Track Wizard will not function until an API key is provided.</p>
            </div>
        <?php endif; ?>
        
        <hr />
        
        <h2>Available Shortcodes</h2>
        <p>Use these shortcodes to display the Festival Track Wizard on your pages or posts. Click on a shortcode to copy it to your clipboard.</p>
        
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th style="width: 30%;">Shortcode</th>
                    <th style="width: 70%;">Description</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <code style="display: inline-block; padding: 8px 12px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 3px; cursor: pointer;" onclick="navigator.clipboard.writeText('[festival_track_wizard]'); alert('Shortcode copied!');">[festival_track_wizard]</code>
                    </td>
                    <td>
                        <strong>Activities List with Login Features</strong><br>
                        Displays the activities list in simple view mode. Features include:
                        <ul style="margin-top: 5px;">
                            <li>• Simple activities list view</li>
                            <li>• Activity details in modal popup</li>
                            <li>• For logged-in users: status indicators, subscription buttons, schedule management</li>
                            <li>• For logged-out users: read-only view without interactive features</li>
                        </ul>
                        <em>Note: Adapts based on user login status.</em>
                    </td>
                </tr>
                <tr>
                    <td>
                        <code style="display: inline-block; padding: 8px 12px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 3px; cursor: pointer;" onclick="navigator.clipboard.writeText('[festival_track_simple]'); alert('Shortcode copied!');">[festival_track_simple]</code>
                    </td>
                    <td>
                        <strong>Read-Only Activities List</strong><br>
                        Displays a read-only view of activities, always appearing as if user is logged out:
                        <ul style="margin-top: 5px;">
                            <li>• Simple activities list view</li>
                            <li>• Activity details in modal popup</li>
                            <li>• No status indicators or subscription buttons</li>
                            <li>• Safe for public/cached pages</li>
                        </ul>
                        <em>Note: Always shows as logged-out, regardless of actual login status.</em>
                    </td>
                </tr>
            </tbody>
        </table>
        
        <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-left: 4px solid #0073aa;">
            <h3 style="margin-top: 0;">Usage Instructions</h3>
            <ol>
                <li>Copy the desired shortcode by clicking on it</li>
                <li>Paste the shortcode into any WordPress page or post where you want the activities list to appear</li>
                <li>Make sure you have configured the API key above for the shortcodes to work properly</li>
                <li>Use <code>[festival_track_wizard]</code> for pages where users can interact with activities</li>
                <li>Use <code>[festival_track_simple]</code> for public/cached pages where you want a read-only view</li>
            </ol>
        </div>
    </div>
    <?php
}

// Add settings link to plugin page
add_filter('plugin_action_links_' . plugin_basename(__FILE__), 'festival_track_wizard_action_links');
function festival_track_wizard_action_links($links) {
    $settings_link = '<a href="' . admin_url('options-general.php?page=festival-track-wizard-settings') . '">Settings</a>';
    array_unshift($links, $settings_link);
    return $links;
}

// WordPress AJAX handlers for activities API
add_action('wp_ajax_festival_activities_all', 'festival_track_wizard_activities_all');
add_action('wp_ajax_nopriv_festival_activities_all', 'festival_track_wizard_activities_all');

function festival_track_wizard_activities_all() {
    // Verify nonce
    if (!wp_verify_nonce($_POST['nonce'], 'festival_track_wizard_nonce')) {
        wp_die('Security check failed', 'Error', array('response' => 403));
    }

    $api_key = get_option('festival_track_wizard_api_key', '');
    $api_base_url = get_option('festival_track_wizard_api_base_url', 'https://trackapi.catriox.nl');
    
    if (empty($api_key)) {
        wp_send_json_error('API key not configured', 500);
        return;
    }

    $url = rtrim($api_base_url, '/') . '/activities/all';
    
    $response = wp_remote_get($url, array(
        'headers' => array(
            'X-API-KEY' => $api_key,
            'Content-Type' => 'application/json'
        ),
        'timeout' => 30
    ));

    if (is_wp_error($response)) {
        wp_send_json_error('Failed to fetch activities: ' . $response->get_error_message(), 500);
        return;
    }

    $status_code = wp_remote_retrieve_response_code($response);
    $body = wp_remote_retrieve_body($response);

    if ($status_code !== 200) {
        wp_send_json_error('API request failed with status ' . $status_code, $status_code);
        return;
    }

    $data = json_decode($body, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        wp_send_json_error('Invalid JSON response from API', 500);
        return;
    }

    wp_send_json_success($data);
}

add_action('wp_ajax_festival_activities_get', 'festival_track_wizard_activities_get');
add_action('wp_ajax_nopriv_festival_activities_get', 'festival_track_wizard_activities_get');

function festival_track_wizard_activities_get() {
    // Verify nonce
    if (!wp_verify_nonce($_POST['nonce'], 'festival_track_wizard_nonce')) {
        wp_die('Security check failed', 'Error', array('response' => 403));
    }

    if (empty($_POST['activity_id'])) {
        wp_send_json_error('Activity ID is required', 400);
        return;
    }

    $activity_id = sanitize_text_field($_POST['activity_id']);
    $api_key = get_option('festival_track_wizard_api_key', '');
    $api_base_url = get_option('festival_track_wizard_api_base_url', 'https://trackapi.catriox.nl');
    
    if (empty($api_key)) {
        wp_send_json_error('API key not configured', 500);
        return;
    }

    $url = rtrim($api_base_url, '/') . '/activities/' . $activity_id;
    
    $response = wp_remote_get($url, array(
        'headers' => array(
            'X-API-KEY' => $api_key,
            'Content-Type' => 'application/json'
        ),
        'timeout' => 30
    ));

    if (is_wp_error($response)) {
        wp_send_json_error('Failed to fetch activity: ' . $response->get_error_message(), 500);
        return;
    }

    $status_code = wp_remote_retrieve_response_code($response);
    $body = wp_remote_retrieve_body($response);

    if ($status_code !== 200) {
        wp_send_json_error('API request failed with status ' . $status_code, $status_code);
        return;
    }

    $data = json_decode($body, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        wp_send_json_error('Invalid JSON response from API', 500);
        return;
    }

    wp_send_json_success($data);
}

// WordPress AJAX handler for fetching participant profile
add_action('wp_ajax_festival_participant_profile', 'festival_track_wizard_participant_profile');

function festival_track_wizard_participant_profile() {
    // Verify nonce
    if (!wp_verify_nonce($_POST['nonce'], 'festival_track_wizard_nonce')) {
        wp_die('Security check failed', 'Error', array('response' => 403));
    }

    // Get current user
    $current_user = wp_get_current_user();
    if (!$current_user->exists()) {
        wp_send_json_error('User not logged in', 401);
        return;
    }

    $api_key = get_option('festival_track_wizard_api_key', '');
    $api_base_url = get_option('festival_track_wizard_api_base_url', 'https://trackapi.catriox.nl');
    
    if (empty($api_key)) {
        wp_send_json_error('API key not configured', 500);
        return;
    }

    // Use the WordPress username to fetch participant profile
    $username = $current_user->user_login;
    $url = rtrim($api_base_url, '/') . '/participants/' . urlencode($username);
    
    $response = wp_remote_get($url, array(
        'headers' => array(
            'X-API-KEY' => $api_key,
            'Content-Type' => 'application/json'
        ),
        'timeout' => 30
    ));

    if (is_wp_error($response)) {
        wp_send_json_error('Failed to fetch participant profile: ' . $response->get_error_message(), 500);
        return;
    }

    $status_code = wp_remote_retrieve_response_code($response);
    $body = wp_remote_retrieve_body($response);

    // If participant not found (404), return user data so frontend can handle it
    if ($status_code === 404) {
        wp_send_json_success(array(
            'participant' => null,
            'wordpress_user' => array(
                'username' => $current_user->user_login,
                'email' => $current_user->user_email,
                'first_name' => $current_user->first_name,
                'last_name' => $current_user->last_name,
                'display_name' => $current_user->display_name,
            )
        ));
        return;
    }

    if ($status_code !== 200) {
        wp_send_json_error('API request failed with status ' . $status_code, $status_code);
        return;
    }

    $data = json_decode($body, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        wp_send_json_error('Invalid JSON response from API', 500);
        return;
    }

    // Return both participant data and WordPress user data
    wp_send_json_success(array(
        'participant' => $data,
        'wordpress_user' => array(
            'username' => $current_user->user_login,
            'email' => $current_user->user_email,
            'first_name' => $current_user->first_name,
            'last_name' => $current_user->last_name,
            'display_name' => $current_user->display_name,
        )
    ));
}

// WordPress AJAX handler for subscribing to activity
add_action('wp_ajax_festival_activities_subscribe', 'festival_track_wizard_activities_subscribe');

function festival_track_wizard_activities_subscribe() {
    // Log the start of the request
    error_log('Scout-In Subscribe request started');
    error_log('Scout-In POST data: ' . print_r($_POST, true));
    
    // Verify nonce
    if (!wp_verify_nonce($_POST['nonce'], 'festival_track_wizard_nonce')) {
        error_log('Scout-In Nonce verification failed');
        wp_die('Security check failed', 'Error', array('response' => 403));
    }

    if (empty($_POST['username']) || empty($_POST['activity_id'])) {
        error_log('Scout-In Missing username or activity_id');
        wp_send_json_error('Username and activity ID are required', 400);
        return;
    }

    $username = sanitize_text_field($_POST['username']);
    $activity_id = sanitize_text_field($_POST['activity_id']);
    $api_key = get_option('festival_track_wizard_api_key', '');
    $api_base_url = get_option('festival_track_wizard_api_base_url', 'https://trackapi.catriox.nl');
    
    error_log('Scout-In Username: ' . $username);
    error_log('Scout-In Activity ID: ' . $activity_id);
    error_log('Scout-In API Base URL: ' . $api_base_url);
    error_log('Scout-In API Key present: ' . (empty($api_key) ? 'NO' : 'YES'));
    
    if (empty($api_key)) {
        error_log('Scout-In API key not configured');
        wp_send_json_error('API key not configured', 500);
        return;
    }

    $url = rtrim($api_base_url, '/') . '/activities/subscribe/' . $username . '/' . $activity_id;
    error_log('Scout-In Request URL: ' . $url);
    
    $request_args = array(
        'method' => 'PUT',
        'headers' => array(
            'X-API-KEY' => $api_key,
            'Content-Type' => 'application/json'
        ),
        'timeout' => 30
    );
    error_log('Scout-In Request args: ' . print_r($request_args, true));
    
    $response = wp_remote_request($url, $request_args);

    if (is_wp_error($response)) {
        $error_message = $response->get_error_message();
        error_log('Scout-In WP Error: ' . $error_message);
        wp_send_json_error('Failed to subscribe to activity: ' . $error_message, 500);
        return;
    }

    $status_code = wp_remote_retrieve_response_code($response);
    $body = wp_remote_retrieve_body($response);
    $headers = wp_remote_retrieve_headers($response);

    error_log('Scout-In: Response status: ' . $status_code);
    error_log('Scout-In: Response body: ' . $body);
    error_log('Scout-In: Response headers: ' . print_r($headers, true));

    if ($status_code !== 200 && $status_code !== 201 && $status_code !== 204) {
        error_log('Scout-In: API request failed with status ' . $status_code . ', body: ' . $body);
        wp_send_json_error('API request failed with status ' . $status_code . ': ' . $body, $status_code);
        return;
    }

    error_log('Scout-In: Subscribe successful');
    wp_send_json_success(array('message' => 'Successfully subscribed to activity'));
}

// WordPress AJAX handler for unsubscribing from activity
add_action('wp_ajax_festival_activities_unsubscribe', 'festival_track_wizard_activities_unsubscribe');

function festival_track_wizard_activities_unsubscribe() {
    // Verify nonce
    if (!wp_verify_nonce($_POST['nonce'], 'festival_track_wizard_nonce')) {
        wp_die('Security check failed', 'Error', array('response' => 403));
    }

    if (empty($_POST['username']) || empty($_POST['activity_id'])) {
        wp_send_json_error('Username and activity ID are required', 400);
        return;
    }

    $username = sanitize_text_field($_POST['username']);
    $activity_id = sanitize_text_field($_POST['activity_id']);
    $api_key = get_option('festival_track_wizard_api_key', '');
    $api_base_url = get_option('festival_track_wizard_api_base_url', 'https://trackapi.catriox.nl');
    
    if (empty($api_key)) {
        wp_send_json_error('API key not configured', 500);
        return;
    }

    $url = rtrim($api_base_url, '/') . '/activities/unsubscribe/' . $username . '/' . $activity_id;
    
    $response = wp_remote_request($url, array(
        'method' => 'PUT',
        'headers' => array(
            'X-API-KEY' => $api_key,
            'Content-Type' => 'application/json'
        ),
        'timeout' => 30
    ));

    if (is_wp_error($response)) {
        wp_send_json_error('Failed to unsubscribe from activity: ' . $response->get_error_message(), 500);
        return;
    }

    $status_code = wp_remote_retrieve_response_code($response);
    $body = wp_remote_retrieve_body($response);

    if ($status_code !== 200 && $status_code !== 201 && $status_code !== 204) {
        wp_send_json_error('API request failed with status ' . $status_code, $status_code);
        return;
    }

    wp_send_json_success(array('message' => 'Successfully unsubscribed from activity'));
}
?>
