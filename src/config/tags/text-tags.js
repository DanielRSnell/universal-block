/**
 * Text Tags Configuration
 *
 * Defines text-based HTML elements for content and formatting.
 */

import { createTagConfig, createTextTag, TAG_CATEGORIES, CONTENT_TYPES } from './base-tag';

export const textTags = {
	// Paragraphs and basic text
	'p': createTextTag('p', 'Paragraph', 'Standard paragraph text block'),

	'span': createTagConfig({
		label: 'Span',
		category: TAG_CATEGORIES.TEXT,
		description: 'Inline text container for styling or semantic purposes',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		inline: true
	}),

	// Headings
	'h1': createTextTag('h1', 'Heading 1', 'Main page heading - use only once per page'),
	'h2': createTextTag('h2', 'Heading 2', 'Major section heading'),
	'h3': createTextTag('h3', 'Heading 3', 'Subsection heading'),
	'h4': createTextTag('h4', 'Heading 4', 'Minor heading'),
	'h5': createTextTag('h5', 'Heading 5', 'Small heading'),
	'h6': createTextTag('h6', 'Heading 6', 'Smallest heading'),

	// Text formatting and emphasis
	'strong': createTagConfig({
		label: 'Strong',
		category: TAG_CATEGORIES.TEXT,
		description: 'Important text with strong emphasis',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		inline: true
	}),

	'em': createTagConfig({
		label: 'Emphasis',
		category: TAG_CATEGORIES.TEXT,
		description: 'Emphasized text (usually italic)',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		inline: true
	}),

	'b': createTagConfig({
		label: 'Bold',
		category: TAG_CATEGORIES.TEXT,
		description: 'Bold text for stylistic purposes',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		inline: true
	}),

	'i': createTagConfig({
		label: 'Italic',
		category: TAG_CATEGORIES.TEXT,
		description: 'Italic text for stylistic purposes',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		inline: true
	}),

	'u': createTagConfig({
		label: 'Underline',
		category: TAG_CATEGORIES.TEXT,
		description: 'Underlined text',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		inline: true,
		validation: {
			warnings: ['Avoid underlines as they can be confused with links']
		}
	}),

	's': createTagConfig({
		label: 'Strikethrough',
		category: TAG_CATEGORIES.TEXT,
		description: 'Text with a strikethrough (line through)',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		inline: true
	}),

	// Semantic text elements
	'mark': createTagConfig({
		label: 'Mark',
		category: TAG_CATEGORIES.TEXT,
		description: 'Highlighted or marked text',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		inline: true
	}),

	'small': createTagConfig({
		label: 'Small',
		category: TAG_CATEGORIES.TEXT,
		description: 'Fine print or smaller text',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		inline: true
	}),

	'sub': createTagConfig({
		label: 'Subscript',
		category: TAG_CATEGORIES.TEXT,
		description: 'Subscript text (H₂O)',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		inline: true
	}),

	'sup': createTagConfig({
		label: 'Superscript',
		category: TAG_CATEGORIES.TEXT,
		description: 'Superscript text (E=mc²)',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		inline: true
	}),

	// Code and technical text
	'code': createTagConfig({
		label: 'Code',
		category: TAG_CATEGORIES.TEXT,
		description: 'Inline code snippet',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		inline: true,
		commonAttrs: ['style', 'id', 'class']
	}),

	'kbd': createTagConfig({
		label: 'Keyboard',
		category: TAG_CATEGORIES.TEXT,
		description: 'Keyboard input text (Ctrl+C)',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		inline: true
	}),

	'samp': createTagConfig({
		label: 'Sample Output',
		category: TAG_CATEGORIES.TEXT,
		description: 'Sample program output',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		inline: true
	}),

	'var': createTagConfig({
		label: 'Variable',
		category: TAG_CATEGORIES.TEXT,
		description: 'Mathematical or programming variable',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		inline: true
	}),

	// Quotations and citations
	'q': createTagConfig({
		label: 'Inline Quote',
		category: TAG_CATEGORIES.TEXT,
		description: 'Short inline quotation',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		inline: true,
		commonAttrs: ['style', 'id', 'class', 'cite']
	}),

	'cite': createTagConfig({
		label: 'Citation',
		category: TAG_CATEGORIES.TEXT,
		description: 'Reference to a creative work',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		inline: true
	}),

	// Abbreviations and definitions
	'abbr': createTagConfig({
		label: 'Abbreviation',
		category: TAG_CATEGORIES.TEXT,
		description: 'Abbreviation or acronym',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		inline: true,
		commonAttrs: ['style', 'id', 'class', 'title'],
		validation: {
			recommendations: {
				'always': ['Use title attribute to provide full text']
			}
		}
	}),

	'dfn': createTagConfig({
		label: 'Definition',
		category: TAG_CATEGORIES.TEXT,
		description: 'Term being defined',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		inline: true
	}),

	// Time and data
	'time': createTagConfig({
		label: 'Time',
		category: TAG_CATEGORIES.TEXT,
		description: 'Date or time value',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		inline: true,
		commonAttrs: ['style', 'id', 'class', 'datetime'],
		validation: {
			recommendations: {
				'always': ['Use datetime attribute for machine-readable format']
			}
		}
	}),

	// Line breaks
	'br': createTagConfig({
		label: 'Line Break',
		category: TAG_CATEGORIES.TEXT,
		description: 'Single line break',
		contentType: null,
		selfClosing: true,
		inline: true,
		validation: {
			warnings: ['Avoid using multiple <br> tags for spacing - use CSS instead']
		}
	})
};