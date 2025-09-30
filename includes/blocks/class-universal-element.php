<?php
/**
 * Universal Element Block class.
 *
 * @package universal-block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Universal_Element {

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'init' ) );
	}

	/**
	 * Initialize the class.
	 */
	public function init() {
		add_filter( 'render_block_universal/element', array( $this, 'render_block' ), 10, 2 );
	}

	/**
	 * Render the Universal Element block.
	 *
	 * @param string $block_content The block content.
	 * @param array  $block         The block data.
	 * @return string The rendered block content.
	 */
	public function render_block( $block_content, $block ) {
		// The actual rendering is handled by the render callback in block.json
		// This method can be used for additional processing if needed
		return $block_content;
	}

	/**
	 * Get allowed HTML tags for the element type.
	 *
	 * @param string $element_type The element type.
	 * @return array Array of allowed tags.
	 */
	public static function get_allowed_tags( $element_type ) {
		$tag_map = array(
			'text'      => array( 'p', 'span', 'div' ),
			'heading'   => array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ),
			'link'      => array( 'a' ),
			'image'     => array( 'img' ),
			'rule'      => array( 'hr' ),
			'container' => array( 'div', 'section', 'article', 'main', 'aside', 'header', 'footer' ),
		);

		return $tag_map[ $element_type ] ?? array( 'div' );
	}

	/**
	 * Sanitize global attributes.
	 *
	 * @param array $attrs The attributes to sanitize.
	 * @return array The sanitized attributes.
	 */
	public static function sanitize_global_attrs( $attrs ) {
		if ( ! is_array( $attrs ) ) {
			return array();
		}

		$sanitized = array();
		$allowed_prefixes = array( 'data-', 'aria-' );
		$allowed_attrs = array( 'id', 'class', 'role', 'tabindex', 'title', 'style' );

		foreach ( $attrs as $name => $value ) {
			if ( empty( $name ) || empty( $value ) ) {
				continue;
			}

			// Sanitize attribute name
			$name = preg_replace( '/[^a-zA-Z0-9\-_]/', '', $name );

			// Check if attribute is allowed
			$is_allowed = in_array( $name, $allowed_attrs, true );

			if ( ! $is_allowed ) {
				foreach ( $allowed_prefixes as $prefix ) {
					if ( strpos( $name, $prefix ) === 0 ) {
						$is_allowed = true;
						break;
					}
				}
			}

			if ( $is_allowed ) {
				$sanitized[ $name ] = sanitize_text_field( $value );
			}
		}

		return $sanitized;
	}
}

new Universal_Element();