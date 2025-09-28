/**
 * Blocks to HTML Parser
 *
 * Converts Universal Block structures back to HTML
 */

/**
 * Convert an array of blocks to HTML string
 * @param {Array} blocks - Array of block objects
 * @returns {string} HTML string
 */
export function parseBlocksToHTML(blocks) {
	if (!blocks || !Array.isArray(blocks)) {
		return '';
	}

	return blocks.map(block => blockToHTML(block)).join('\n');
}

/**
 * Convert a single block to HTML
 * @param {Object} block - Block object
 * @returns {string} HTML string
 */
function blockToHTML(block) {
	if (!block || block.name !== 'universal/element') {
		return '';
	}

	const { attributes, innerBlocks } = block;
	const {
		tagName = 'div',
		contentType = 'text',
		content = '',
		selfClosing = false,
		globalAttrs = {},
		className = ''
	} = attributes;

	// Build attributes string
	let attributesString = '';

	// Add className if present
	if (className) {
		attributesString += ` class="${escapeAttribute(className)}"`;
	}

	// Add global attributes
	Object.entries(globalAttrs).forEach(([name, value]) => {
		if (name && value !== undefined && value !== '') {
			attributesString += ` ${escapeAttributeName(name)}="${escapeAttribute(value)}"`;
		}
	});

	// Handle different content types
	let innerContent = '';

	switch (contentType) {
		case 'text':
		case 'html':
			innerContent = content || '';
			break;

		case 'blocks':
			// Recursively convert inner blocks to HTML
			if (innerBlocks && innerBlocks.length > 0) {
				innerContent = parseBlocksToHTML(innerBlocks);
			}
			break;

		case 'empty':
		default:
			innerContent = '';
			break;
	}

	// Generate HTML
	if (selfClosing || isVoidElement(tagName)) {
		return `<${tagName}${attributesString} />`;
	} else {
		return `<${tagName}${attributesString}>${innerContent}</${tagName}>`;
	}
}

/**
 * Check if a tag name is a void element
 * @param {string} tagName - HTML tag name
 * @returns {boolean}
 */
function isVoidElement(tagName) {
	const voidElements = [
		'img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base',
		'col', 'embed', 'source', 'track', 'wbr'
	];
	return voidElements.includes(tagName.toLowerCase());
}

/**
 * Escape HTML attribute value
 * @param {string} value - Attribute value
 * @returns {string} Escaped value
 */
function escapeAttribute(value) {
	if (typeof value !== 'string') {
		value = String(value);
	}
	return value
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#x27;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

/**
 * Escape HTML attribute name
 * @param {string} name - Attribute name
 * @returns {string} Escaped name
 */
function escapeAttributeName(name) {
	// Only allow letters, numbers, hyphens, and underscores
	return name.replace(/[^a-zA-Z0-9\-_]/g, '');
}