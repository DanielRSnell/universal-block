/**
 * Common Tags Configuration
 *
 * Defines the most commonly used HTML elements with simple configurations.
 */

import { createTagConfig, TAG_CATEGORIES, CONTENT_TYPES } from './base-tag';

export const commonTags = {
	// Most common elements
	'div': createTagConfig({
		label: 'Div',
		category: 'common',
		description: 'Generic container element',
		contentTypeOptions: [CONTENT_TYPES.BLOCKS, CONTENT_TYPES.TEXT, CONTENT_TYPES.HTML],
		defaultContentType: CONTENT_TYPES.BLOCKS,
		selfClosing: false
	}),

	'p': createTagConfig({
		label: 'Paragraph',
		category: 'common',
		description: 'Text paragraph',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false
	}),

	'span': createTagConfig({
		label: 'Span',
		category: 'common',
		description: 'Inline text container',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		inline: true
	}),

	'h1': createTagConfig({
		label: 'Heading 1',
		category: 'common',
		description: 'Main page heading',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false
	}),

	'h2': createTagConfig({
		label: 'Heading 2',
		category: 'common',
		description: 'Section heading',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false
	}),

	'h3': createTagConfig({
		label: 'Heading 3',
		category: 'common',
		description: 'Subsection heading',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false
	}),

	'a': createTagConfig({
		label: 'Link',
		category: 'common',
		description: 'Hyperlink',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		inline: true,
		commonAttrs: ['href', 'target', 'rel']
	}),

	'img': createTagConfig({
		label: 'Image',
		category: 'common',
		description: 'Image element',
		contentType: null,
		selfClosing: true,
		commonAttrs: ['src', 'alt', 'width', 'height']
	}),

	'button': createTagConfig({
		label: 'Button',
		category: 'common',
		description: 'Clickable button',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		commonAttrs: ['type', 'disabled']
	})
};