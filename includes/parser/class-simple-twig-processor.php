<?php
/**
 * Simple Twig Processor
 *
 * A basic Twig-like template processor for dynamic tags when Timber is not available.
 * This is a simplified implementation for demonstration purposes.
 *
 * @package UniversalBlock
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Universal_Block_Simple_Twig_Processor {

	/**
	 * Process Twig-like syntax in content
	 *
	 * @param string $content The content with Twig syntax
	 * @param array  $context The context variables available to the template
	 * @return string The processed content
	 */
	public static function process( $content, $context = array() ) {
		if ( empty( $content ) ) {
			return $content;
		}

		// Set up default WordPress context
		$default_context = self::get_default_context();
		$context = array_merge( $default_context, $context );

		// Process Twig tags in order
		$content = self::process_set_statements( $content, $context );
		$content = self::process_for_loops( $content, $context );
		$content = self::process_if_statements( $content, $context );
		$content = self::process_variables( $content, $context );

		return $content;
	}

	/**
	 * Get default WordPress context data
	 *
	 * @return array Default context variables
	 */
	private static function get_default_context() {
		global $post;

		$context = array();

		// Post data
		if ( $post ) {
			$context['post'] = array(
				'ID' => $post->ID,
				'title' => get_the_title( $post ),
				'content' => get_the_content( null, false, $post ),
				'excerpt' => get_the_excerpt( $post ),
				'date' => get_the_date( '', $post ),
				'link' => get_permalink( $post ),
				'author' => array(
					'ID' => $post->post_author,
					'name' => get_the_author_meta( 'display_name', $post->post_author ),
					'display_name' => get_the_author_meta( 'display_name', $post->post_author ),
				),
			);

			// Add featured image if available
			if ( has_post_thumbnail( $post ) ) {
				$thumbnail_id = get_post_thumbnail_id( $post );
				$context['post']['thumbnail'] = array(
					'src' => get_the_post_thumbnail_url( $post, 'full' ),
					'alt' => get_post_meta( $thumbnail_id, '_wp_attachment_image_alt', true ),
				);
			}

			// Add meta function for ACF compatibility
			$context['post']['meta'] = function( $key ) use ( $post ) {
				return get_post_meta( $post->ID, $key, true );
			};
		}

		// User data
		$current_user = wp_get_current_user();
		if ( $current_user->ID > 0 ) {
			$context['user'] = array(
				'ID' => $current_user->ID,
				'display_name' => $current_user->display_name,
				'email' => $current_user->user_email,
				'meta' => function( $key ) use ( $current_user ) {
					return get_user_meta( $current_user->ID, $key, true );
				},
			);
		} else {
			$context['user'] = array( 'ID' => 0 );
		}

		// Site data
		$context['site'] = array(
			'name' => get_bloginfo( 'name' ),
			'description' => get_bloginfo( 'description' ),
			'url' => home_url(),
			'admin_email' => get_option( 'admin_email' ),
		);

		return $context;
	}

	/**
	 * Process {% set %} statements
	 *
	 * @param string $content The content to process
	 * @param array  $context The context variables (passed by reference)
	 * @return string The processed content
	 */
	private static function process_set_statements( $content, &$context ) {
		$pattern = '/\{\%\s*set\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+?)\s*\%\}/';

		return preg_replace_callback( $pattern, function( $matches ) use ( &$context ) {
			$variable = trim( $matches[1] );
			$value_expression = trim( $matches[2] );

			// Simple value evaluation
			$value = self::evaluate_expression( $value_expression, $context );
			$context[ $variable ] = $value;

			// Remove the set statement from output
			return '';
		}, $content );
	}

	/**
	 * Process {% for %} loops
	 *
	 * @param string $content The content to process
	 * @param array  $context The context variables
	 * @return string The processed content
	 */
	private static function process_for_loops( $content, $context ) {
		$pattern = '/\{\%\s*for\s+item\s+in\s+(.+?)\s*\%\}(.*?)\{\%\s*endfor\s*\%\}/s';

		return preg_replace_callback( $pattern, function( $matches ) use ( $context ) {
			$source_expression = trim( $matches[1] );
			$loop_content = $matches[2];

			// Get the data source
			$data = self::evaluate_expression( $source_expression, $context );

			if ( ! is_array( $data ) && ! is_object( $data ) ) {
				return '<!-- Invalid loop source: ' . esc_html( $source_expression ) . ' -->';
			}

			// Convert to array if needed
			if ( is_object( $data ) ) {
				$data = (array) $data;
			}

			$output = '';
			$index = 0;
			$total = count( $data );

			foreach ( $data as $item ) {
				// Create loop context
				$loop_context = $context;
				$loop_context['item'] = $item;
				$loop_context['loop'] = array(
					'index' => $index,
					'index0' => $index, // 0-based index
					'first' => $index === 0,
					'last' => $index === $total - 1,
					'length' => $total,
				);

				// Process the loop content
				$processed_content = self::process_variables( $loop_content, $loop_context );
				$processed_content = self::process_if_statements( $processed_content, $loop_context );
				$output .= $processed_content;

				$index++;
			}

			return $output;
		}, $content );
	}

	/**
	 * Process {% if %} statements
	 *
	 * @param string $content The content to process
	 * @param array  $context The context variables
	 * @return string The processed content
	 */
	private static function process_if_statements( $content, $context ) {
		$pattern = '/\{\%\s*if\s+(.+?)\s*\%\}(.*?)\{\%\s*endif\s*\%\}/s';

		return preg_replace_callback( $pattern, function( $matches ) use ( $context ) {
			$condition_expression = trim( $matches[1] );
			$if_content = $matches[2];

			// Evaluate the condition
			$condition_result = self::evaluate_condition( $condition_expression, $context );

			if ( $condition_result ) {
				// Process variables within the if content
				return self::process_variables( $if_content, $context );
			}

			return '';
		}, $content );
	}

	/**
	 * Process {{ variable }} expressions
	 *
	 * @param string $content The content to process
	 * @param array  $context The context variables
	 * @return string The processed content
	 */
	private static function process_variables( $content, $context ) {
		$pattern = '/\{\{\s*(.+?)\s*\}\}/';

		return preg_replace_callback( $pattern, function( $matches ) use ( $context ) {
			$expression = trim( $matches[1] );
			$value = self::evaluate_expression( $expression, $context );

			if ( is_string( $value ) || is_numeric( $value ) ) {
				return esc_html( $value );
			}

			return '';
		}, $content );
	}

	/**
	 * Evaluate a simple expression
	 *
	 * @param string $expression The expression to evaluate
	 * @param array  $context The context variables
	 * @return mixed The evaluated value
	 */
	private static function evaluate_expression( $expression, $context ) {
		// Handle quoted strings
		if ( preg_match( '/^["\'](.+)["\']$/', $expression, $matches ) ) {
			return $matches[1];
		}

		// Handle numbers
		if ( is_numeric( $expression ) ) {
			return $expression;
		}

		// Handle simple variable access (e.g., post.title, user.ID)
		if ( strpos( $expression, '.' ) !== false ) {
			$parts = explode( '.', $expression );
			$value = $context;

			foreach ( $parts as $part ) {
				if ( is_array( $value ) && isset( $value[ $part ] ) ) {
					$value = $value[ $part ];
				} elseif ( is_object( $value ) && property_exists( $value, $part ) ) {
					$value = $value->$part;
				} else {
					return null;
				}
			}

			return $value;
		}

		// Handle direct variable access
		if ( isset( $context[ $expression ] ) ) {
			return $context[ $expression ];
		}

		// Handle function calls (simplified)
		if ( preg_match( '/^([a-zA-Z_][a-zA-Z0-9_]*)\((.*)\)$/', $expression, $matches ) ) {
			$function_name = $matches[1];
			$args_string = $matches[2];

			// Handle post.meta('key') function calls
			if ( strpos( $expression, 'post.meta(' ) === 0 ) {
				if ( preg_match( '/post\.meta\(["\']([^"\']+)["\']\)/', $expression, $meta_matches ) ) {
					global $post;
					if ( $post ) {
						return get_post_meta( $post->ID, $meta_matches[1], true );
					}
				}
			}
		}

		return null;
	}

	/**
	 * Evaluate a condition expression
	 *
	 * @param string $expression The condition expression
	 * @param array  $context The context variables
	 * @return bool The condition result
	 */
	private static function evaluate_condition( $expression, $context ) {
		// Handle simple equality
		if ( preg_match( '/(.+?)\s*(==|!=|>|<|>=|<=)\s*(.+)/', $expression, $matches ) ) {
			$left = self::evaluate_expression( trim( $matches[1] ), $context );
			$operator = trim( $matches[2] );
			$right = self::evaluate_expression( trim( $matches[3] ), $context );

			switch ( $operator ) {
				case '==':
					return $left == $right;
				case '!=':
					return $left != $right;
				case '>':
					return $left > $right;
				case '<':
					return $left < $right;
				case '>=':
					return $left >= $right;
				case '<=':
					return $left <= $right;
			}
		}

		// Handle simple truthiness
		$value = self::evaluate_expression( $expression, $context );
		return ! empty( $value );
	}
}