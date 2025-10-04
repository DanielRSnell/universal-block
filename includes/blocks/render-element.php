<?php
/**
 * Server-side rendering for the Universal Element block.
 *
 * @param array  $attributes Block attributes.
 * @param string $content    Block inner content (InnerBlocks for 'blocks' contentType).
 * @param object $block      Block instance.
 * @return string Rendered block output.
 *
 * NOTE: Testing adding WordPress block props to each element for theme.json support,
 * spacing controls, typography, colors, etc. This allows WordPress block supports
 * to work properly on the frontend.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Extract attributes
$tag_name = $attributes['tagName'] ?? 'div';
$content_type = $attributes['contentType'] ?? 'blocks';
$block_content = $attributes['content'] ?? '';
$global_attrs = $attributes['globalAttrs'] ?? array();
$is_self_closing = $attributes['isSelfClosing'] ?? false;
$class_name = $attributes['className'] ?? '';

// Start with empty attributes array
$attrs = array();

// Add block ID if not already set in globalAttrs
if ( ! isset( $global_attrs['id'] ) ) {
	// Generate unique block ID using a hash of block data
	$block_data = wp_json_encode( array(
		'tag' => $tag_name,
		'content' => substr( $block_content, 0, 50 ),
		'attrs' => $global_attrs,
	) );
	$attrs['id'] = 'block-' . substr( md5( $block_data . microtime() ), 0, 8 );
}

// Add className if present
if ( ! empty( $class_name ) ) {
	$attrs['class'] = esc_attr( $class_name );
}

// Add/merge global attributes
foreach ( $global_attrs as $attr_name => $attr_value ) {
	if ( empty( $attr_name ) || empty( $attr_value ) ) {
		continue;
	}

	// Sanitize attribute name
	$attr_name = preg_replace( '/[^a-zA-Z0-9\-_]/', '', $attr_name );

	// Skip 'class' from globalAttrs - we use className attribute instead (WordPress official way)
	if ( $attr_name === 'class' ) {
		continue;
	}

	if ( $attr_name === 'href' || $attr_name === 'src' ) {
		$attrs[ $attr_name ] = esc_url( $attr_value );
	} else {
		$attrs[ $attr_name ] = esc_attr( $attr_value );
	}
}

// Build attribute string
$attr_string = '';
foreach ( $attrs as $attr_name => $attr_value ) {
	if ( ! empty( $attr_value ) ) {
		$attr_string .= ' ' . esc_attr( $attr_name ) . '="' . $attr_value . '"';
	}
}

// Determine final content based on contentType
$final_content = '';

switch ( $content_type ) {
	case 'blocks':
		// Use InnerBlocks content (passed as $content parameter)
		$final_content = $content;
		break;

	case 'text':
	case 'html':
		// Use block content attribute directly without sanitization
		// Gutenberg already sanitizes on save
		$final_content = $block_content;
		break;

	case 'empty':
	default:
		// No content for empty/self-closing elements
		$final_content = '';
		break;
}

// Render the element
if ( $is_self_closing ) {
	echo '<' . esc_attr( $tag_name ) . $attr_string . ' />';
} else {
	echo '<' . esc_attr( $tag_name ) . $attr_string . '>' . $final_content . '</' . esc_attr( $tag_name ) . '>';
}
