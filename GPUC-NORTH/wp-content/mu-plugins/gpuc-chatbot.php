<?php
/**
 * Plugin Name: Gopalan Pre-University College AI Admissions & Accounts Chatbot
 * Description: Injects the official GPUC North AI Chatbot across every page including frontend pages, login (wp-login.php), and admin dashboard.
 * Version: 1.0.0
 * Author: Gopalan Pre-University College
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! function_exists( 'gpuc_north_render_ai_chatbot_widget' ) ) {
    function gpuc_north_render_ai_chatbot_widget() {
        static $gpuc_printed = false;
        if ( $gpuc_printed ) {
            return;
        }
        $gpuc_printed = true;
        ?>
        <!-- Gopalan Pre-University College AI Admissions & Accounts Chatbot Widget -->
        <style>
          .grecaptcha-badge,
          .recaptcha_v3-bottomright,
          div[style*="bottom: 14px"][style*="right: 0"],
          iframe[src*="recaptcha"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
            width: 0 !important;
            height: 0 !important;
            position: absolute !important;
            left: -9999px !important;
            z-index: -9999 !important;
          }
        </style>
        <script>
            window.GPUC_CHATBOT_URL = window.GPUC_CHATBOT_URL || 'http://localhost:3000';
        </script>
        <script src="http://localhost:3000/gpuc-chatbot-embed.js?v=6" async></script>
        <?php
    }
}

// 1. Frontend pages (home, courses, about, admissions, contact, etc.)
add_action( 'wp_footer', 'gpuc_north_render_ai_chatbot_widget', 9999 );

// 2. WordPress login screen (wp-login.php)
add_action( 'login_footer', 'gpuc_north_render_ai_chatbot_widget', 9999 );

// 3. WordPress admin dashboard (wp-admin)
add_action( 'admin_footer', 'gpuc_north_render_ai_chatbot_widget', 9999 );
