/**
 * Dynamic Tags Configuration
 *
 * Control structures and dynamic content elements for conditional logic,
 * loops, and variable management.
 */

import { __ } from '@wordpress/i18n';
import { createTagConfig } from './base-tag';
import { TAG_CATEGORIES } from './categories';

/**
 * Dynamic control structure tags
 */
export const dynamicTags = {
	'loop': createTagConfig({
		label: __('Loop', 'universal-block'),
		category: TAG_CATEGORIES.dynamic,
		description: __('Repeats content based on dynamic data or specified iterations', 'universal-block'),
		contentType: 'blocks',
		selfClosing: false,
		customAttributes: {
			source: {
				type: 'string',
				label: __('Data Source', 'universal-block'),
				description: __('Source of data to loop through (e.g., posts, products, custom field)', 'universal-block'),
				placeholder: 'posts'
			},
			limit: {
				type: 'number',
				label: __('Limit', 'universal-block'),
				description: __('Maximum number of iterations', 'universal-block'),
				placeholder: '10'
			},
			offset: {
				type: 'number',
				label: __('Offset', 'universal-block'),
				description: __('Number of items to skip', 'universal-block'),
				placeholder: '0'
			}
		},
		examples: [
			{
				title: __('Post Loop', 'universal-block'),
				attributes: { source: 'posts', limit: 5 },
				description: __('Loop through 5 latest posts', 'universal-block')
			},
			{
				title: __('Product Loop', 'universal-block'),
				attributes: { source: 'products', limit: 8 },
				description: __('Loop through 8 products', 'universal-block')
			}
		],
		notes: __('Loop functionality will be implemented in a future update. This is a placeholder tag.', 'universal-block')
	}),

	'if': createTagConfig({
		label: __('If', 'universal-block'),
		category: TAG_CATEGORIES.dynamic,
		description: __('Conditionally displays content based on specified conditions', 'universal-block'),
		contentType: 'blocks',
		selfClosing: false,
		customAttributes: {
			condition: {
				type: 'string',
				label: __('Condition', 'universal-block'),
				description: __('Condition to evaluate (e.g., user_logged_in, has_featured_image)', 'universal-block'),
				placeholder: 'user_logged_in'
			},
			operator: {
				type: 'select',
				label: __('Operator', 'universal-block'),
				description: __('Comparison operator', 'universal-block'),
				options: [
					{ label: 'Equals', value: 'equals' },
					{ label: 'Not Equals', value: 'not_equals' },
					{ label: 'Greater Than', value: 'greater_than' },
					{ label: 'Less Than', value: 'less_than' },
					{ label: 'Contains', value: 'contains' },
					{ label: 'Exists', value: 'exists' }
				],
				default: 'exists'
			},
			value: {
				type: 'string',
				label: __('Compare Value', 'universal-block'),
				description: __('Value to compare against (optional for exists/not exists)', 'universal-block'),
				placeholder: ''
			}
		},
		examples: [
			{
				title: __('Logged In Users Only', 'universal-block'),
				attributes: { condition: 'user_logged_in', operator: 'exists' },
				description: __('Show content only to logged-in users', 'universal-block')
			},
			{
				title: __('Featured Image Check', 'universal-block'),
				attributes: { condition: 'has_featured_image', operator: 'exists' },
				description: __('Show content only if post has featured image', 'universal-block')
			}
		],
		notes: __('Conditional logic will be implemented in a future update. This is a placeholder tag.', 'universal-block')
	}),

	'set': createTagConfig({
		label: __('Set', 'universal-block'),
		category: TAG_CATEGORIES.dynamic,
		description: __('Sets or modifies variables for use in other dynamic elements', 'universal-block'),
		contentType: 'empty',
		selfClosing: true,
		customAttributes: {
			variable: {
				type: 'string',
				label: __('Variable Name', 'universal-block'),
				description: __('Name of the variable to set', 'universal-block'),
				placeholder: 'my_variable'
			},
			value: {
				type: 'string',
				label: __('Value', 'universal-block'),
				description: __('Value to assign to the variable', 'universal-block'),
				placeholder: 'Hello World'
			},
			type: {
				type: 'select',
				label: __('Variable Type', 'universal-block'),
				description: __('Type of variable', 'universal-block'),
				options: [
					{ label: 'String', value: 'string' },
					{ label: 'Number', value: 'number' },
					{ label: 'Boolean', value: 'boolean' },
					{ label: 'Array', value: 'array' },
					{ label: 'Object', value: 'object' }
				],
				default: 'string'
			},
			scope: {
				type: 'select',
				label: __('Scope', 'universal-block'),
				description: __('Variable scope', 'universal-block'),
				options: [
					{ label: 'Local', value: 'local' },
					{ label: 'Global', value: 'global' },
					{ label: 'Session', value: 'session' }
				],
				default: 'local'
			}
		},
		examples: [
			{
				title: __('Set User Name', 'universal-block'),
				attributes: { variable: 'current_user_name', value: 'get_current_user_name()', type: 'string' },
				description: __('Store current user name in variable', 'universal-block')
			},
			{
				title: __('Set Counter', 'universal-block'),
				attributes: { variable: 'post_count', value: '0', type: 'number' },
				description: __('Initialize a counter variable', 'universal-block')
			}
		],
		notes: __('Variable management will be implemented in a future update. This is a placeholder tag.', 'universal-block')
	})
};

/**
 * Get all dynamic tags
 * @returns {Object} Dynamic tags configuration
 */
export function getDynamicTags() {
	return dynamicTags;
}

/**
 * Get dynamic tag by name
 * @param {string} tagName - Tag name
 * @returns {Object|null} Tag configuration
 */
export function getDynamicTag(tagName) {
	return dynamicTags[tagName] || null;
}

/**
 * Check if tag is a dynamic tag
 * @param {string} tagName - Tag name
 * @returns {boolean} True if tag is dynamic
 */
export function isDynamicTag(tagName) {
	return Object.keys(dynamicTags).includes(tagName);
}