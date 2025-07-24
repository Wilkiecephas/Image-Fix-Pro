<?php
/*
Plugin Name: Image Fix Pro
Plugin URI: https://example.com/image-fix-pro
Description: Complete image optimization, enhancement, and SEO solution for WordPress.
Version: 2.0
Author: Your Name
Author URI: https://yourwebsite.com
License: GPL2
Text Domain: image-fix-pro
*/

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class Image_Fix_Pro {
    private $settings;
    private $default_settings = array(
        'enabled' => 1,
        'optimization_level' => 'balanced',
        'convert_webp' => 1,
        'lazy_loading' => 1,
        'auto_alt_text' => 1,
        'alt_pattern' => '%title%',
        'backup_images' => 1,
        'preserve_exif' => 0,
        'compress_pdf' => 1,
        'watermark' => 0,
        'watermark_position' => 'bottom-right',
        'watermark_text' => '© Your Site',
        'watermark_opacity' => 70,
        'watermark_font_size' => 20,
        'cdn_enabled' => 0,
        'cdn_url' => '',
        'sitemap_images' => 1,
        'broken_image_fix' => 1,
        'social_og_images' => 1,
        'enable_logs' => 1,
        'show_stats' => 1,
        'use_imagick' => 0
    );
    
    private $backup_dir;
    private $log_file;

    public function __construct() {
        // Setup paths
        $upload_dir = wp_upload_dir();
        $this->backup_dir = trailingslashit($upload_dir['basedir']) . 'ifp_backups/';
        $this->log_file = trailingslashit($upload_dir['basedir']) . 'ifp_log.txt';
        
        // Initialize settings
        $this->settings = get_option('ifp_settings', $this->default_settings);
        
        // Load text domain
        add_action('plugins_loaded', array($this, 'load_textdomain'));
        
        // Admin interface
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_filter('plugin_action_links_' . plugin_basename(__FILE__), array($this, 'add_settings_link'));
        
        // Media library integration
        add_filter('manage_media_columns', array($this, 'add_media_columns'));
        add_action('manage_media_custom_column', array($this, 'manage_media_custom_column'), 10, 2);
        
        // Image optimization hooks
        add_filter('wp_handle_upload', array($this, 'optimize_uploaded_image'));
        add_action('edit_attachment', array($this, 'optimize_existing_image'));
        
        // Front-end enhancements
        add_filter('the_content', array($this, 'content_image_enhancements'));
        add_filter('post_thumbnail_html', array($this, 'thumbnail_enhancements'), 10, 5);
        
        // Scheduled tasks
        add_action('ifp_daily_maintenance', array($this, 'daily_maintenance'));
        if (!wp_next_scheduled('ifp_daily_maintenance')) {
            wp_schedule_event(time(), 'daily', 'ifp_daily_maintenance');
        }
        
        // Admin notices
        add_action('admin_notices', array($this, 'show_admin_notices'));
        add_action('admin_notices', array($this, 'ifp_display_notifications'));
        
        // Notification system
        add_action('admin_init', array($this, 'ifp_donate_notification'));
        
        // AJAX handlers
        add_action('wp_ajax_ifp_bulk_optimize', array($this, 'ajax_bulk_optimize'));
        add_action('wp_ajax_ifp_bulk_restore', array($this, 'ajax_bulk_restore'));
        add_action('wp_ajax_ifp_bulk_webp', array($this, 'ajax_bulk_webp'));
        add_action('wp_ajax_ifp_dismiss_notice', array($this, 'ajax_dismiss_notice'));
        
        // Create backup directory
        $this->create_backup_dir();
        
        // Record installation time
        if (!get_option('ifp_install_time')) {
            update_option('ifp_install_time', time());
        }
    }

    public function load_textdomain() {
        load_plugin_textdomain('image-fix-pro', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }

    public function add_admin_menu() {
        $hook = add_menu_page(
            __('Image Fix Pro', 'image-fix-pro'),
            __('Image Fix Pro', 'image-fix-pro'),
            'manage_options',
            'image-fix-pro',
            array($this, 'render_admin_page'),
            'dashicons-format-gallery',
            80
        );
        
        add_action("admin_print_scripts-{$hook}", array($this, 'enqueue_admin_scripts'));
    }

    public function enqueue_admin_scripts() {
        wp_enqueue_style('image-fix-pro-admin', plugin_dir_url(__FILE__) . 'admin.css');
        wp_enqueue_script('image-fix-pro-admin', plugin_dir_url(__FILE__) . 'admin.js', array('jquery'), '1.0', true);
        
        wp_localize_script('image-fix-pro-admin', 'ifp_vars', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('ifp_nonce'),
            'i18n' => array(
                'processing' => __('Processing...', 'image-fix-pro'),
                'completed' => __('Completed!', 'image-fix-pro'),
                'error' => __('Error occurred', 'image-fix-pro'),
                'confirm_restore' => __('Are you sure you want to restore original images? This cannot be undone.', 'image-fix-pro')
            )
        ));
    }

    public function register_settings() {
        register_setting('ifp_settings_group', 'ifp_settings', array($this, 'sanitize_settings'));
        
        // Sections
        add_settings_section('ifp_optimization_section', __('Image Optimization', 'image-fix-pro'), array($this, 'render_optimization_section'), 'image-fix-pro');
        add_settings_section('ifp_seo_section', __('SEO & Accessibility', 'image-fix-pro'), array($this, 'render_seo_section'), 'image-fix-pro');
        add_settings_section('ifp_enhancement_section', __('Image Enhancement', 'image-fix-pro'), array($this, 'render_enhancement_section'), 'image-fix-pro');
        add_settings_section('ifp_cdn_section', __('CDN & Delivery', 'image-fix-pro'), array($this, 'render_cdn_section'), 'image-fix-pro');
        add_settings_section('ifp_tools_section', __('Tools & Utilities', 'image-fix-pro'), array($this, 'render_tools_section'), 'image-fix-pro');
        
        // Optimization Fields
        add_settings_field('enabled', __('Enable Optimization', 'image-fix-pro'), array($this, 'render_enabled_field'), 'image-fix-pro', 'ifp_optimization_section');
        add_settings_field('optimization_level', __('Optimization Level', 'image-fix-pro'), array($this, 'render_optimization_level_field'), 'image-fix-pro', 'ifp_optimization_section');
        add_settings_field('convert_webp', __('Convert to WebP', 'image-fix-pro'), array($this, 'render_convert_webp_field'), 'image-fix-pro', 'ifp_optimization_section');
        add_settings_field('lazy_loading', __('Lazy Loading', 'image-fix-pro'), array($this, 'render_lazy_loading_field'), 'image-fix-pro', 'ifp_optimization_section');
        add_settings_field('backup_images', __('Backup Original Images', 'image-fix-pro'), array($this, 'render_backup_images_field'), 'image-fix-pro', 'ifp_optimization_section');
        add_settings_field('preserve_exif', __('Preserve EXIF Data', 'image-fix-pro'), array($this, 'render_preserve_exif_field'), 'image-fix-pro', 'ifp_optimization_section');
        add_settings_field('use_imagick', __('Use ImageMagick', 'image-fix-pro'), array($this, 'render_use_imagick_field'), 'image-fix-pro', 'ifp_optimization_section');
        
        // SEO Fields
        add_settings_field('auto_alt_text', __('Auto Alt Text', 'image-fix-pro'), array($this, 'render_auto_alt_text_field'), 'image-fix-pro', 'ifp_seo_section');
        add_settings_field('alt_pattern', __('Alt Text Pattern', 'image-fix-pro'), array($this, 'render_alt_pattern_field'), 'image-fix-pro', 'ifp_seo_section');
        add_settings_field('sitemap_images', __('Include in Sitemap', 'image-fix-pro'), array($this, 'render_sitemap_images_field'), 'image-fix-pro', 'ifp_seo_section');
        add_settings_field('social_og_images', __('Social Media Optimization', 'image-fix-pro'), array($this, 'render_social_og_images_field'), 'image-fix-pro', 'ifp_seo_section');
        
        // Enhancement Fields
        add_settings_field('watermark', __('Watermark Images', 'image-fix-pro'), array($this, 'render_watermark_field'), 'image-fix-pro', 'ifp_enhancement_section');
        add_settings_field('watermark_position', __('Watermark Position', 'image-fix-pro'), array($this, 'render_watermark_position_field'), 'image-fix-pro', 'ifp_enhancement_section');
        add_settings_field('watermark_text', __('Watermark Text', 'image-fix-pro'), array($this, 'render_watermark_text_field'), 'image-fix-pro', 'ifp_enhancement_section');
        add_settings_field('watermark_opacity', __('Watermark Opacity', 'image-fix-pro'), array($this, 'render_watermark_opacity_field'), 'image-fix-pro', 'ifp_enhancement_section');
        add_settings_field('watermark_font_size', __('Watermark Font Size', 'image-fix-pro'), array($this, 'render_watermark_font_size_field'), 'image-fix-pro', 'ifp_enhancement_section');
        
        // CDN Fields
        add_settings_field('cdn_enabled', __('Enable CDN', 'image-fix-pro'), array($this, 'render_cdn_enabled_field'), 'image-fix-pro', 'ifp_cdn_section');
        add_settings_field('cdn_url', __('CDN URL', 'image-fix-pro'), array($this, 'render_cdn_url_field'), 'image-fix-pro', 'ifp_cdn_section');
        
        // Tools Fields
        add_settings_field('broken_image_fix', __('Broken Image Fix', 'image-fix-pro'), array($this, 'render_broken_image_fix_field'), 'image-fix-pro', 'ifp_tools_section');
        add_settings_field('enable_logs', __('Enable Logging', 'image-fix-pro'), array($this, 'render_enable_logs_field'), 'image-fix-pro', 'ifp_tools_section');
        add_settings_field('show_stats', __('Show Statistics', 'image-fix-pro'), array($this, 'render_show_stats_field'), 'image-fix-pro', 'ifp_tools_section');
    }

    public function sanitize_settings($input) {
        if (!current_user_can('manage_options')) {
            return $this->settings;
        }
        
        // Verify nonce
        if (!isset($input['ifp_settings_nonce']) || !wp_verify_nonce($input['ifp_settings_nonce'], 'ifp_save_settings')) {
            wp_die(__('Security check failed', 'image-fix-pro'));
        }
        
        $sanitized = array();
        
        // Optimization settings
        $sanitized['enabled'] = isset($input['enabled']) ? 1 : 0;
        $sanitized['optimization_level'] = in_array($input['optimization_level'], array('low', 'balanced', 'high')) ? $input['optimization_level'] : 'balanced';
        $sanitized['convert_webp'] = isset($input['convert_webp']) ? 1 : 0;
        $sanitized['lazy_loading'] = isset($input['lazy_loading']) ? 1 : 0;
        $sanitized['backup_images'] = isset($input['backup_images']) ? 1 : 0;
        $sanitized['preserve_exif'] = isset($input['preserve_exif']) ? 1 : 0;
        $sanitized['use_imagick'] = isset($input['use_imagick']) ? 1 : 0;
        
        // SEO settings
        $sanitized['auto_alt_text'] = isset($input['auto_alt_text']) ? 1 : 0;
        $sanitized['alt_pattern'] = sanitize_text_field($input['alt_pattern']);
        $sanitized['sitemap_images'] = isset($input['sitemap_images']) ? 1 : 0;
        $sanitized['social_og_images'] = isset($input['social_og_images']) ? 1 : 0;
        
        // Enhancement settings
        $sanitized['watermark'] = isset($input['watermark']) ? 1 : 0;
        $sanitized['watermark_position'] = in_array($input['watermark_position'], array('top-left', 'top-center', 'top-right', 'center', 'bottom-left', 'bottom-center', 'bottom-right')) ? $input['watermark_position'] : 'bottom-right';
        $sanitized['watermark_text'] = sanitize_text_field($input['watermark_text']);
        $sanitized['watermark_opacity'] = min(100, max(0, intval($input['watermark_opacity']));
        $sanitized['watermark_font_size'] = min(72, max(8, intval($input['watermark_font_size'])));
        
        // CDN settings
        $sanitized['cdn_enabled'] = isset($input['cdn_enabled']) ? 1 : 0;
        $sanitized['cdn_url'] = esc_url_raw($input['cdn_url'], array('http', 'https'));
        
        // Tools settings
        $sanitized['broken_image_fix'] = isset($input['broken_image_fix']) ? 1 : 0;
        $sanitized['enable_logs'] = isset($input['enable_logs']) ? 1 : 0;
        $sanitized['show_stats'] = isset($input['show_stats']) ? 1 : 0;
        
        return $sanitized;
    }

    public function render_admin_page() {
        // Check requirements
        $requirements = $this->check_requirements();
        $total_images = $this->get_total_images();
        $optimized_images = $this->get_optimized_images_count();
        $savings = $this->get_total_savings();
        ?>
        <div class="wrap ifp-admin">
            <h1><i class="dashicons dashicons-format-gallery"></i> <?php esc_html_e('Image Fix Pro', 'image-fix-pro'); ?></h1>
            
            <?php if (!empty($requirements)): ?>
                <div class="notice notice-error">
                    <p><?php esc_html_e('Your server has some missing requirements:', 'image-fix-pro'); ?></p>
                    <ul>
                        <?php foreach ($requirements as $requirement): ?>
                            <li><?php echo esc_html($requirement); ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php endif; ?>
            
            <div class="ifp-header">
                <div class="ifp-header-stats">
                    <div class="ifp-stat-card">
                        <h3><?php esc_html_e('Images Optimized', 'image-fix-pro'); ?></h3>
                        <p><?php echo number_format($optimized_images); ?>/<?php echo number_format($total_images); ?></p>
                    </div>
                    <div class="ifp-stat-card">
                        <h3><?php esc_html_e('Total Savings', 'image-fix-pro'); ?></h3>
                        <p><?php echo size_format($savings, 2); ?></p>
                    </div>
                    <div class="ifp-stat-card">
                        <h3><?php esc_html_e('WebP Images', 'image-fix-pro'); ?></h3>
                        <p><?php echo number_format($this->get_webp_images_count()); ?></p>
                    </div>
                </div>
                
                <div class="ifp-actions">
                    <button class="button button-primary ifp-bulk-action" data-action="optimize">
                        <i class="dashicons dashicons-update"></i> <?php esc_html_e('Bulk Optimize', 'image-fix-pro'); ?>
                    </button>
                    <button class="button ifp-bulk-action" data-action="restore">
                        <i class="dashicons dashicons-backup"></i> <?php esc_html_e('Restore Originals', 'image-fix-pro'); ?>
                    </button>
                    <button class="button ifp-bulk-action" data-action="convert-webp">
                        <i class="dashicons dashicons-format-image"></i> <?php esc_html_e('Convert to WebP', 'image-fix-pro'); ?>
                    </button>
                </div>
            </div>
            
            <div class="ifp-tabs">
                <nav class="nav-tab-wrapper">
                    <a href="#settings" class="nav-tab nav-tab-active"><?php esc_html_e('Settings', 'image-fix-pro'); ?></a>
                    <a href="#bulk-optimization" class="nav-tab"><?php esc_html_e('Bulk Optimization', 'image-fix-pro'); ?></a>
                    <a href="#statistics" class="nav-tab"><?php esc_html_e('Statistics', 'image-fix-pro'); ?></a>
                    <a href="#tools" class="nav-tab"><?php esc_html_e('Tools', 'image-fix-pro'); ?></a>
                </nav>
                
                <div id="settings" class="ifp-tab-content active">
                    <form method="post" action="options.php">
                        <?php
                        settings_fields('ifp_settings_group');
                        do_settings_sections('image-fix-pro');
                        wp_nonce_field('ifp_save_settings', 'ifp_settings_nonce');
                        submit_button();
                        ?>
                    </form>
                </div>
                
                <div id="bulk-optimization" class="ifp-tab-content">
                    <div class="ifp-bulk-optimization">
                        <div class="ifp-bulk-progress">
                            <h3><?php esc_html_e('Bulk Optimization', 'image-fix-pro'); ?></h3>
                            <div class="ifp-progress-bar">
                                <div class="ifp-progress" style="width: 0%"></div>
                            </div>
                            <p class="ifp-progress-text"><?php esc_html_e('Ready to start optimization...', 'image-fix-pro'); ?></p>
                            <p class="ifp-savings"><?php esc_html_e('Estimated savings: --', 'image-fix-pro'); ?></p>
                            <button class="button button-primary ifp-start-bulk" data-type="optimize"><?php esc_html_e('Start Optimization', 'image-fix-pro'); ?></button>
                            <button class="button ifp-pause" style="display:none"><?php esc_html_e('Pause', 'image-fix-pro'); ?></button>
                        </div>
                        
                        <div class="ifp-bulk-options">
                            <h3><?php esc_html_e('Optimization Options', 'image-fix-pro'); ?></h3>
                            <p>
                                <label>
                                    <input type="checkbox" id="ifp-bulk-backup" <?php checked($this->settings['backup_images'], 1); ?>> 
                                    <?php esc_html_e('Backup original images', 'image-fix-pro'); ?>
                                </label>
                            </p>
                            <p>
                                <label>
                                    <input type="checkbox" id="ifp-bulk-webp" <?php checked($this->settings['convert_webp'], 1); ?>> 
                                    <?php esc_html_e('Convert to WebP format', 'image-fix-pro'); ?>
                                </label>
                            </p>
                            <p>
                                <label>
                                    <input type="checkbox" id="ifp-bulk-watermark" <?php checked($this->settings['watermark'], 1); ?>> 
                                    <?php esc_html_e('Add watermark to images', 'image-fix-pro'); ?>
                                </label>
                            </p>
                        </div>
                    </div>
                </div>
                
                <div id="statistics" class="ifp-tab-content">
                    <div class="ifp-stats-container">
                        <div class="ifp-stats-chart">
                            <canvas id="ifpSavingsChart" width="400" height="200"></canvas>
                        </div>
                        <div class="ifp-stats-summary">
                            <h3><?php esc_html_e('Optimization Summary', 'image-fix-pro'); ?></h3>
                            <ul>
                                <li><?php printf(esc_html__('Total images optimized: %s', 'image-fix-pro'), number_format($optimized_images)); ?></li>
                                <li><?php printf(esc_html__('Total space saved: %s', 'image-fix-pro'), size_format($savings, 2)); ?></li>
                                <li><?php printf(esc_html__('WebP conversions: %s', 'image-fix-pro'), number_format($this->get_webp_images_count())); ?></li>
                                <li><?php printf(esc_html__('Watermarked images: %s', 'image-fix-pro'), number_format($this->get_watermarked_images_count())); ?></li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="ifp-top-savings">
                        <h3><?php esc_html_e('Top Savings', 'image-fix-pro'); ?></h3>
                        <table class="wp-list-table widefat fixed striped">
                            <thead>
                                <tr>
                                    <th><?php esc_html_e('Image', 'image-fix-pro'); ?></th>
                                    <th><?php esc_html_e('Original Size', 'image-fix-pro'); ?></th>
                                    <th><?php esc_html_e('Optimized Size', 'image-fix-pro'); ?></th>
                                    <th><?php esc_html_e('Savings', 'image-fix-pro'); ?></th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($this->get_top_savings(5) as $image): ?>
                                <tr>
                                    <td><a href="<?php echo esc_url(get_edit_post_link($image->ID)); ?>"><?php echo esc_html(basename(get_attached_file($image->ID))); ?></a></td>
                                    <td><?php echo size_format($image->original_size, 2); ?></td>
                                    <td><?php echo size_format($image->optimized_size, 2); ?></td>
                                    <td><?php echo number_format(($image->original_size - $image->optimized_size) / $image->original_size * 100, 1); ?>%</td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div id="tools" class="ifp-tab-content">
                    <div class="ifp-tools-grid">
                        <div class="ifp-tool-card">
                            <div class="ifp-tool-icon"><span class="dashicons dashicons-search"></span></div>
                            <h3><?php esc_html_e('Broken Image Scanner', 'image-fix-pro'); ?></h3>
                            <p><?php esc_html_e('Scan your site for broken images and fix them automatically', 'image-fix-pro'); ?></p>
                            <button class="button ifp-tool-action" data-action="scan-broken"><?php esc_html_e('Run Scanner', 'image-fix-pro'); ?></button>
                        </div>
                        
                        <div class="ifp-tool-card">
                            <div class="ifp-tool-icon"><span class="dashicons dashicons-update"></span></div>
                            <h3><?php esc_html_e('Bulk Converter', 'image-fix-pro'); ?></h3>
                            <p><?php esc_html_e('Convert all images to WebP format with fallback support', 'image-fix-pro'); ?></p>
                            <button class="button ifp-tool-action" data-action="convert-webp"><?php esc_html_e('Convert Now', 'image-fix-pro'); ?></button>
                        </div>
                        
                        <div class="ifp-tool-card">
                            <div class="ifp-tool-icon"><span class="dashicons dashicons-edit"></span></div>
                            <h3><?php esc_html_e('Alt Text Generator', 'image-fix-pro'); ?></h3>
                            <p><?php esc_html_e('Generate alt text for all images missing descriptions', 'image-fix-pro'); ?></p>
                            <button class="button ifp-tool-action" data-action="generate-alt"><?php esc_html_e('Generate Alt Text', 'image-fix-pro'); ?></button>
                        </div>
                        
                        <div class="ifp-tool-card">
                            <div class="ifp-tool-icon"><span class="dashicons dashicons-backup"></span></div>
                            <h3><?php esc_html_e('Restore Originals', 'image-fix-pro'); ?></h3>
                            <p><?php esc_html_e('Restore original images from backup', 'image-fix-pro'); ?></p>
                            <button class="button ifp-tool-action" data-action="restore"><?php esc_html_e('Restore Images', 'image-fix-pro'); ?></button>
                        </div>
                    </div>
                    
                    <div class="ifp-system-info">
                        <h3><?php esc_html_e('System Information', 'image-fix-pro'); ?></h3>
                        <table class="widefat">
                            <tr>
                                <th><?php esc_html_e('Image Processing Library', 'image-fix-pro'); ?></th>
                                <td>
                                    <?php 
                                    if ($this->settings['use_imagick'] && extension_loaded('imagick')) {
                                        $imagick = new Imagick();
                                        echo 'Imagick v' . $imagick->getVersion()['versionString'];
                                    } elseif (extension_loaded('gd')) {
                                        echo 'GD Library v' . gd_info()['GD Version'];
                                    } else {
                                        echo '<span class="ifp-error">' . esc_html__('No image library found!', 'image-fix-pro') . '</span>';
                                    }
                                    ?>
                                </td>
                            </tr>
                            <tr>
                                <th><?php esc_html_e('WebP Support', 'image-fix-pro'); ?></th>
                                <td>
                                    <?php 
                                    if (function_exists('imagewebp')) {
                                        esc_html_e('Enabled', 'image-fix-pro');
                                    } else {
                                        echo '<span class="ifp-error">' . esc_html__('Not supported', 'image-fix-pro') . '</span>';
                                    }
                                    ?>
                                </td>
                            </tr>
                            <tr>
                                <th><?php esc_html_e('Available Disk Space', 'image-fix-pro'); ?></th>
                                <td><?php echo size_format(disk_free_space(ABSPATH), 2); ?></td>
                            </tr>
                            <tr>
                                <th><?php esc_html_e('Image Backup Location', 'image-fix-pro'); ?></th>
                                <td><?php echo esc_html($this->backup_dir); ?></td>
                            </tr>
                            <tr>
                                <th><?php esc_html_e('Log File', 'image-fix-pro'); ?></th>
                                <td><?php echo esc_html($this->log_file); ?></td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="ifp-sidebar">
                <div class="ifp-premium-box">
                    <h3><i class="dashicons dashicons-star-filled"></i> <?php esc_html_e('Image Fix Pro Premium', 'image-fix-pro'); ?></h3>
                    <ul>
                        <li><?php esc_html_e('Unlimited bulk optimization', 'image-fix-pro'); ?></li>
                        <li><?php esc_html_e('AI-powered alt text generation', 'image-fix-pro'); ?></li>
                        <li><?php esc_html_e('Advanced CDN integration', 'image-fix-pro'); ?></li>
                        <li><?php esc_html_e('Priority support', 'image-fix-pro'); ?></li>
                    </ul>
                    <a href="#" class="button button-primary"><?php esc_html_e('Upgrade Now', 'image-fix-pro'); ?></a>
                </div>
                
                <div class="ifp-support-box">
                    <h3><?php esc_html_e('Need Help?', 'image-fix-pro'); ?></h3>
                    <p><?php esc_html_e('Check out our documentation or contact support', 'image-fix-pro'); ?></p>
                    <p>
                        <a href="#" class="button"><i class="dashicons dashicons-book"></i> <?php esc_html_e('Documentation', 'image-fix-pro'); ?></a>
                        <a href="#" class="button"><i class="dashicons dashicons-email"></i> <?php esc_html_e('Contact', 'image-fix-pro'); ?></a>
                    </p>
                </div>
            </div>
        </div>
        <?php
    }

    // Render settings sections and fields
    public function render_optimization_section() {
        echo '<p>' . esc_html__('Configure how images are optimized during upload and processing.', 'image-fix-pro') . '</p>';
    }

    public function render_enabled_field() {
        $enabled = $this->settings['enabled'] ?? 1;
        ?>
        <label class="ifp-toggle">
            <input type="checkbox" name="ifp_settings[enabled]" value="1" <?php checked($enabled, 1); ?>>
            <span class="ifp-toggle-slider"></span>
        </label>
        <p class="description"><?php esc_html_e('Enable or disable image optimization', 'image-fix-pro'); ?></p>
        <?php
    }

    public function render_optimization_level_field() {
        $level = $this->settings['optimization_level'] ?? 'balanced';
        ?>
        <select name="ifp_settings[optimization_level]">
            <option value="low" <?php selected($level, 'low'); ?>><?php esc_html_e('Low (Minimal compression)', 'image-fix-pro'); ?></option>
            <option value="balanced" <?php selected($level, 'balanced'); ?>><?php esc_html_e('Balanced (Recommended)', 'image-fix-pro'); ?></option>
            <option value="high" <?php selected($level, 'high'); ?>><?php esc_html_e('High (Aggressive compression)', 'image-fix-pro'); ?></option>
        </select>
        <p class="description"><?php esc_html_e('Adjust the compression level based on your quality needs.', 'image-fix-pro'); ?></p>
        <?php
    }

    public function render_convert_webp_field() {
        $convert_webp = $this->settings['convert_webp'] ?? 1;
        ?>
        <label class="ifp-toggle">
            <input type="checkbox" name="ifp_settings[convert_webp]" value="1" <?php checked($convert_webp, 1); ?>>
            <span class="ifp-toggle-slider"></span>
        </label>
        <p class="description"><?php esc_html_e('Automatically create WebP versions of images for better performance.', 'image-fix-pro'); ?></p>
        <?php
    }

    // Other render methods would be implemented similarly...

    public function add_settings_link($links) {
        $settings_link = '<a href="admin.php?page=image-fix-pro">' . __('Settings', 'image-fix-pro') . '</a>';
        array_unshift($links, $settings_link);
        return $links;
    }

    // Media library integration methods
    public function add_media_columns($columns) {
        $columns['ifp_optimized'] = __('Optimized', 'image-fix-pro');
        $columns['ifp_savings'] = __('Savings', 'image-fix-pro');
        return $columns;
    }

    public function manage_media_custom_column($column_name, $id) {
        if ($column_name === 'ifp_optimized') {
            $optimized = get_post_meta($id, '_ifp_optimized', true);
            echo $optimized ? '<span class="dashicons dashicons-yes-alt" style="color:#46b450;"></span>' : '<span class="dashicons dashicons-no-alt" style="color:#dc3232;"></span>';
        }
        
        if ($column_name === 'ifp_savings') {
            $original_size = get_post_meta($id, '_ifp_original_size', true);
            $optimized_size = get_post_meta($id, '_ifp_optimized_size', true);
            
            if ($original_size && $optimized_size) {
                $savings = round((($original_size - $optimized_size) / $original_size) * 100);
                echo esc_html($savings) . '%';
            } else {
                echo '—';
            }
        }
    }

    // Image optimization methods
    public function optimize_uploaded_image($file) {
        if (!$this->settings['enabled'] || !$this->is_image($file['type'])) {
            return $file;
        }

        try {
            // Create backup if enabled
            if ($this->settings['backup_images']) {
                $this->create_backup($file['file']);
            }

            // Perform optimization
            $optimizer = new IFP_Image_Optimizer($file['file'], $this->settings);
            $result = $optimizer->optimize();

            if ($result['success']) {
                $file['file'] = $result['path'];
                $file['size'] = filesize($result['path']);
                
                // Store optimization stats
                update_post_meta($file['post_id'], '_ifp_optimized', true);
                update_post_meta($file['post_id'], '_ifp_original_size', $result['original_size']);
                update_post_meta($file['post_id'], '_ifp_optimized_size', $result['optimized_size']);
            }

        } catch (Exception $e) {
            $this->log_error('Optimization failed: ' . $e->getMessage());
        }

        return $file;
    }

    public function optimize_existing_image($attachment_id) {
        if (!$this->settings['enabled']) {
            return;
        }

        $file = get_attached_file($attachment_id);
        
        if (!$file || !file_exists($file) || !$this->is_image(mime_content_type($file))) {
            return;
        }

        try {
            // Create backup if enabled
            if ($this->settings['backup_images']) {
                $this->create_backup($file);
            }

            // Perform optimization
            $optimizer = new IFP_Image_Optimizer($file, $this->settings);
            $result = $optimizer->optimize();

            if ($result['success']) {
                // Update attachment metadata
                update_attached_file($attachment_id, $result['path']);
                
                // Store optimization stats
                update_post_meta($attachment_id, '_ifp_optimized', true);
                update_post_meta($attachment_id, '_ifp_original_size', $result['original_size']);
                update_post_meta($attachment_id, '_ifp_optimized_size', $result['optimized_size']);
            }

        } catch (Exception $e) {
            $this->log_error('Optimization failed: ' . $e->getMessage());
        }
    }

    // Front-end enhancements
    public function content_image_enhancements($content) {
        if (!$this->settings['enabled']) {
            return $content;
        }

        // Lazy loading implementation
        if ($this->settings['lazy_loading']) {
            $content = preg_replace_callback('/<img([^>]+?)>/i', function($matches) {
                $img = $matches[0];
                if (strpos($img, 'loading=') === false) {
                    $img = str_replace('<img', '<img loading="lazy"', $img);
                }
                return $img;
            }, $content);
        }

        return $content;
    }

    public function thumbnail_enhancements($html, $post_id, $post_thumbnail_id, $size, $attr) {
        if (!$this->settings['enabled']) {
            return $html;
        }

        // Lazy loading for thumbnails
        if ($this->settings['lazy_loading'] && strpos($html, 'loading=') === false) {
            $html = str_replace('<img', '<img loading="lazy"', $html);
        }

        return $html;
    }

    // Notification system
    public function ifp_notify_admin($message, $type = 'success', $persistent = false) {
        $notifications = get_option('ifp_notifications', array());
        $notifications[] = array(
            'message' => $message,
            'type' => $type,
            'persistent' => $persistent
        );
        update_option('ifp_notifications', $notifications);
    }

    public function ifp_display_notifications() {
        $notifications = get_option('ifp_notifications', array());
        foreach ($notifications as $key => $notification) {
            $classes = array(
                'notice',
                'notice-' . esc_attr($notification['type']),
                'ifp-notice'
            );
            
            if ($notification['persistent']) {
                $classes[] = 'is-dismissible';
                $classes[] = 'ifp-persistent-notice';
            }
            ?>
            <div class="<?php echo implode(' ', $classes); ?>" data-notice-key="<?php echo $key; ?>">
                <p><?php echo esc_html($notification['message']); ?></p>
            </div>
            <?php
        }
        
        // Only clear non-persistent notices
        $persistent_notices = array_filter($notifications, function($notice) {
            return $notice['persistent'];
        });
        
        update_option('ifp_notifications', $persistent_notices);
    }

    public function ifp_donate_notification() {
        $installed_time = get_option('ifp_install_time', time());
        $dismissed = get_option('ifp_donate_notification_dismissed', false);
        
        // Show after 30 days if not dismissed
        if (!$dismissed && (time() - $installed_time) > 30 * DAY_IN_SECONDS) {
            $this->ifp_notify_admin(
                __('Enjoying Image Fix Pro? Please consider donating to support continued development!', 'image-fix-pro'),
                'info',
                true
            );
        }
    }

    // AJAX handlers
    public function ajax_bulk_optimize() {
        check_ajax_referer('ifp_nonce', 'nonce');
        
        if (!current_user_can('upload_files')) {
            wp_send_json_error(__('Permission denied', 'image-fix-pro'));
        }
        
        $page = isset($_POST['page']) ? absint($_POST['page']) : 1;
        $per_page = 5;
        
        $args = array(
            'post_type' => 'attachment',
            'post_mime_type' => array('image/jpeg', 'image/png', 'image/gif'),
            'post_status' => 'inherit',
            'posts_per_page' => $per_page,
            'paged' => $page,
            'meta_query' => array(
                array(
                    'key' => '_ifp_optimized',
                    'compare' => 'NOT EXISTS'
                )
            )
        );
        
        $query = new WP_Query($args);
        $processed = 0;
        $savings = 0;
        
        foreach ($query->posts as $attachment) {
            $file = get_attached_file($attachment->ID);
            $optimizer = new IFP_Image_Optimizer($file, $this->settings);
            $result = $optimizer->optimize();
            
            if ($result['success']) {
                $processed++;
                $savings += $result['savings'];
                
                // Update attachment metadata
                update_attached_file($attachment->ID, $result['path']);
                update_post_meta($attachment->ID, '_ifp_optimized', true);
                update_post_meta($attachment->ID, '_ifp_original_size', $result['original_size']);
                update_post_meta($attachment->ID, '_ifp_optimized_size', $result['optimized_size']);
            }
        }
        
        wp_send_json_success(array(
            'processed' => $processed,
            'savings' => size_format($savings, 2),
            'total' => $query->found_posts,
            'page' => $page,
            'completed' => ($page * $per_page) >= $query->found_posts
        ));
    }
    
    public function ajax_dismiss_notice() {
        check_ajax_referer('ifp_nonce', 'nonce');
        
        if (isset($_POST['notice_type'])) {
            $notice_type = sanitize_key($_POST['notice_type']);
            update_option('ifp_' . $notice_type . '_notification_dismissed', true);
            wp_send_json_success();
        }
        
        wp_send_json_error();
    }

    // Utility methods
    private function create_backup_dir() {
        if (!file_exists($this->backup_dir)) {
            wp_mkdir_p($this->backup_dir);
            file_put_contents(trailingslashit($this->backup_dir) . '.htaccess', "deny from all");
        }
    }

    private function create_backup($file_path) {
        $backup_path = $this->backup_dir . basename($file_path);
        if (!file_exists($backup_path)) {
            copy($file_path, $backup_path);
        }
    }

    private function log_error($message) {
        if ($this->settings['enable_logs'])) {
            $log_entry = '[' . date('Y-m-d H:i:s') . '] ' . $message . PHP_EOL;
            file_put_contents($this->log_file, $log_entry, FILE_APPEND);
        }
    }

    private function check_requirements() {
        $errors = array();
        
        // Check GD Library
        if (!extension_loaded('gd') && !extension_loaded('imagick')) {
            $errors[] = __('GD Library or Imagick is required but not installed', 'image-fix-pro');
        }
        
        // Check WebP support
        if ($this->settings['convert_webp'] && !function_exists('imagewebp')) {
            $errors[] = __('WebP conversion enabled but PHP lacks WebP support', 'image-fix-pro');
        }
        
        // Check writable backups directory
        if ($this->settings['backup_images'] && !is_writable($this->backup_dir)) {
            $errors[] = __('Backups directory is not writable', 'image-fix-pro');
        }
        
        return $errors;
    }
    
    private function get_total_images() {
        global $wpdb;
        return $wpdb->get_var("SELECT COUNT(*) FROM $wpdb->posts WHERE post_type = 'attachment' AND post_mime_type LIKE 'image/%'");
    }
    
    private function get_optimized_images_count() {
        global $wpdb;
        return $wpdb->get_var("SELECT COUNT(*) FROM $wpdb->postmeta WHERE meta_key = '_ifp_optimized' AND meta_value = '1'");
    }
    
    private function get_total_savings() {
        global $wpdb;
        return $wpdb->get_var("SELECT SUM(original_size - optimized_size) FROM (
            SELECT CAST(meta_value AS UNSIGNED) AS original_size FROM $wpdb->postmeta WHERE meta_key = '_ifp_original_size'
        ) orig JOIN (
            SELECT CAST(meta_value AS UNSIGNED) AS optimized_size FROM $wpdb->postmeta WHERE meta_key = '_ifp_optimized_size'
        ) opt ON orig.meta_id = opt.meta_id");
    }
    
    private function get_top_savings($limit = 5) {
        global $wpdb;
        return $wpdb->get_results(
            "SELECT p.ID, pm1.meta_value AS original_size, pm2.meta_value AS optimized_size 
             FROM $wpdb->posts p
             INNER JOIN $wpdb->postmeta pm1 ON p.ID = pm1.post_id AND pm1.meta_key = '_ifp_original_size'
             INNER JOIN $wpdb->postmeta pm2 ON p.ID = pm2.post_id AND pm2.meta_key = '_ifp_optimized_size'
             ORDER BY (pm1.meta_value - pm2.meta_value) DESC
             LIMIT $limit"
        );
    }
}

