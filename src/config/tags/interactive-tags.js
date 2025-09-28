/**
 * Interactive Tags Configuration
 *
 * Defines interactive HTML elements (links, buttons, etc.).
 */

import { createTagConfig, TAG_CATEGORIES, CONTENT_TYPES, COMMON_ATTRS } from './base-tag';

export const interactiveTags = {
	// Links
	'a': createTagConfig({
		label: 'Link',
		category: TAG_CATEGORIES.INTERACTIVE,
		description: 'Hyperlink to another page, file, email, or location',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		inline: true,
		commonAttrs: [...COMMON_ATTRS.GLOBAL, 'href', 'target', 'rel', 'download', 'hreflang'],
		specialControls: ['LinkSettings'],
		validation: {
			recommendations: {
				'target="_blank"': ['Use rel="noopener noreferrer" for security'],
				'external-links': ['Consider using rel="external" for external links']
			},
			warnings: ['Links without href attribute are not focusable by keyboard']
		}
	}),

	// Buttons
	'button': createTagConfig({
		label: 'Button',
		category: TAG_CATEGORIES.INTERACTIVE,
		description: 'Clickable button element',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		commonAttrs: [
			...COMMON_ATTRS.GLOBAL,
			...COMMON_ATTRS.INTERACTIVE,
			'type', 'disabled', 'autofocus', 'form', 'formaction', 'formmethod', 'formtarget'
		],
		validation: {
			recommendations: {
				'always': ['Provide clear, descriptive button text'],
				'type': ['Specify button type (button, submit, reset) explicitly']
			}
		}
	}),

	// Interactive disclosure elements (already in semantic, but interactive nature)
	'summary': createTagConfig({
		label: 'Summary',
		category: TAG_CATEGORIES.INTERACTIVE,
		description: 'Clickable summary for details element',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		validation: {
			warnings: ['Summary elements should only be used as the first child of details elements']
		}
	}),

	// Menu and navigation
	'menu': createTagConfig({
		label: 'Menu',
		category: TAG_CATEGORIES.INTERACTIVE,
		description: 'List of commands or options',
		contentTypeOptions: [CONTENT_TYPES.BLOCKS, CONTENT_TYPES.HTML],
		defaultContentType: CONTENT_TYPES.BLOCKS,
		selfClosing: false,
		commonAttrs: [...COMMON_ATTRS.GLOBAL, 'type'],
		validation: {
			recommendations: {
				'always': ['Consider using nav element for site navigation instead']
			}
		}
	}),

	// Dialog
	'dialog': createTagConfig({
		label: 'Dialog',
		category: TAG_CATEGORIES.INTERACTIVE,
		description: 'Modal dialog or popup window',
		contentTypeOptions: [CONTENT_TYPES.BLOCKS, CONTENT_TYPES.HTML],
		defaultContentType: CONTENT_TYPES.BLOCKS,
		selfClosing: false,
		commonAttrs: [...COMMON_ATTRS.GLOBAL, 'open'],
		validation: {
			recommendations: {
				'always': [
					'Include proper ARIA labels for accessibility',
					'Ensure dialog can be closed with keyboard'
				]
			}
		}
	})
};