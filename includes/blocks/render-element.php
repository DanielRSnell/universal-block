<?php
/**
 * Server-side rendering for the Universal Element block.
 *
 * @param array  $attributes Block attributes.
 * @param string $content    Block inner content.
 * @param object $block      Block instance.
 * @return string Rendered block output.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Support both legacy elementType and new contentType for migration
$element_type = $attributes['elementType'] ?? null; // Legacy
$content_type = $attributes['contentType'] ?? 'text'; // New system
$tag_name = $attributes['tagName'] ?? 'p';
$block_content = $attributes['content'] ?? '';
$global_attrs = $attributes['globalAttrs'] ?? array();
$self_closing = $attributes['selfClosing'] ?? false;

// Legacy migration: convert elementType to contentType
if ( $element_type && ! isset( $attributes['contentType'] ) ) {
	$legacy_mapping = array(
		'text' => 'text',
		'heading' => 'text',
		'link' => 'text',
		'image' => 'empty',
		'rule' => 'empty',
		'svg' => 'html',
		'container' => 'blocks'
	);
	$content_type = $legacy_mapping[ $element_type ] ?? 'text';
}

// Expand allowed tags for the new flexible system
$allowed_tags = array(
	// Text elements
	'p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'b', 'i', 'u', 's',
	'mark', 'small', 'sub', 'sup', 'code', 'kbd', 'samp', 'var', 'q', 'cite', 'abbr', 'dfn', 'time', 'br',

	// Semantic elements
	'main', 'article', 'section', 'aside', 'header', 'footer', 'nav', 'div',
	'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'figure', 'figcaption', 'blockquote', 'pre', 'hr', 'address',
	'details', 'summary', 'data',

	// Interactive elements
	'a', 'button',

	// Media elements
	'img', 'video', 'audio', 'picture', 'source', 'track', 'embed', 'object', 'param', 'canvas', 'svg',
	'map', 'area',

	// Form elements
	'form', 'input', 'textarea', 'select', 'option', 'optgroup', 'label', 'fieldset', 'legend',
	'datalist', 'output', 'progress', 'meter',

	// Structural elements
	'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption', 'colgroup', 'col',
	'ruby', 'rb', 'rt', 'rp', 'template', 'slot',

	// Custom elements (allow any tag with hyphen for web components)
	'iframe', 'script', 'style', 'noscript', 'wbr'
);

// Allow custom elements (must contain hyphen for web components)
if ( ! in_array( $tag_name, $allowed_tags, true ) ) {
	if ( strpos( $tag_name, '-' ) !== false ) {
		// Valid custom element name - allow it
		$tag_name = preg_replace( '/[^a-zA-Z0-9\-]/', '', $tag_name );
	} else {
		// Invalid tag name - fallback to div
		$tag_name = 'div';
	}
}

// Build additional attributes array for WordPress wrapper
$additional_attrs = array();

// Element-specific attributes are now handled in the global attributes loop below
// This allows for easy manual override of any attribute

// Add global attributes
foreach ( $global_attrs as $attr_name => $attr_value ) {
	if ( empty( $attr_name ) || empty( $attr_value ) ) {
		continue;
	}

	// Sanitize attribute name (allow letters, numbers, hyphens, underscores)
	$attr_name = preg_replace( '/[^a-zA-Z0-9\-_]/', '', $attr_name );

	if ( $attr_name === 'class' ) {
		// Classes get special handling by WordPress
		$additional_attrs['class'] = esc_attr( $attr_value );
	} elseif ( $attr_name === 'id' ) {
		$additional_attrs['id'] = esc_attr( $attr_value );
	} elseif ( strpos( $attr_name, 'data-' ) === 0 || strpos( $attr_name, 'aria-' ) === 0 ) {
		$additional_attrs[ $attr_name ] = esc_attr( $attr_value );
	} elseif ( in_array( $attr_name, array( 'role', 'tabindex', 'title', 'style' ), true ) ) {
		$additional_attrs[ $attr_name ] = esc_attr( $attr_value );
	} elseif ( in_array( $attr_name, array( 'href', 'target', 'rel', 'src', 'alt', 'width', 'height', 'viewBox', 'xmlns', 'preserveAspectRatio', 'fill', 'stroke', 'stroke-width', 'opacity' ), true ) ) {
		// Element-specific attributes that are now stored in globalAttrs
		if ( $attr_name === 'href' || $attr_name === 'src' ) {
			$additional_attrs[ $attr_name ] = esc_url( $attr_value );
		} else {
			$additional_attrs[ $attr_name ] = esc_attr( $attr_value );
		}
	}
}

// Get WordPress block wrapper attributes (includes automatic classes)
$wrapper_attributes = get_block_wrapper_attributes( $additional_attrs );

// Determine what content to use based on contentType
$final_content = '';
switch ( $content_type ) {
	case 'blocks':
		// Use InnerBlocks content (passed as $content parameter)
		$final_content = $content;
		break;

	case 'text':
		// Use block content attribute with WordPress post sanitization
		$final_content = wp_kses_post( $block_content );
		break;

	case 'html':
		// Use block content attribute with minimal sanitization for HTML content
		// For SVG, we want to preserve the HTML structure
		if ( $tag_name === 'svg' ) {
			$final_content = wp_kses( $block_content, array(
				'path' => array( 'd' => true, 'fill' => true, 'stroke' => true, 'stroke-width' => true ),
				'circle' => array( 'cx' => true, 'cy' => true, 'r' => true, 'fill' => true, 'stroke' => true ),
				'rect' => array( 'x' => true, 'y' => true, 'width' => true, 'height' => true, 'fill' => true ),
				'line' => array( 'x1' => true, 'y1' => true, 'x2' => true, 'y2' => true, 'stroke' => true ),
				'polygon' => array( 'points' => true, 'fill' => true, 'stroke' => true ),
				'polyline' => array( 'points' => true, 'fill' => true, 'stroke' => true ),
				'ellipse' => array( 'cx' => true, 'cy' => true, 'rx' => true, 'ry' => true, 'fill' => true ),
				'text' => array( 'x' => true, 'y' => true, 'fill' => true, 'font-family' => true, 'font-size' => true ),
				'g' => array( 'transform' => true, 'fill' => true, 'stroke' => true ),
				'defs' => array(),
				'use' => array( 'href' => true, 'x' => true, 'y' => true ),
				'symbol' => array( 'id' => true, 'viewBox' => true ),
				'title' => array(),
				'desc' => array()
			) );
		} else {
			// For other HTML content, use more permissive sanitization
			$final_content = wp_kses_post( $block_content );
		}
		break;

	case 'empty':
	default:
		// No content for empty/self-closing elements
		$final_content = '';
		break;
}

// Render the element
if ( $self_closing || in_array( $tag_name, array( 'img', 'hr' ), true ) ) {
	// Self-closing elements (but NOT svg)
	echo '<' . esc_attr( $tag_name ) . ' ' . $wrapper_attributes . ' />';
} else {
	// Elements with content (including svg)
	echo '<' . esc_attr( $tag_name ) . ' ' . $wrapper_attributes . '>' . $final_content . '</' . esc_attr( $tag_name ) . '>';
}