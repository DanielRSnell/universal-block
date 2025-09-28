/**
 * Universal Block Tag Registry
 *
 * Central registry for all HTML tags with their configurations.
 * Provides lookup functions and filtering capabilities.
 */

import { textTags } from './text-tags';
import { semanticTags } from './semantic-tags';
import { mediaTags } from './media-tags';
import { interactiveTags } from './interactive-tags';
import { structuralTags } from './structural-tags';
import { formTags } from './form-tags';
import { customTags } from './custom-tags';

// Combine all tag configurations
const allTags = {
	...textTags,
	...semanticTags,
	...mediaTags,
	...interactiveTags,
	...structuralTags,
	...formTags,
	...customTags,
};

/**
 * Get configuration for a specific tag
 * @param {string} tagName - HTML tag name
 * @returns {Object} Tag configuration or fallback defaults
 */
export function getTagConfig(tagName) {
	if (!tagName) return null;

	const normalizedTag = tagName.toLowerCase();
	return allTags[normalizedTag] || getCustomTagDefaults(normalizedTag);
}

/**
 * Get all tags filtered by category
 * @param {string} category - Category to filter by ('all', 'text', 'semantic', etc.)
 * @returns {Array} Array of tag names
 */
export function getFilteredTags(category = 'all') {
	if (category === 'all') {
		return Object.keys(allTags);
	}

	return Object.entries(allTags)
		.filter(([, config]) => config.category === category)
		.map(([tagName]) => tagName);
}

/**
 * Get all available categories
 * @returns {Array} Array of category objects
 */
export function getTagCategories() {
	const categories = new Set();
	Object.values(allTags).forEach(config => {
		if (config.category) {
			categories.add(config.category);
		}
	});

	return Array.from(categories).sort();
}

/**
 * Get tags for select control options
 * @param {string} category - Category to filter by
 * @returns {Array} Array of {label, value} objects for SelectControl
 */
export function getTagOptions(category = 'all') {
	const filteredTags = getFilteredTags(category);

	return filteredTags.map(tagName => {
		const config = allTags[tagName];
		return {
			label: config ? `${config.label} (${tagName})` : tagName,
			value: tagName
		};
	}).sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Check if a tag should show content type selector
 * @param {string} tagName - HTML tag name
 * @returns {boolean} Whether to show content type options
 */
export function shouldShowContentTypeSelector(tagName) {
	const config = getTagConfig(tagName);
	return config && config.contentTypeOptions && config.contentTypeOptions.length > 1;
}

/**
 * Get content type options for a tag
 * @param {string} tagName - HTML tag name
 * @returns {Array} Array of content type options
 */
export function getContentTypeOptions(tagName) {
	const config = getTagConfig(tagName);

	if (config?.contentTypeOptions) {
		return config.contentTypeOptions;
	}

	if (config?.contentType) {
		return [config.contentType];
	}

	// Fallback for unknown tags
	return ['text', 'blocks', 'html', 'empty'];
}

/**
 * Get default content type for a tag
 * @param {string} tagName - HTML tag name
 * @returns {string} Default content type
 */
export function getDefaultContentType(tagName) {
	const config = getTagConfig(tagName);

	if (config?.contentType) {
		return config.contentType;
	}

	if (config?.defaultContentType) {
		return config.defaultContentType;
	}

	// Smart defaults based on tag type
	const voidElements = ['img', 'br', 'hr', 'input', 'meta', 'link'];
	if (voidElements.includes(tagName)) {
		return 'empty';
	}

	const textElements = ['p', 'span', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
	if (textElements.includes(tagName)) {
		return 'text';
	}

	// Default to blocks for container-like elements
	return 'blocks';
}

/**
 * Generate fallback configuration for custom/unknown tags
 * @param {string} tagName - HTML tag name
 * @returns {Object} Fallback tag configuration
 */
function getCustomTagDefaults(tagName) {
	const isVoidElement = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'].includes(tagName);

	return {
		label: tagName.charAt(0).toUpperCase() + tagName.slice(1),
		category: 'custom',
		contentTypeOptions: isVoidElement ? ['empty'] : ['text', 'blocks', 'html', 'empty'],
		defaultContentType: isVoidElement ? 'empty' : 'text',
		selfClosing: isVoidElement,
		description: `Custom ${tagName} element`,
		commonAttrs: ['style', 'id', 'class'],
		validation: {
			warnings: [`This is a custom element. Ensure it's valid HTML or a registered web component.`]
		}
	};
}

/**
 * Validate tag and content type combination
 * @param {string} tagName - HTML tag name
 * @param {string} contentType - Content type
 * @returns {Object} Validation result with warnings/errors
 */
export function validateTagContentType(tagName, contentType) {
	const config = getTagConfig(tagName);
	const result = { valid: true, warnings: [], errors: [] };

	if (!config) {
		result.warnings.push(`Unknown tag "${tagName}". Ensure it's valid HTML.`);
		return result;
	}

	// Check if content type is valid for this tag
	if (config.contentType && config.contentType !== contentType) {
		result.errors.push(`Tag "${tagName}" must use content type "${config.contentType}"`);
		result.valid = false;
	}

	if (config.validation?.invalidContentTypes?.includes(contentType)) {
		result.errors.push(`Content type "${contentType}" is not valid for tag "${tagName}"`);
		result.valid = false;
	}

	// Add any tag-specific warnings
	if (config.validation?.warnings) {
		result.warnings.push(...config.validation.warnings);
	}

	return result;
}

// Export all tag configurations for advanced use cases
export {
	allTags,
	textTags,
	semanticTags,
	mediaTags,
	interactiveTags,
	structuralTags,
	formTags,
	customTags
};