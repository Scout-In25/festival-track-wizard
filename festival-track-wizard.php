<?php
/**
 * Plugin Name: Festival Track Wizard
 * Description: A personalized festival tracking wizard.
 * Version: 1.10
 * Author: D de Zeeuw / NEKO media
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

add_shortcode('festival_track_wizard', function () {
    if (is_user_logged_in()) {
        $api_key = get_option('festival_track_wizard_api_key', '');
        if (empty($api_key) && current_user_can('manage_options')) {
            return '<div class="notice notice-warning"><p>Festival Track Wizard: API key not configured. <a href="' . admin_url('options-general.php?page=festival-track-wizard-settings') . '">Configure it here</a>.</p></div>';
        } elseif (empty($api_key)) {
            return '<p>Festival Track Wizard is currently being configured. Please try again later.</p>';
        }
        return '<div id="festival-track-wizard-root"></div>';
    } else {
        return '<p>Log in of <a href="https://test-scout-in.scouting.nl/scouts-online-login/">creëer een account</a> om je eigen track te maken voor Scout-in 25!</p>';
    }
});

add_shortcode('festival_track_simple', function () {
    if (is_user_logged_in()) {
        $api_key = get_option('festival_track_wizard_api_key', '');
        if (empty($api_key) && current_user_can('manage_options')) {
            return '<div class="notice notice-warning"><p>Festival Track Wizard: API key not configured. <a href="' . admin_url('options-general.php?page=festival-track-wizard-settings') . '">Configure it here</a>.</p></div>';
        } elseif (empty($api_key)) {
            return '<p>Festival Track Wizard is currently being configured. Please try again later.</p>';
        }
        return '<div id="festival-track-wizard-root" data-simple-mode="true"></div>';
    } else {
        return '<p>Log in of <a href="https://test-scout-in.scouting.nl/scouts-online-login/">creëer een account</a> om je eigen track te maken voor Scout-in 25!</p>';
    }
});

add_action('wp_enqueue_scripts', 'festival_track_wizard_enqueue_assets');
function festival_track_wizard_enqueue_assets() {
    if (!is_user_logged_in()) return;

    global $post;
    if (!is_a($post, 'WP_Post')) return;

    if (has_shortcode($post->post_content, 'festival_track_wizard') || has_shortcode($post->post_content, 'festival_track_simple')) {
        $api_key = get_option('festival_track_wizard_api_key', '');
        
        wp_enqueue_script(
            'festival-track-wizard',
            plugin_dir_url(__FILE__) . 'build/index.js',
            array(),
            filemtime(plugin_dir_path(__FILE__) . 'build/index.js'),
            true
        );

        wp_enqueue_style(
            'festival-track-wizard-style',
            plugin_dir_url(__FILE__) . 'build/style.css',
            array(),
            filemtime(plugin_dir_path(__FILE__) . 'build/style.css')
        );

        wp_localize_script('festival-track-wizard', 'FestivalWizardData', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('festival_track_wizard_nonce'),
            'currentUser' => wp_get_current_user()->display_name,
            'apiKey' => $api_key,
            'apiBaseUrl' => get_option('festival_track_wizard_api_base_url', 'https://si25.timoklabbers.nl'),
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
        
        update_option('festival_track_wizard_api_key', $api_key);
        update_option('festival_track_wizard_api_base_url', $api_base_url);
        
        echo '<div class="notice notice-success"><p>Settings saved!</p></div>';
    }
    
    $api_key = get_option('festival_track_wizard_api_key', '');
    $api_base_url = get_option('festival_track_wizard_api_base_url', 'https://si25.timoklabbers.nl');
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
                            placeholder="https://si25.timoklabbers.nl"
                        />
                        <p class="description">
                            Enter the base URL for the Festival Track Wizard API (without trailing slash).
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
?>
