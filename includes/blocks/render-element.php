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

$element_type = $attributes['elementType'] ?? 'text';
$tag_name = $attributes['tagName'] ?? 'p';
$block_content = $attributes['content'] ?? '';
$global_attrs = $attributes['globalAttrs'] ?? array();
$self_closing = $attributes['selfClosing'] ?? false;

// Sanitize tag name
$allowed_tags = array(
	'p', 'span', 'div', 'section', 'article', 'main', 'aside', 'header', 'footer',
	'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
	'a', 'img', 'hr', 'svg'
);

if ( ! in_array( $tag_name, $allowed_tags, true ) ) {
	$tag_name = 'div';
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

// Determine what content to use
$final_content = '';
if ( $element_type === 'container' ) {
	// For containers, use InnerBlocks content (passed as $content parameter)
	$final_content = $content;
} elseif ( $element_type === 'svg' ) {
	// For SVG elements, use the content attribute (which contains the inner SVG HTML)
	$final_content = $block_content;
} elseif ( $element_type === 'image' || $element_type === 'rule' ) {
	// Self-closing elements have no content
	$final_content = '';
} else {
	// For text, heading, link - use block content attribute
	$final_content = wp_kses_post( $block_content );
}

// Render the element
if ( $self_closing || in_array( $tag_name, array( 'img', 'hr' ), true ) ) {
	// Self-closing elements (but NOT svg)
	echo '<' . esc_attr( $tag_name ) . ' ' . $wrapper_attributes . ' />';
} else {
	// Elements with content (including svg)
	echo '<' . esc_attr( $tag_name ) . ' ' . $wrapper_attributes . '>' . $final_content . '</' . esc_attr( $tag_name ) . '>';
}