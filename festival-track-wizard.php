<?php
/**
 * Plugin Name: Festival Track Wizard
 * Description: A personalized festival tracking wizard.
 * Version: 1.2
 * Author: D de Zeeuw / NEKO media
 */

add_shortcode('festival_track_wizard', function () {
    if (is_user_logged_in()) {
        return '<div id="festival-track-wizard-root"></div>';
    } else {
        return '<p>Log in of <a href="https://test-scout-in.scouting.nl/scouts-online-login/">creëer een account</a> om je eigen track te maken voor Scout-in 25!</p>';
    }
});

add_action('wp_enqueue_scripts', 'festival_track_wizard_enqueue_assets');
function festival_track_wizard_enqueue_assets() {
    if (!is_user_logged_in()) return;

    global $post;
    if (!is_a($post, 'WP_Post')) return;

    if (has_shortcode($post->post_content, 'festival_track_wizard')) {
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
            'currentUser' => wp_get_current_user()->display_name
        ]);
    }
}
?>
