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

/**
 * Initialize editor tweaks.
 */
EditorTweaks::init();