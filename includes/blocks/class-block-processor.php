<?php
/**
 * Block Processor
 *
 * Handles processing of Universal Blocks including dynamic tag parsing and Twig compilation.
 *
 * @package UniversalBlock
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Universal_Block_Processor {

	/**
	 * Process a single block through the render pipeline
	 *
	 * @param string $block_content The block content HTML
	 * @param array  $block         The block data
	 * @return string Processed block content
	 */
	public static function process_block( $block_content, $block ) {
		// Only process our universal/element blocks
		if ( $block['blockName'] !== 'universal/element' ) {
			return $block_content;
		}

		// DON'T process DSL or Twig at block level - let the_content filter handle it
		// This ensures all blocks are rendered first, then DSL is parsed, then Twig is compiled
		return $block_content;
	}

	/**
	 * Compile Twig syntax to HTML
	 *
	 * @param string $content The content with Twig syntax
	 * @param array  $context The Timber context
	 * @return string Compiled HTML
	 */
	private static function compile_twig( $content, $context ) {
		try {
			// Compile Twig directly without any decoding
			$compiled = \Timber\Timber::compile_string( $content, $context );

			return $compiled;
		} catch ( Exception $e ) {
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				error_log( 'Universal Block Timber compilation error: ' . $e->getMessage() );
				return '<!-- Timber Error: ' . $e->getMessage() . ' -->' . $content;
			}
			return $content;
		}
	}

	/**
	 * Process the_content for classic themes
	 *
	 * @param string $content The post content
	 * @return string Processed content
	 */
	public static function process_content( $content ) {
		// Only process if Timber is available
		if ( ! class_exists( '\Timber\Timber' ) ) {
			return $content;
		}

		// DEBUG FLAGS
		$skip_process = isset( $_GET['process'] ) && $_GET['process'] === 'false';
		$skip_twig = isset( $_GET['twig'] ) && $_GET['twig'] === 'false';

		// Get Timber context
		$context = \Timber\Timber::context();

		// Decode HTML entities first (WordPress encodes & to &amp; in URLs)
		$content = html_entity_decode( $content, ENT_QUOTES | ENT_HTML5 );

		// Convert WordPress curly quotes back to straight quotes for Twig
		// WordPress wptexturize converts ' to U+2018/U+2019 and " to U+201C/U+201D
		// Use chr() for PHP 5.x compatibility
		$content = str_replace(
			array(
				chr(226) . chr(128) . chr(152), // U+2018 left single quote
				chr(226) . chr(128) . chr(153), // U+2019 right single quote
				chr(226) . chr(128) . chr(156), // U+201C left double quote
				chr(226) . chr(128) . chr(157), // U+201D right double quote
			),
			array( "'", "'", '"', '"' ),
			$content
		);

		// DSL parsing is no longer needed - DSL blocks now render pure Twig at render time

		// Only compile if content has Twig syntax
		$has_twig = preg_match( '/\{[{%].*?[}%]\}/', $content );

		// Compile Twig syntax with context (unless twig=false)
		if ( $has_twig && ! $skip_twig ) {
			try {
				// Debug: log a snippet of content being compiled
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG && strpos( $content, 'timber.get_posts' ) !== false ) {
					$snippet = substr( $content, strpos( $content, 'timber.get_posts' ) - 20, 100 );
					error_log( 'Compiling Twig with snippet: ' . $snippet );
				}

				$compiled = \Timber\Timber::compile_string( $content, $context );
				return $compiled;
			} catch ( Exception $e ) {
				$error_msg = 'Universal Block Timber compilation error: ' . $e->getMessage();
				error_log( $error_msg );

				// Show error in HTML if WP_DEBUG is on
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					return '<!-- ' . esc_html( $error_msg ) . ' -->' . $content;
				}

				return $content;
			}
		}

		return $content;
	}
}
