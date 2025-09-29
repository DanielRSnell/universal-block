/**
 * Base Tag Configuration Interface
 *
 * Defines the structure and types for tag configurations.
 * This serves as documentation and validation for tag definitions.
 */

/**
 * Tag Configuration Schema
 *
 * @typedef {Object} TagConfig
 * @property {string} label - Human-readable name for the tag
 * @property {string} category - Category for filtering (text|semantic|interactive|media|form|structural|custom)
 * @property {string} [description] - Help text explaining the tag's purpose
 * @property {string} [icon] - Icon identifier for UI display
 *
 * @property {string} [contentType] - Fixed content type (no user choice needed)
 * @property {string[]} [contentTypeOptions] - Available content type options
 * @property {string} [defaultContentType] - Default content type when multiple options
 *
 * @property {boolean} selfClosing - Whether the tag is self-closing/void
 * @property {boolean} [inline] - Whether the element is inline (vs block)
 *
 * @property {string[]} [requiredAttrs] - Attributes that must be present
 * @property {string[]} [commonAttrs] - Suggested/common attributes
 * @property {string[]} [invalidAttrs] - Attributes that should not be used
 *
 * @property {string[]} [specialControls] - Custom UI components to render
 *
 * @property {Object} [validation] - Validation rules and recommendations
 * @property {string[]} [validation.invalidContentTypes] - Content types not allowed
 * @property {Object} [validation.recommendations] - Contextual recommendations
 * @property {string[]} [validation.warnings] - Always-show warnings
 */

/**
 * Content Type Definitions
 */
export const CONTENT_TYPES = {
	TEXT: 'text',     // Rich text editing with RichText component
	BLOCKS: 'blocks', // Nested blocks with InnerBlocks component
	HTML: 'html',     // Raw HTML editing with code editor
	EMPTY: 'empty'    // No content (self-closing or empty containers)
};

/**
 * Tag Categories
 */
export const TAG_CATEGORIES = {
	all: 'all',
	common: 'common',
	text: 'text',           // Text content and formatting
	layout: 'layout',       // Layout and structure elements
	media: 'media',         // Media elements (images, video, audio)
	custom: 'custom',       // Custom elements and web components
	dynamic: 'dynamic'      // Dynamic control structures (loop, if, set)
};

/**
 * Common attribute sets for reuse
 */
export const COMMON_ATTRS = {
	GLOBAL: ['style', 'id', 'class', 'title'],
	INTERACTIVE: ['tabindex', 'accesskey'],
	ARIA: ['aria-label', 'aria-describedby', 'aria-hidden'],
	DATA: [], // Data attributes are handled dynamically (data-*)
	MEDIA: ['width', 'height', 'loading'],
	FORM: ['name', 'value', 'required', 'disabled']
};

/**
 * Void/self-closing HTML elements
 * These elements cannot have content and must be self-closing
 */
export const VOID_ELEMENTS = [
	'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
	'link', 'meta', 'source', 'track', 'wbr'
];

/**
 * Inline elements that should be marked as inline: true
 */
export const INLINE_ELEMENTS = [
	'a', 'abbr', 'acronym', 'b', 'bdi', 'bdo', 'big', 'br', 'button',
	'cite', 'code', 'dfn', 'em', 'i', 'img', 'input', 'kbd', 'label',
	'map', 'mark', 'meter', 'noscript', 'object', 'output', 'progress',
	'q', 'ruby', 's', 'samp', 'script', 'select', 'small', 'span',
	'strong', 'sub', 'sup', 'textarea', 'time', 'tt', 'u', 'var', 'wbr'
];

/**
 * Factory function to create a tag configuration with defaults
 * @param {Partial<TagConfig>} config - Tag configuration
 * @returns {TagConfig} Complete tag configuration with defaults
 */
export function createTagConfig(config) {
	const {
		label,
		category,
		description = '',
		icon = null,
		contentType = null,
		contentTypeOptions = null,
		defaultContentType = null,
		selfClosing = false,
		inline = null,
		requiredAttrs = [],
		commonAttrs = [...COMMON_ATTRS.GLOBAL],
		invalidAttrs = [],
		specialControls = [],
		validation = {}
	} = config;

	// Auto-detect if element is inline if not specified
	const isInline = inline !== null ? inline : INLINE_ELEMENTS.includes(config.tagName);

	// Validate required fields
	if (!label || !category) {
		throw new Error('Tag configuration must have label and category');
	}

	return {
		label,
		category,
		description,
		icon,
		contentType,
		contentTypeOptions,
		defaultContentType,
		selfClosing,
		inline: isInline,
		requiredAttrs,
		commonAttrs,
		invalidAttrs,
		specialControls,
		validation: {
			invalidContentTypes: [],
			recommendations: {},
			warnings: [],
			...validation
		}
	};
}

/**
 * Helper to create a simple text tag configuration
 * @param {string} tagName - HTML tag name
 * @param {string} label - Display label
 * @param {string} [description] - Optional description
 * @returns {TagConfig} Text tag configuration
 */
export function createTextTag(tagName, label, description = '') {
	return createTagConfig({
		tagName,
		label,
		category: TAG_CATEGORIES.TEXT,
		description,
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false
	});
}

/**
 * Helper to create a semantic container tag configuration
 * @param {string} tagName - HTML tag name
 * @param {string} label - Display label
 * @param {string} [description] - Optional description
 * @returns {TagConfig} Semantic tag configuration
 */
export function createSemanticTag(tagName, label, description = '') {
	return createTagConfig({
		tagName,
		label,
		category: TAG_CATEGORIES.SEMANTIC,
		description,
		contentTypeOptions: [CONTENT_TYPES.BLOCKS, CONTENT_TYPES.TEXT, CONTENT_TYPES.HTML],
		defaultContentType: CONTENT_TYPES.BLOCKS,
		selfClosing: false
	});
}

/**
 * Helper to create a void/self-closing tag configuration
 * @param {string} tagName - HTML tag name
 * @param {string} label - Display label
 * @param {string} category - Tag category
 * @param {Object} [additionalConfig] - Additional configuration
 * @returns {TagConfig} Void tag configuration
 */
export function createVoidTag(tagName, label, category, additionalConfig = {}) {
	return createTagConfig({
		tagName,
		label,
		category,
		contentType: null, // No content for void elements
		selfClosing: true,
		...additionalConfig
	});
}