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
 * Remove the automatic wp-block-{name} class from universal/element blocks
 */
function universal_block_remove_default_class( $generated_class_name, $block_name ) {
	if ( 'universal/element' === $block_name ) {
		return '';
	}
	return $generated_class_name;
}
add_filter( 'block_default_classname', 'universal_block_remove_default_class', 10, 2 );

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

	// Enqueue HTML to Blocks Parser
	wp_enqueue_script(
		'universal-html2blocks',
		UNIVERSAL_BLOCK_PLUGIN_URL . 'lib/html2blocks.js',
		array(),
		UNIVERSAL_BLOCK_VERSION
	);

	// Enqueue Blocks to HTML Parser
	wp_enqueue_script(
		'universal-blocks2html',
		UNIVERSAL_BLOCK_PLUGIN_URL . 'lib/blocks2html.js',
		array(),
		UNIVERSAL_BLOCK_VERSION
	);

	wp_enqueue_script(
		'universal-block-editor',
		UNIVERSAL_BLOCK_PLUGIN_URL . 'build/index.js',
		array_merge( $asset_file['dependencies'], array( 'ace-editor', 'js-beautify-html', 'emmet-core', 'universal-html2blocks', 'universal-blocks2html' ) ),
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
require_once UNIVERSAL_BLOCK_PLUGIN_DIR . 'includes/admin/class-admin.php';
require_once UNIVERSAL_BLOCK_PLUGIN_DIR . 'includes/editor/class-editor-tweaks.php';
require_once UNIVERSAL_BLOCK_PLUGIN_DIR . 'includes/editor/class-preview-context.php';
require_once UNIVERSAL_BLOCK_PLUGIN_DIR . 'includes/parser/class-dynamic-tag-parser.php';
require_once UNIVERSAL_BLOCK_PLUGIN_DIR . 'includes/api/class-preview-api.php';
require_once UNIVERSAL_BLOCK_PLUGIN_DIR . 'includes/api/class-preview-settings-api.php';

/**
 * Initialize editor tweaks.
 */
EditorTweaks::init();

/**
 * Enqueue preview context to editor.
 */
add_action( 'enqueue_block_editor_assets', array( 'Universal_Block_Preview_Context', 'enqueue_preview_context' ) );

/**
 * Process Twig and dynamic tags in block output
 * This runs for each individual block as it's rendered
 */
add_filter( 'render_block', function( $block_content, $block ) {
	// Only process our universal/element blocks
	if ( $block['blockName'] !== 'universal/element' ) {
		return $block_content;
	}

	// Only process if Timber is available
	if ( ! class_exists( '\Timber\Timber' ) ) {
		return $block_content;
	}

	// Cache base context (runs once per request)
	static $base_context = null;
	if ( $base_context === null ) {
		$base_context = \Timber\Timber::context();
	}

	// Start with base context
	$context = $base_context;

	// If block has a specific context attribute, apply custom filters
	if ( ! empty( $block['attrs']['blockContext'] ) ) {
		$block_context_name = sanitize_key( $block['attrs']['blockContext'] );

		/**
		 * Filter the Timber context for a specific block context
		 *
		 * @param array $context The base Timber context
		 * @param array $block The block data
		 *
		 * Example usage in theme:
		 * add_filter('universal_block/context/product_gallery', function($context, $block) {
		 *     if (!is_product()) return $context;
		 *
		 *     global $product;
		 *     $context['product']['gallery'] = [...];
		 *
		 *     return $context;
		 * }, 10, 2);
		 */
		$context = apply_filters( "universal_block/context/{$block_context_name}", $context, $block );
	}

	// Process dynamic tags to Twig syntax
	if ( Universal_Block_Dynamic_Tag_Parser::has_dynamic_tags( $block_content ) ) {
		$block_content = Universal_Block_Dynamic_Tag_Parser::parse( $block_content );
	}

	// Compile Twig syntax with context
	try {
		return \Timber\Timber::compile_string( $block_content, $context );
	} catch ( Exception $e ) {
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( 'Universal Block Timber compilation error: ' . $e->getMessage() );
		}
		return $block_content;
	}
}, 10, 2 );

/**
 * Also process the_content for classic themes
 * Priority 11 runs after do_blocks() at priority 9.
 */
