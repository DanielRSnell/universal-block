/**
 * Structural Tags Configuration
 *
 * Defines structural and layout HTML elements.
 */

import { createTagConfig, TAG_CATEGORIES, CONTENT_TYPES, COMMON_ATTRS } from './base-tag';

export const structuralTags = {
	// Tables
	'table': createTagConfig({
		label: 'Table',
		category: TAG_CATEGORIES.STRUCTURAL,
		description: 'Tabular data display',
		contentTypeOptions: [CONTENT_TYPES.HTML, CONTENT_TYPES.BLOCKS],
		defaultContentType: CONTENT_TYPES.HTML,
		selfClosing: false,
		commonAttrs: [...COMMON_ATTRS.GLOBAL, 'border', 'cellpadding', 'cellspacing'],
		specialControls: ['TableBuilder'],
		validation: {
			recommendations: {
				'always': [
					'Use thead, tbody, and tfoot for better structure',
					'Include th elements for column headers',
					'Consider using CSS for styling instead of HTML attributes'
				]
			}
		}
	}),

	'thead': createTagConfig({
		label: 'Table Head',
		category: TAG_CATEGORIES.STRUCTURAL,
		description: 'Header section of a table',
		contentTypeOptions: [CONTENT_TYPES.HTML],
		defaultContentType: CONTENT_TYPES.HTML,
		selfClosing: false,
		validation: {
			recommendations: {
				'always': ['Should contain tr elements with th elements']
			},
			warnings: ['Thead elements should only be used inside table elements']
		}
	}),

	'tbody': createTagConfig({
		label: 'Table Body',
		category: TAG_CATEGORIES.STRUCTURAL,
		description: 'Body section of a table',
		contentTypeOptions: [CONTENT_TYPES.HTML],
		defaultContentType: CONTENT_TYPES.HTML,
		selfClosing: false,
		validation: {
			recommendations: {
				'always': ['Should contain tr elements with td elements']
			},
			warnings: ['Tbody elements should only be used inside table elements']
		}
	}),

	'tfoot': createTagConfig({
		label: 'Table Footer',
		category: TAG_CATEGORIES.STRUCTURAL,
		description: 'Footer section of a table',
		contentTypeOptions: [CONTENT_TYPES.HTML],
		defaultContentType: CONTENT_TYPES.HTML,
		selfClosing: false,
		validation: {
			recommendations: {
				'always': ['Should contain tr elements']
			},
			warnings: ['Tfoot elements should only be used inside table elements']
		}
	}),

	'tr': createTagConfig({
		label: 'Table Row',
		category: TAG_CATEGORIES.STRUCTURAL,
		description: 'Row in a table',
		contentTypeOptions: [CONTENT_TYPES.HTML],
		defaultContentType: CONTENT_TYPES.HTML,
		selfClosing: false,
		validation: {
			recommendations: {
				'always': ['Should contain td or th elements']
			},
			warnings: ['Tr elements should only be used inside table, thead, tbody, or tfoot elements']
		}
	}),

	'td': createTagConfig({
		label: 'Table Data Cell',
		category: TAG_CATEGORIES.STRUCTURAL,
		description: 'Data cell in a table',
		contentTypeOptions: [CONTENT_TYPES.TEXT, CONTENT_TYPES.BLOCKS],
		defaultContentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		commonAttrs: [...COMMON_ATTRS.GLOBAL, 'colspan', 'rowspan', 'headers'],
		validation: {
			warnings: ['Td elements should only be used inside tr elements']
		}
	}),

	'th': createTagConfig({
		label: 'Table Header Cell',
		category: TAG_CATEGORIES.STRUCTURAL,
		description: 'Header cell in a table',
		contentTypeOptions: [CONTENT_TYPES.TEXT, CONTENT_TYPES.BLOCKS],
		defaultContentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		commonAttrs: [...COMMON_ATTRS.GLOBAL, 'colspan', 'rowspan', 'scope', 'abbr'],
		validation: {
			recommendations: {
				'scope': ['Use scope attribute to clarify what the header applies to']
			},
			warnings: ['Th elements should only be used inside tr elements']
		}
	}),

	'caption': createTagConfig({
		label: 'Table Caption',
		category: TAG_CATEGORIES.STRUCTURAL,
		description: 'Caption or title for a table',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		validation: {
			warnings: ['Caption elements should only be used as the first child of table elements']
		}
	}),

	'colgroup': createTagConfig({
		label: 'Column Group',
		category: TAG_CATEGORIES.STRUCTURAL,
		description: 'Group of columns in a table',
		contentTypeOptions: [CONTENT_TYPES.HTML, CONTENT_TYPES.EMPTY],
		defaultContentType: CONTENT_TYPES.HTML,
		selfClosing: false,
		commonAttrs: [...COMMON_ATTRS.GLOBAL, 'span'],
		validation: {
			recommendations: {
				'always': ['Should contain col elements or use span attribute']
			},
			warnings: ['Colgroup elements should only be used inside table elements']
		}
	}),

	'col': createTagConfig({
		label: 'Column',
		category: TAG_CATEGORIES.STRUCTURAL,
		description: 'Column in a table',
		contentType: null,
		selfClosing: true,
		commonAttrs: [...COMMON_ATTRS.GLOBAL, 'span'],
		validation: {
			warnings: ['Col elements should only be used inside colgroup elements']
		}
	}),

	// Ruby annotation (for East Asian typography)
	'ruby': createTagConfig({
		label: 'Ruby',
		category: TAG_CATEGORIES.STRUCTURAL,
		description: 'Ruby annotation for East Asian typography',
		contentTypeOptions: [CONTENT_TYPES.HTML],
		defaultContentType: CONTENT_TYPES.HTML,
		selfClosing: false,
		inline: true,
		validation: {
			recommendations: {
				'always': ['Should contain rb, rt, and optionally rp elements']
			}
		}
	}),

	'rb': createTagConfig({
		label: 'Ruby Base',
		category: TAG_CATEGORIES.STRUCTURAL,
		description: 'Base text in ruby annotation',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		inline: true,
		validation: {
			warnings: ['Rb elements should only be used inside ruby elements']
		}
	}),

	'rt': createTagConfig({
		label: 'Ruby Text',
		category: TAG_CATEGORIES.STRUCTURAL,
		description: 'Ruby text annotation',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		inline: true,
		validation: {
			warnings: ['Rt elements should only be used inside ruby elements']
		}
	}),

	'rp': createTagConfig({
		label: 'Ruby Parentheses',
		category: TAG_CATEGORIES.STRUCTURAL,
		description: 'Parentheses for ruby fallback',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		inline: true,
		validation: {
			warnings: ['Rp elements should only be used inside ruby elements']
		}
	}),

	// Template
	'template': createTagConfig({
		label: 'Template',
		category: TAG_CATEGORIES.STRUCTURAL,
		description: 'HTML template that can be cloned and inserted into the document',
		contentTypeOptions: [CONTENT_TYPES.HTML, CONTENT_TYPES.BLOCKS],
		defaultContentType: CONTENT_TYPES.HTML,
		selfClosing: false,
		validation: {
			recommendations: {
				'always': ['Template content is inert until cloned via JavaScript']
			}
		}
	}),

	// Slot (for web components)
	'slot': createTagConfig({
		label: 'Slot',
		category: TAG_CATEGORIES.STRUCTURAL,
		description: 'Placeholder for web component content',
		contentTypeOptions: [CONTENT_TYPES.TEXT, CONTENT_TYPES.BLOCKS, CONTENT_TYPES.HTML],
		defaultContentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		commonAttrs: [...COMMON_ATTRS.GLOBAL, 'name'],
		validation: {
			recommendations: {
				'name': ['Use name attribute to create named slots']
			}
		}
	})
};