class IFP_Image_Optimizer {
    private $file;
    private $settings;
    
    public function __construct($file, $settings) {
        $this->file = $file;
        $this->settings = $settings;
    }
    
    public function optimize() {
        $mime_type = mime_content_type($this->file);
        $original_size = filesize($this->file);
        
        switch ($mime_type) {
            case 'image/jpeg':
                $result = $this->optimize_jpeg();
                break;
            case 'image/png':
                $result = $this->optimize_png();
                break;
            case 'image/gif':
                $result = $this->optimize_gif();
                break;
            default:
                throw new Exception("Unsupported image type: $mime_type");
        }
        
        $optimized_size = filesize($this->file);
        $result['original_size'] = $original_size;
        $result['optimized_size'] = $optimized_size;
        $result['savings'] = $original_size - $optimized_size;
        
        return $result;
    }
    
    private function optimize_jpeg() {
        $quality = 82; // Default for balanced mode
        
        if ($this->settings['optimization_level'] === 'low') {
            $quality = 90;
        } elseif ($this->settings['optimization_level'] === 'high') {
            $quality = 75;
        }
        
        if ($this->settings['use_imagick'] && extension_loaded('imagick')) {
            $image = new Imagick($this->file);
            $image->setImageCompression(Imagick::COMPRESSION_JPEG);
            $image->setImageCompressionQuality($quality);
            
            if (!$this->settings['preserve_exif']) {
                $image->stripImage();
            }
            
            $image->writeImage($this->file);
            $image->clear();
        } else {
            $image = imagecreatefromjpeg($this->file);
            imagejpeg($image, $this->file, $quality);
            imagedestroy($image);
        }
        
        return array('success' => true);
    }
    
