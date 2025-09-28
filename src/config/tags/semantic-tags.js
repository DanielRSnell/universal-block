/**
 * Semantic Tags Configuration
 *
 * Defines semantic HTML5 elements for document structure and meaning.
 */

import { createTagConfig, createSemanticTag, TAG_CATEGORIES, CONTENT_TYPES } from './base-tag';

export const semanticTags = {
	// Main document structure
	'main': createSemanticTag('main', 'Main Content', 'Primary content area of the document - use only once per page'),

	'article': createSemanticTag('article', 'Article', 'Independent, self-contained content (blog post, news article)'),

	'section': createSemanticTag('section', 'Section', 'Thematic grouping of content with a heading'),

	'aside': createSemanticTag('aside', 'Aside', 'Content indirectly related to main content (sidebar, pull quotes)'),

	// Navigation and headers/footers
	'header': createSemanticTag('header', 'Header', 'Introductory content or navigation aids'),

	'footer': createSemanticTag('footer', 'Footer', 'Footer content for its nearest sectioning element'),

	'nav': createSemanticTag('nav', 'Navigation', 'Section containing navigation links'),

	// Content grouping
	'div': createTagConfig({
		label: 'Division',
		category: TAG_CATEGORIES.SEMANTIC,
		description: 'Generic container for styling or scripting purposes',
		contentTypeOptions: [CONTENT_TYPES.BLOCKS, CONTENT_TYPES.TEXT, CONTENT_TYPES.HTML, CONTENT_TYPES.EMPTY],
		defaultContentType: CONTENT_TYPES.BLOCKS,
		selfClosing: false,
		validation: {
			warnings: ['Consider using semantic elements (section, article, aside) instead of div when appropriate']
		}
	}),

	// Lists
	'ul': createTagConfig({
		label: 'Unordered List',
		category: TAG_CATEGORIES.SEMANTIC,
		description: 'Unordered (bulleted) list',
		contentTypeOptions: [CONTENT_TYPES.BLOCKS, CONTENT_TYPES.HTML],
		defaultContentType: CONTENT_TYPES.BLOCKS,
		selfClosing: false,
		validation: {
			recommendations: {
				'always': ['Should contain only <li> elements as direct children']
			}
		}
	}),

	'ol': createTagConfig({
		label: 'Ordered List',
		category: TAG_CATEGORIES.SEMANTIC,
		description: 'Ordered (numbered) list',
		contentTypeOptions: [CONTENT_TYPES.BLOCKS, CONTENT_TYPES.HTML],
		defaultContentType: CONTENT_TYPES.BLOCKS,
		selfClosing: false,
		commonAttrs: ['style', 'id', 'class', 'start', 'type', 'reversed'],
		validation: {
			recommendations: {
				'always': ['Should contain only <li> elements as direct children']
			}
		}
	}),

	'li': createTagConfig({
		label: 'List Item',
		category: TAG_CATEGORIES.SEMANTIC,
		description: 'Item in an ordered or unordered list',
		contentTypeOptions: [CONTENT_TYPES.TEXT, CONTENT_TYPES.BLOCKS, CONTENT_TYPES.HTML],
		defaultContentType: CONTENT_TYPES.TEXT,
		selfClosing: false
	}),

	'dl': createSemanticTag('dl', 'Description List', 'List of term-description pairs'),

	'dt': createTagConfig({
		label: 'Description Term',
		category: TAG_CATEGORIES.SEMANTIC,
		description: 'Term in a description list',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false
	}),

	'dd': createTagConfig({
		label: 'Description Details',
		category: TAG_CATEGORIES.SEMANTIC,
		description: 'Description of a term in a description list',
		contentTypeOptions: [CONTENT_TYPES.TEXT, CONTENT_TYPES.BLOCKS],
		defaultContentType: CONTENT_TYPES.TEXT,
		selfClosing: false
	}),

	// Figures and captions
	'figure': createTagConfig({
		label: 'Figure',
		category: TAG_CATEGORIES.SEMANTIC,
		description: 'Self-contained content with optional caption (images, code, etc.)',
		contentTypeOptions: [CONTENT_TYPES.BLOCKS, CONTENT_TYPES.HTML],
		defaultContentType: CONTENT_TYPES.BLOCKS,
		selfClosing: false,
		validation: {
			recommendations: {
				'always': ['Consider including a <figcaption> element']
			}
		}
	}),

	'figcaption': createTagConfig({
		label: 'Figure Caption',
		category: TAG_CATEGORIES.SEMANTIC,
		description: 'Caption for a figure element',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false
	}),

	// Quotations
	'blockquote': createTagConfig({
		label: 'Block Quote',
		category: TAG_CATEGORIES.SEMANTIC,
		description: 'Extended quotation from another source',
		contentTypeOptions: [CONTENT_TYPES.TEXT, CONTENT_TYPES.BLOCKS],
		defaultContentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		commonAttrs: ['style', 'id', 'class', 'cite'],
		validation: {
			recommendations: {
				'always': ['Use cite attribute to reference the source']
			}
		}
	}),

	// Preformatted content
	'pre': createTagConfig({
		label: 'Preformatted Text',
		category: TAG_CATEGORIES.SEMANTIC,
		description: 'Preformatted text with preserved whitespace',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		validation: {
			warnings: ['Whitespace and line breaks are preserved exactly as written']
		}
	}),

	// Horizontal rule
	'hr': createTagConfig({
		label: 'Horizontal Rule',
		category: TAG_CATEGORIES.SEMANTIC,
		description: 'Thematic break or separator between content',
		contentType: null,
		selfClosing: true
	}),

	// Address
	'address': createTagConfig({
		label: 'Address',
		category: TAG_CATEGORIES.SEMANTIC,
		description: 'Contact information for the document or article author',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		validation: {
			warnings: ['Should contain contact information, not postal addresses']
		}
	}),

	// Details and summary (interactive semantic elements)
	'details': createTagConfig({
		label: 'Details',
		category: TAG_CATEGORIES.SEMANTIC,
		description: 'Disclosure widget for showing/hiding content',
		contentTypeOptions: [CONTENT_TYPES.BLOCKS, CONTENT_TYPES.HTML],
		defaultContentType: CONTENT_TYPES.BLOCKS,
		selfClosing: false,
		commonAttrs: ['style', 'id', 'class', 'open'],
		validation: {
			recommendations: {
				'always': ['Should contain a <summary> element as the first child']
			}
		}
	}),

	'summary': createTagConfig({
		label: 'Summary',
		category: TAG_CATEGORIES.SEMANTIC,
		description: 'Summary or caption for a details element',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false
	}),

	// Data and machine-readable content
	'data': createTagConfig({
		label: 'Data',
		category: TAG_CATEGORIES.SEMANTIC,
		description: 'Machine-readable equivalent of its content',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		inline: true,
		commonAttrs: ['style', 'id', 'class', 'value'],
		validation: {
			recommendations: {
				'always': ['Use value attribute for machine-readable data']
			}
		}
	})
};