/**
 * Tag Categories Configuration
 *
 * Defines categories for filtering tags in the UI.
 */

import { __ } from '@wordpress/i18n';

/**
 * Tag category definitions for filtering and organization
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

	// Text content and formatting
	text: {
		value: 'text',
		label: __('Text & Content', 'universal-block'),
		description: __('Text elements, headings, and formatting tags', 'universal-block'),
		icon: 'editor-textcolor',
		color: '#0073aa',
		examples: ['p', 'h1', 'span', 'strong', 'em']
	},

	// Semantic structure elements
	semantic: {
		value: 'semantic',
		label: __('Semantic Structure', 'universal-block'),
		description: __('Semantic HTML5 elements that provide meaning and structure', 'universal-block'),
		icon: 'layout',
		color: '#00a32a',
		examples: ['article', 'section', 'header', 'footer', 'nav']
	},

	// Interactive elements
	interactive: {
		value: 'interactive',
		label: __('Interactive', 'universal-block'),
		description: __('Interactive elements like links, buttons, and controls', 'universal-block'),
		icon: 'admin-links',
		color: '#f56e28',
		examples: ['a', 'button', 'details', 'summary']
	},

	// Media elements
	media: {
		value: 'media',
		label: __('Media', 'universal-block'),
		description: __('Images, videos, audio, and other media elements', 'universal-block'),
		icon: 'format-image',
		color: '#e1a948',
		examples: ['img', 'video', 'audio', 'svg', 'canvas']
	},

	// Form elements
	form: {
		value: 'form',
		label: __('Form Elements', 'universal-block'),
		description: __('Form controls and input elements', 'universal-block'),
		icon: 'feedback',
		color: '#826eb4',
		examples: ['input', 'textarea', 'select', 'form', 'label']
	},

	// Structural and layout
	structural: {
		value: 'structural',
		label: __('Structural', 'universal-block'),
		description: __('Tables, lists, and other structural elements', 'universal-block'),
		icon: 'editor-table',
		color: '#ca4a1f',
		examples: ['table', 'ul', 'ol', 'li', 'div']
	},

	// Custom elements and web components
	custom: {
		value: 'custom',
		label: __('Custom Elements', 'universal-block'),
		description: __('Web components, custom elements, and framework-specific tags', 'universal-block'),
		icon: 'admin-tools',
		color: '#d63638',
		examples: ['web-component', 'iframe', 'script', 'custom-element']
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