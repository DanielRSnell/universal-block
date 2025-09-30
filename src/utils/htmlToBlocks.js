/**
 * HTML to Universal Blocks Parser
 *
 * Converts HTML into universal/element block structures
 */

import { createBlock } from '@wordpress/blocks';
import { getTagConfig, getDefaultContentType } from '../config/tags';

/**
 * Parse HTML string and convert to Universal Block structures
 * @param {string} html - HTML string to parse
 * @returns {Array} Array of block objects
 */
export function parseHTMLToBlocks(html) {
	if (!html || typeof html !== 'string') {
		return [];
	}

	// Create a temporary container to parse HTML
	const parser = new DOMParser();
	const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
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
		return createBlock('universal/element', {
			tagName: 'p',
			contentType: 'text',
			content: text,
			selfClosing: false
		});
	}

	// Handle element nodes
	if (node.nodeType === Node.ELEMENT_NODE) {
		const tagName = node.tagName.toLowerCase();
		const config = getTagConfig(tagName);

		// Extract attributes
		const globalAttrs = {};
		let className = '';

		for (const attr of node.attributes) {
			if (attr.name === 'class') {
				// WordPress uses className attribute for CSS classes
				className = attr.value;
			} else {
				globalAttrs[attr.name] = attr.value;
			}
		}

		// Determine content type and content
		let contentType;
		let content = '';
		let innerBlocks = [];

		// Check if element is self-closing/void
		const voidElements = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
		const isSelfClosing = voidElements.includes(tagName);

		if (isSelfClosing) {
			contentType = 'empty';
		} else if (hasOnlyTextContent(node)) {
			// Element contains only text content
			contentType = 'text';
			content = node.textContent;
		} else if (hasChildElements(node)) {
			// Element has child elements - convert to inner blocks
			contentType = 'blocks';
			innerBlocks = [];

			for (const childNode of node.childNodes) {
				const childBlock = nodeToBlock(childNode);
				if (childBlock) {
					innerBlocks.push(childBlock);
				}
			}
		} else {
			// Mixed content or complex structure - fall back to HTML
			contentType = 'html';
			content = node.innerHTML;
		}

		// Use config defaults if available, otherwise use determined values
		const finalContentType = config?.contentType || contentType;
		const finalSelfClosing = config?.selfClosing !== undefined ? config.selfClosing : isSelfClosing;

		// Create the block
		const blockAttributes = {
			tagName,
			contentType: finalContentType,
			selfClosing: finalSelfClosing,
			globalAttrs,
		};

		// Add className if present
		if (className) {
			blockAttributes.className = className;
		}

		// Add content based on type
		if (finalContentType === 'text' || finalContentType === 'html') {
			blockAttributes.content = content;
		}

		return createBlock('universal/element', blockAttributes, innerBlocks);
	}

	return null;
}

/**
 * Check if node contains only text content (no child elements)
 * @param {Element} element - DOM element to check
 * @returns {boolean}
 */
function hasOnlyTextContent(element) {
	for (const child of element.childNodes) {
		if (child.nodeType === Node.ELEMENT_NODE) {
			return false;
		}
	}
	return element.textContent.trim().length > 0;
}

/**
 * Check if element has child elements
 * @param {Element} element - DOM element to check
 * @returns {boolean}
 */
function hasChildElements(element) {
	for (const child of element.childNodes) {
		if (child.nodeType === Node.ELEMENT_NODE) {
			return true;
		}
		// Also consider non-empty text nodes as content
		if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
			return true;
		}
	}
	return false;
}

/**
 * Get appropriate block name for an element
 * @param {string} tagName - HTML tag name
 * @returns {string} Block name
 */
function getBlockName(tagName) {
	// All elements use the universal block
	return 'universal/element';
}

/**
 * Smart content type detection based on element structure
 * @param {Element} element - DOM element
 * @returns {string} Content type (text, blocks, html, empty)
 */
function detectContentType(element) {
	const tagName = element.tagName.toLowerCase();

	// Void elements
	const voidElements = ['img', 'br', 'hr', 'input', 'meta', 'link'];
	if (voidElements.includes(tagName)) {
		return 'empty';
	}

	// Text-only elements
	const textElements = ['p', 'span', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a'];
	if (textElements.includes(tagName) && hasOnlyTextContent(element)) {
		return 'text';
	}

	// Container elements with child elements
	const containerElements = ['div', 'section', 'article', 'header', 'footer', 'main', 'nav', 'aside'];
	if (containerElements.includes(tagName) && hasChildElements(element)) {
		return 'blocks';
	}

	// Default to HTML for complex content
	return 'html';
}