    private function optimize_png() {
        if ($this->settings['use_imagick'] && extension_loaded('imagick')) {
            $image = new Imagick($this->file);
            $image->setImageFormat('png');
            
            // Set compression level (1 = lowest, 9 = highest)
            $compression = 6; // Balanced
            if ($this->settings['optimization_level'] === 'low') {
                $compression = 3;
            } elseif ($this->settings['optimization_level'] === 'high') {
                $compression = 9;
            }
            
            $image->setImageCompressionQuality(90); // Doesn't affect PNG, but included for completeness
            $image->setOption('png:compression-level', $compression);
            
            if (!$this->settings['preserve_exif']) {
                $image->stripImage();
            }
            
            $image->writeImage($this->file);
            $image->clear();
        } else {
            $image = imagecreatefrompng($this->file);
            imagepalettetotruecolor($image);
            imagealphablending($image, true);
            imagesavealpha($image, true);
            imagepng($image, $this->file, 6); // Compression level 6 (balanced)
            imagedestroy($image);
        }
        
        return array('success' => true);
    }
    
    private function optimize_gif() {
        // GIF optimization is more limited
        if ($this->settings['use_imagick'] && extension_loaded('imagick')) {
            $image = new Imagick($this->file);
            $image->setImageFormat('gif');
            
            if (!$this->settings['preserve_exif']) {
                $image->stripImage();
            }
            
            $image->writeImage($this->file);
            $image->clear();
        } else {
            // For GD, we just copy as is since GD doesn't support GIF optimization well
            copy($this->file, $this->file);
        }
        
        return array('success' => true);
    }
}

// Initialize the plugin
new Image_Fix_Pro();
