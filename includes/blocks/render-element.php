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
	'a', 'img', 'hr'
);

if ( ! in_array( $tag_name, $allowed_tags, true ) ) {
	$tag_name = 'div';
}

// Build additional attributes array for WordPress wrapper
$additional_attrs = array();

// Add element-specific attributes
switch ( $element_type ) {
	case 'link':
		if ( ! empty( $attributes['href'] ) ) {
			$additional_attrs['href'] = esc_url( $attributes['href'] );
		}
		if ( ! empty( $attributes['target'] ) ) {
			$additional_attrs['target'] = esc_attr( $attributes['target'] );
		}
		if ( ! empty( $attributes['rel'] ) ) {
			$additional_attrs['rel'] = esc_attr( $attributes['rel'] );
		}
		break;

	case 'image':
		if ( ! empty( $attributes['src'] ) ) {
			$additional_attrs['src'] = esc_url( $attributes['src'] );
		}
		if ( ! empty( $attributes['alt'] ) ) {
			$additional_attrs['alt'] = esc_attr( $attributes['alt'] );
		}
		if ( ! empty( $attributes['width'] ) ) {
			$additional_attrs['width'] = esc_attr( $attributes['width'] );
		}
		if ( ! empty( $attributes['height'] ) ) {
			$additional_attrs['height'] = esc_attr( $attributes['height'] );
		}
		break;
}

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
	}
}

// Get WordPress block wrapper attributes (includes automatic classes)
$wrapper_attributes = get_block_wrapper_attributes( $additional_attrs );

// Determine what content to use
$final_content = '';
if ( $element_type === 'container' ) {
	// For containers, use InnerBlocks content (passed as $content parameter)
	$final_content = $content;
} elseif ( $element_type === 'image' || $element_type === 'rule' ) {
	// Self-closing elements have no content
	$final_content = '';
} else {
	// For text, heading, link - use block content attribute
	$final_content = wp_kses_post( $block_content );
}

// Render the element
if ( $self_closing || in_array( $tag_name, array( 'img', 'hr' ), true ) ) {
	// Self-closing elements
	echo '<' . esc_attr( $tag_name ) . ' ' . $wrapper_attributes . ' />';
} else {
	// Elements with content
	echo '<' . esc_attr( $tag_name ) . ' ' . $wrapper_attributes . '>' . $final_content . '</' . esc_attr( $tag_name ) . '>';
}