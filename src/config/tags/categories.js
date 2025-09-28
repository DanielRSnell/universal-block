/**
 * Tag Categories Configuration
 *
 * Defines categories for filtering tags in the UI.
 */

import { __ } from '@wordpress/i18n';

/**
 * Simplified tag category definitions for filtering and organization
 */
export const TAG_CATEGORIES = {
	// All tags (special filter)
	all: {
		value: 'all',
		label: __('All Tags', 'universal-block'),
		description: __('Show all available HTML tags', 'universal-block'),
		icon: 'admin-generic',
		color: '#666666'
	},

	// Most common elements
	common: {
		value: 'common',
		label: __('Common', 'universal-block'),
		description: __('Most commonly used HTML elements', 'universal-block'),
		icon: 'star-filled',
		color: '#0073aa',
		examples: ['div', 'p', 'h1', 'span', 'a', 'img']
	},

	// Text and content
	text: {
		value: 'text',
		label: __('Text', 'universal-block'),
		description: __('Text elements and formatting', 'universal-block'),
		icon: 'editor-textcolor',
		color: '#00a32a',
		examples: ['p', 'h1', 'span', 'strong', 'em']
	},

	// Structure and layout
	layout: {
		value: 'layout',
		label: __('Layout', 'universal-block'),
		description: __('Structure and layout elements', 'universal-block'),
		icon: 'layout',
		color: '#f56e28',
		examples: ['div', 'section', 'header', 'footer']
	},

	// Media and interactive
	media: {
		value: 'media',
		label: __('Media & Interactive', 'universal-block'),
		description: __('Images, links, and interactive elements', 'universal-block'),
		icon: 'format-image',
		color: '#e1a948',
		examples: ['img', 'a', 'button', 'video']
	},

	// Custom elements
	custom: {
		value: 'custom',
		label: __('Custom Element', 'universal-block'),
		description: __('Enter any HTML tag name with flexible content options', 'universal-block'),
		icon: 'admin-generic',
		color: '#8b5cf6',
		examples: ['custom-element', 'web-component', 'any-tag']
	},

	// Dynamic control structures
	dynamic: {
		value: 'dynamic',
		label: __('Dynamic', 'universal-block'),
		description: __('Control structures and dynamic content elements', 'universal-block'),
		icon: 'controls-repeat',
		color: '#dc2626',
		examples: ['loop', 'if', 'set']
	}
};

/**
 * Get category configuration by value
 * @param {string} categoryValue - Category value
 * @returns {Object|null} Category configuration
 */
export function getCategoryConfig(categoryValue) {
	return TAG_CATEGORIES[categoryValue] || null;
}

/**
 * Get all categories as array for SelectControl options
 * @returns {Array} Array of {label, value} objects
 */
export function getCategoryOptions() {
	return Object.values(TAG_CATEGORIES).map(category => ({
		label: category.label,
		value: category.value
	}));
}

/**
 * Get categories with additional metadata for advanced UI
 * @returns {Array} Array of category objects with full metadata
 */
export function getCategoriesWithMetadata() {
	return Object.values(TAG_CATEGORIES);
}

/**
 * Get category color for UI theming
 * @param {string} categoryValue - Category value
 * @returns {string} Hex color code
 */
export function getCategoryColor(categoryValue) {
	const category = getCategoryConfig(categoryValue);
	return category?.color || '#666666';
}

/**
 * Get category icon for UI display
 * @param {string} categoryValue - Category value
 * @returns {string} WordPress Dashicon name
 */
export function getCategoryIcon(categoryValue) {
	const category = getCategoryConfig(categoryValue);
	return category?.icon || 'admin-generic';
}