add_filter( 'the_content', function( $content ) {
	// Debug: Always mark that filter is running to verify it's being called
	$content = '<!-- UNIVERSAL BLOCK FILTER ACTIVE v2024-10-03-02:00 -->' . $content;

	// Only process if Timber is available
	if ( ! class_exists( '\Timber\Timber' ) ) {
		return '<!-- Timber not available -->' . $content;
	}

	// Debug: Mark content as processing
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		$content = '<!-- DEBUG: the_content filter processing -->' . $content;
	}

	// Get Timber context
	$context = \Timber\Timber::context();

	// Process dynamic tags to Twig syntax
	$has_tags = Universal_Block_Dynamic_Tag_Parser::has_dynamic_tags( $content );

	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		$content = '<!-- DEBUG: has_dynamic_tags = ' . ( $has_tags ? 'true' : 'false' ) . ' -->' . $content;
	}

	if ( $has_tags ) {
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			$content = '<!-- DEBUG: Parsing dynamic tags to Twig -->' . $content;
		}

		$content = Universal_Block_Dynamic_Tag_Parser::parse( $content );

		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			$content = '<!-- DEBUG: After parsing -->' . $content;
		}
	}

	// Compile Twig syntax with context
	try {
		$compiled = \Timber\Timber::compile_string( $content, $context );

		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			$compiled = '<!-- DEBUG: Twig compiled successfully -->' . $compiled;
		}

		return $compiled;
	} catch ( Exception $e ) {
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( 'Universal Block Timber compilation error: ' . $e->getMessage() );
			return '<!-- Timber compilation error: ' . esc_html( $e->getMessage() ) . ' -->' . $content;
		}

		return $content;
	}

	// Frontend debugging widget when ?debug=true
	if ( isset( $_GET['debug'] ) && $_GET['debug'] === 'true' ) {
		// Add context to itself for debugging
		$context['state'] = $context;

		// Remove post content to save space in debug widget
		if ( isset( $context['state']['post'] ) && isset( $context['state']['post']->content ) ) {
			$context['state']['post']->content = null;
		}

		// Add ACF fields if acf=true and ACF is available
		if ( isset( $_GET['acf'] ) && $_GET['acf'] === 'true' && function_exists( 'get_fields' ) ) {
			if ( isset( $context['state']['post'] ) && isset( $context['state']['post']->ID ) ) {
				$context['state']['post']->meta = get_fields( $context['state']['post']->ID );
			}
		}

		// Output context JSON and widget in footer
		add_action( 'wp_footer', function() use ( $context ) {
			// Output context as JSON in script tag
			?>
			<script id="context-debug" type="application/json">
<?php echo wp_json_encode( $context['state'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ); ?>
</script>

			<!-- Debug Widget HTML -->
			<div id="universal-block-debug-widget">
				<div class="debug-widget-header">
					<h3 class="debug-widget-title">🔍 Timber Context</h3>
					<div class="debug-widget-controls">
						<button class="debug-widget-btn" id="debug-widget-minimize" title="Minimize">−</button>
						<button class="debug-widget-btn" id="debug-widget-close" title="Close">×</button>
					</div>
				</div>
				<div class="debug-widget-content">
					<div id="debug-ace-editor"></div>
				</div>
			</div>

			<style>
				#universal-block-debug-widget {
					position: fixed;
					bottom: 20px;
					right: 20px;
					width: 400px;
					max-height: 600px;
					background: #1e1e1e;
					border: 1px solid #444;
					border-radius: 8px;
					box-shadow: 0 4px 12px rgba(0,0,0,0.5);
					z-index: 999999;
					display: flex;
					flex-direction: column;
					font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
				}
				#universal-block-debug-widget.minimized {
					width: auto;
					height: auto;
					max-height: none;
				}
				#universal-block-debug-widget.minimized .debug-widget-content {
					display: none;
				}
				.debug-widget-header {
					padding: 12px 16px;
					background: #2d2d2d;
					border-bottom: 1px solid #444;
					border-radius: 8px 8px 0 0;
					display: flex;
					justify-content: space-between;
					align-items: center;
					cursor: move;
					user-select: none;
				}
				.debug-widget-title {
					color: #fff;
					font-size: 14px;
					font-weight: 600;
					margin: 0;
				}
				.debug-widget-controls {
					display: flex;
					gap: 8px;
				}
				.debug-widget-btn {
					background: transparent;
					border: none;
					color: #999;
					cursor: pointer;
					padding: 4px;
					font-size: 16px;
					line-height: 1;
					transition: color 0.2s;
				}
				.debug-widget-btn:hover {
					color: #fff;
				}
				.debug-widget-content {
					flex: 1;
					overflow: hidden;
					display: flex;
					flex-direction: column;
				}
				#debug-ace-editor {
					flex: 1;
					min-height: 400px;
				}
			</style>

			<script src="<?php echo esc_url( plugin_dir_url( __FILE__ ) . 'assets/global/ace/src-min-noconflict/ace.js' ); ?>"></script>
			<script src="<?php echo esc_url( plugin_dir_url( __FILE__ ) . 'assets/debug-widget.js' ); ?>"></script>
			<?php
		}, 999 );
	}

	return $content;
}, 11 );