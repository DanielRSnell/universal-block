/**
 * Dynamic Tags Configuration
 *
 * Control structures and dynamic content elements for conditional logic,
 * loops, and variable management.
 */

import { __ } from '@wordpress/i18n';
import { createTagConfig } from './base-tag';

/**
 * Dynamic control structure tags
 */
export const dynamicTags = {
	'loop': createTagConfig({
		label: __('Loop', 'universal-block'),
		category: 'dynamic',
		description: __('Repeats content based on dynamic data using raw Twig syntax', 'universal-block'),
		contentType: 'blocks',
		selfClosing: false,
		customAttributes: {
			source: {
				type: 'string',
				label: __('Source (Raw Twig)', 'universal-block'),
				description: __('Raw Twig expression for data source (e.g., post.meta(\'gallery\'), posts({post_type: \'product\'}))', 'universal-block'),
				placeholder: 'post.meta(\'team_members\')'
			}
		},
		examples: [
			{
				title: __('ACF Repeater', 'universal-block'),
				attributes: { source: 'post.meta(\'team_members\')' },
				description: __('Loop through ACF repeater field', 'universal-block')
			},
			{
				title: __('WordPress Query', 'universal-block'),
				attributes: { source: 'posts({post_type: \'product\', posts_per_page: 6})' },
				description: __('Loop through WordPress posts query', 'universal-block')
			},
			{
				title: __('Simple Array', 'universal-block'),
				attributes: { source: 'site.menu.items' },
				description: __('Loop through menu items', 'universal-block')
			}
		],
		notes: __('Translates to {% for item in source %}...{% endfor %}. Use loop.index, loop.first, loop.last for iteration context.', 'universal-block')
	}),

	'if': createTagConfig({
		label: __('If', 'universal-block'),
		category: 'dynamic',
		description: __('Conditionally displays content based on raw Twig expressions', 'universal-block'),
		contentType: 'blocks',
		selfClosing: false,
		customAttributes: {
			source: {
				type: 'string',
				label: __('Condition (Raw Twig)', 'universal-block'),
				description: __('Raw Twig conditional expression (e.g., user.ID > 0, loop.index == 0, post.meta(\'featured\'))', 'universal-block'),
				placeholder: 'user.ID > 0'
			}
		},
		examples: [
			{
				title: __('User Authentication', 'universal-block'),
				attributes: { source: 'user.ID > 0' },
				description: __('Show content only to logged-in users', 'universal-block')
			},
			{
				title: __('Loop Position', 'universal-block'),
				attributes: { source: 'loop.index == 0' },
				description: __('Show content only for first item in loop', 'universal-block')
			},
			{
				title: __('Featured Content', 'universal-block'),
				attributes: { source: 'post.meta(\'featured\')' },
				description: __('Show content only if post is featured', 'universal-block')
			},
			{
				title: __('Complex Condition', 'universal-block'),
				attributes: { source: 'user.ID > 0 and user.has_cap(\'edit_posts\')' },
				description: __('Show content for users who can edit posts', 'universal-block')
			}
		],
		notes: __('Translates to {% if source %}...{% endif %}. Use multiple if tags instead of if/else for simplicity.', 'universal-block')
	}),

	'set': createTagConfig({
		label: __('Set', 'universal-block'),
		category: 'dynamic',
		description: __('Sets variables using raw Twig expressions for use in templates', 'universal-block'),
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
				label: __('Value (Raw Twig)', 'universal-block'),
				description: __('Raw Twig expression for variable value (e.g., post.title, users|length, \'Hello World\')', 'universal-block'),
				placeholder: 'post.meta(\'custom_field\')'
			}
		},
		examples: [
			{
				title: __('User Count', 'universal-block'),
				attributes: { variable: 'user_count', value: 'users|length' },
				description: __('Store number of users in variable', 'universal-block')
			},
			{
				title: __('Featured Status', 'universal-block'),
				attributes: { variable: 'is_featured', value: 'post.meta(\'featured\')' },
				description: __('Store featured status in variable', 'universal-block')
			},
			{
				title: __('Current Date', 'universal-block'),
				attributes: { variable: 'today', value: '\'now\'|date(\'Y-m-d\')' },
				description: __('Store formatted current date', 'universal-block')
			},
			{
				title: __('Complex Expression', 'universal-block'),
				attributes: { variable: 'greeting', value: 'user.ID > 0 ? \'Hello \' ~ user.display_name : \'Welcome Guest\'' },
				description: __('Conditional greeting based on user status', 'universal-block')
			}
		],
		notes: __('Translates to {% set variable = value %}. Variables can then be used throughout the template with {{ variable }}.', 'universal-block')
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