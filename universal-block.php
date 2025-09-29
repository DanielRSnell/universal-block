<?php
/**
 * Plugin Name:       Universal Block
 * Description:       A designless polymorphic block that can be any HTML element.
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Version:           0.2.0
 * Author:            Your Name
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       universal-block
 * Domain Path:       /languages
 *
 * @package           universal-block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

// Load Composer dependencies.
require_once __DIR__ . '/vendor/autoload.php';

// Initialize Timber.
if ( ! class_exists( '\Timber\Timber' ) ) {
	\Timber\Timber::init();
}

define( 'UNIVERSAL_BLOCK_VERSION', '0.2.1' );
define( 'UNIVERSAL_BLOCK_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'UNIVERSAL_BLOCK_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * Registers the block using the metadata loaded from the `block.json` file.
 * Behind the scenes, it registers also all assets so they can be enqueued
 * through the block editor in the corresponding context.
 *
 * @see https://developer.wordpress.org/reference/functions/register_block_type/
 */
function universal_block_init() {
	register_block_type( __DIR__ . '/block.json' );
}
add_action( 'init', 'universal_block_init' );

/**
 * Load plugin text domain for translations.
 */
function universal_block_load_textdomain() {
	load_plugin_textdomain(
		'universal-block',
		false,
		dirname( plugin_basename( __FILE__ ) ) . '/languages'
	);
}
add_action( 'init', 'universal_block_load_textdomain' );

/**
 * Enqueue block assets for the editor.
 */
function universal_block_enqueue_block_editor_assets() {
	$asset_file = include( UNIVERSAL_BLOCK_PLUGIN_DIR . 'build/index.asset.php' );

	// Enqueue Ace Editor
	wp_enqueue_script(
		'ace-editor',
		UNIVERSAL_BLOCK_PLUGIN_URL . 'assets/global/ace/src-min-noconflict/ace.js',
		array(),
		UNIVERSAL_BLOCK_VERSION
	);

	// Enqueue HTML Beautifier
	wp_enqueue_script(
		'js-beautify-html',
		UNIVERSAL_BLOCK_PLUGIN_URL . 'assets/global/js-beautify/beautify-html.min.js',
		array(),
		UNIVERSAL_BLOCK_VERSION
	);

	// Enqueue Emmet
	wp_enqueue_script(
		'emmet-core',
		UNIVERSAL_BLOCK_PLUGIN_URL . 'assets/global/emmet-core/emmet.js',
		array(),
		UNIVERSAL_BLOCK_VERSION
	);

	wp_enqueue_script(
		'universal-block-editor',
		UNIVERSAL_BLOCK_PLUGIN_URL . 'build/index.js',
		array_merge( $asset_file['dependencies'], array( 'ace-editor', 'js-beautify-html', 'emmet-core' ) ),
		UNIVERSAL_BLOCK_VERSION
	);

	// Pass preview data to the editor
	wp_localize_script( 'universal-block-editor', 'ubPreviewData', array(
		'apiUrl' => rest_url( 'universal-block/v1/' ),
		'nonce' => wp_create_nonce( 'wp_rest' ),
		'pageData' => apply_filters( 'universal_block_page_data', array() ),
		'debugMode' => defined( 'WP_DEBUG' ) && WP_DEBUG
	) );

	if ( file_exists( UNIVERSAL_BLOCK_PLUGIN_DIR . 'build/index.css' ) ) {
		wp_enqueue_style(
			'universal-block-editor-style',
			UNIVERSAL_BLOCK_PLUGIN_URL . 'build/index.css',
			array(),
			UNIVERSAL_BLOCK_VERSION
		);
	}
}
add_action( 'enqueue_block_editor_assets', 'universal_block_enqueue_block_editor_assets' );

/**
 * Include additional functionality.
 */
require_once UNIVERSAL_BLOCK_PLUGIN_DIR . 'includes/blocks/class-universal-element.php';
require_once UNIVERSAL_BLOCK_PLUGIN_DIR . 'includes/admin/class-admin.php';
require_once UNIVERSAL_BLOCK_PLUGIN_DIR . 'includes/editor/class-editor-tweaks.php';
require_once UNIVERSAL_BLOCK_PLUGIN_DIR . 'includes/parser/class-dynamic-tag-parser.php';
require_once UNIVERSAL_BLOCK_PLUGIN_DIR . 'includes/parser/class-simple-twig-processor.php';
require_once UNIVERSAL_BLOCK_PLUGIN_DIR . 'includes/api/class-preview-api.php';

/**
 * Initialize editor tweaks.
 */
EditorTweaks::init();

/**
 * Process Twig and dynamic tags in content after blocks are rendered.
 * Priority 11 runs after do_blocks() at priority 9.
 */
add_filter( 'the_content', function( $content ) {
	// Only process if Timber is available
	if ( ! class_exists( '\Timber\Timber' ) ) {
		return $content;
	}

	// Debug output
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		$content = '<!-- DEBUG: the_content filter processing -->' . $content;
	}

	// Get Timber context
	$context = \Timber\Timber::context();

	// First, process dynamic tags if present (including set)
	if ( Universal_Block_Dynamic_Tag_Parser::has_dynamic_tags( $content ) ) {
		// Debug output
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			$content = '<!-- DEBUG: Found dynamic tags -->' . $content;
			// Log the raw content to see what we're working with
			error_log( 'Dynamic Tag Parser: Raw content before processing: ' . substr( $content, 0, 500 ) );
		}

		// Validate tag structure first
		$validation = Universal_Block_Dynamic_Tag_Parser::validate_structure( $content );

		if ( $validation['valid'] ) {
			// Parse dynamic tags to Twig syntax
			$content = Universal_Block_Dynamic_Tag_Parser::parse( $content );

			// Debug output after parsing
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				error_log( 'Dynamic Tag Parser: Content after parsing: ' . substr( $content, 0, 500 ) );
			}
		} else {
			// Show validation errors in development
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				$error_messages = implode( ', ', $validation['errors'] );
				$content = '<!-- Dynamic tag validation errors: ' . esc_html( $error_messages ) . ' -->' . $content;
			}
		}
	} else {
		// Debug output
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			$content = '<!-- DEBUG: No dynamic tags found -->' . $content;
		}
	}

	// Then, compile any Twig syntax (including from dynamic tags and raw Twig)
	if ( preg_match( '/\{\{.*?\}\}|\{%.*?%\}/', $content ) ) {
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			$content = '<!-- DEBUG: Found Twig syntax, compiling -->' . $content;
			error_log( 'Timber: About to compile content with length: ' . strlen( $content ) );
		}

		try {
			$content = \Timber\Timber::compile_string( $content, $context );

			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				error_log( 'Timber: Successfully compiled, result length: ' . strlen( $content ) );
			}
		} catch ( Exception $e ) {
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				error_log( 'Timber compilation error: ' . $e->getMessage() );
				$content = '<!-- Timber compilation error: ' . esc_html( $e->getMessage() ) . ' -->' . $content;
			}
		}
	}

	return $content;
}, 11 );