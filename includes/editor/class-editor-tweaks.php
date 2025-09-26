<?php
/**
 * Editor Tweaks - Customizations for the Gutenberg editor interface
 *
 * @package universal-block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class EditorTweaks
 *
 * Handles customizations and tweaks for the Gutenberg block editor interface.
 */
class EditorTweaks {

	/**
	 * Initialize the editor tweaks.
	 */
	public static function init() {
		add_action( 'enqueue_block_editor_assets', [ __CLASS__, 'enqueue_editor_assets' ] );
	}

	/**
	 * Enqueue editor-specific assets (CSS/JS).
	 */
	public static function enqueue_editor_assets() {
		$css_file = UNIVERSAL_BLOCK_PLUGIN_URL . 'assets/editor/editor-tweaks.css';
		$css_path = UNIVERSAL_BLOCK_PLUGIN_DIR . 'assets/editor/editor-tweaks.css';

		// Enqueue CSS if it exists
		if ( file_exists( $css_path ) ) {
			wp_enqueue_style(
				'universal-block-editor-tweaks',
				$css_file,
				[],
				UNIVERSAL_BLOCK_VERSION
			);
		}

		$js_file = UNIVERSAL_BLOCK_PLUGIN_URL . 'assets/editor/editor-tweaks.js';
		$js_path = UNIVERSAL_BLOCK_PLUGIN_DIR . 'assets/editor/editor-tweaks.js';

		// Enqueue JavaScript if it exists
		if ( file_exists( $js_path ) ) {
			wp_enqueue_script(
				'universal-block-editor-tweaks-js',
				$js_file,
				[ 'wp-blocks', 'wp-editor', 'wp-element', 'wp-dom-ready' ],
				UNIVERSAL_BLOCK_VERSION,
				true
			);
		}
	}

	/**
	 * Add custom sidebar to Gutenberg interface.
	 *
	 * This creates a 60px wide sidebar in the editor interface.
	 */
	public static function add_custom_sidebar() {
		// This will be implemented via CSS for now
		// Future: Could be enhanced with React components if needed
	}
}