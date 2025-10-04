/**
 * HTML to Universal Blocks Parser
 *
 * Converts HTML into universal/element block structures
 */

import { createBlock } from '@wordpress/blocks';
import { getTagConfig } from '../config/tags';

/**
 * Parse HTML string and convert to Universal Block structures
 * @param {string} html - HTML string to parse
 * @returns {Array} Array of block objects
 */
export function parseHTMLToBlocks(html) {
	if (!html || typeof html !== 'string') {
		return [];
	}

	// CRITICAL FIX: DOMParser doesn't handle self-closing custom tags correctly
	// It treats <set /> as an opening tag, causing all subsequent content to be nested inside it
	// We need to convert self-closing custom tags to proper empty tags: <set></set>
	const processedHtml = html.replace(/<(\w+)([^>]*?)\/>/g, (match, tagName, attrs) => {
		// Check if this is a custom tag that should be self-closing
		const config = getTagConfig(tagName.toLowerCase());
		if (config?.selfClosing === true) {
			// Convert <tag /> to <tag></tag>
			return `<${tagName}${attrs}></${tagName}>`;
		}
		// Keep void HTML elements as self-closing
		return match;
	});

	// Create a temporary container to parse HTML
	const parser = new DOMParser();
	const doc = parser.parseFromString(`<div>${processedHtml}</div>`, 'text/html');
	const container = doc.body.firstChild;

	// Convert child nodes to blocks
	const blocks = [];
	if (container) {
		for (const node of container.childNodes) {
			const block = nodeToBlock(node);
			if (block) {
				blocks.push(block);
			}
		}
	}

	return blocks;
}

/**
 * Convert a DOM node to a Universal Block
 * @param {Node} node - DOM node to convert
 * @returns {Object|null} Block object or null
 */
function nodeToBlock(node) {
	// Handle text nodes
	if (node.nodeType === Node.TEXT_NODE) {
		const text = node.textContent.trim();
		if (!text) return null;

		// Create a paragraph block for standalone text
		// All parsed blocks are treated as Custom Elements
		return createBlock('universal/element', {
			blockName: 'P',
			tagName: 'p',
			category: 'custom',
			contentType: 'text',
			content: text,
			selfClosing: false,
			uiState: {
				tagCategory: 'custom',
				selectedTagName: 'p',
				selectedContentType: 'text'
			}
		});
	}

	// Handle element nodes
	if (node.nodeType === Node.ELEMENT_NODE) {
		const tagName = node.tagName.toLowerCase();

		// Only check config for dynamic tags (set, loop, if) to detect selfClosing flag
		const config = getTagConfig(tagName);
		const isDynamicTag = config?.selfClosing === true;

		// Extract attributes
		const globalAttrs = {};
		let className = '';

		for (const attr of node.attributes) {
			if (attr.name === 'class') {
				// WordPress uses className attribute for CSS classes
				className = attr.value;
			} else if (attr.name === 'style') {
				// Convert style to data-style to avoid breaking Gutenberg preview
				globalAttrs['data-style'] = attr.value;
			} else {
				globalAttrs[attr.name] = attr.value;
			}
		}

		// Determine content type and content
		let contentType;
		let content = '';
		let innerBlocks = [];

		// Void elements (self-closing HTML elements)
		const voidElements = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
		const isVoidElement = voidElements.includes(tagName);

		// Content type detection logic - works for ANY element
		if (isDynamicTag) {
			// Dynamic tags like <set> use their configured content type
			contentType = config.contentType || 'empty';
		} else if (isVoidElement) {
			// Standard void elements
			contentType = 'empty';
		} else if (tagName === 'svg') {
			// SVG always uses HTML to preserve markup
			contentType = 'html';
			content = node.innerHTML;
		} else {
			// Universal content type detection based on actual children
			const hasElements = hasChildElements(node);
			const hasText = hasTextContent(node);

			// Container elements that should use blocks for nested elements
			const containerElements = ['div', 'section', 'article', 'header', 'footer', 'main', 'nav', 'aside', 'ul', 'ol', 'li', 'form', 'fieldset', 'blockquote', 'figure', 'button'];
			const isContainer = containerElements.includes(tagName);

			if (hasElements && isContainer) {
				// Containers with elements → use blocks (even if mixed with text)
				contentType = 'blocks';
				for (const childNode of node.childNodes) {
					const childBlock = nodeToBlock(childNode);
					if (childBlock) {
						innerBlocks.push(childBlock);
					}
				}
			} else if (hasElements) {
				// Non-container with elements (like <a><span>text</span></a>) → use HTML
				contentType = 'html';
				content = node.innerHTML;
			} else if (hasText) {
				// Only text → use text
				contentType = 'text';
				content = node.textContent;
			} else {
				// Empty element (no children, no text)
				contentType = 'empty';
			}
		}

		// Determine if self-closing
		const finalSelfClosing = config?.selfClosing !== undefined ? config.selfClosing : isVoidElement;

		// Create the block - all parsed elements are Custom Elements
		const blockAttributes = {
			blockName: tagName.charAt(0).toUpperCase() + tagName.slice(1),
			tagName,
			category: 'custom',
			contentType,
			selfClosing: finalSelfClosing,
			globalAttrs,
			uiState: {
				tagCategory: 'custom',
				selectedTagName: tagName,
				selectedContentType: contentType
			}
		};

		// Add className if present
		if (className) {
			blockAttributes.className = className;
		}

		// Add content based on type
		if (contentType === 'text' || contentType === 'html') {
			blockAttributes.content = content;
		}

		return createBlock('universal/element', blockAttributes, innerBlocks);
	}

	return null;
}

/**
 * Check if element has any child elements
 * @param {Element} element - DOM element to check
 * @returns {boolean}
 */
function hasChildElements(element) {
	for (const child of element.childNodes) {
		if (child.nodeType === Node.ELEMENT_NODE) {
			return true;
		}
	}
	return false;
}

/**
 * Check if element has any text content (excluding pure whitespace)
 * @param {Element} element - DOM element to check
 * @returns {boolean}
 */
function hasTextContent(element) {
	for (const child of element.childNodes) {
		if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
			return true;
		}
	}
	return false;
}

