/**
 * Custom Tags Configuration
 *
 * Defines custom elements, web components, and framework-specific tags.
 */

import { createTagConfig, TAG_CATEGORIES, CONTENT_TYPES, COMMON_ATTRS } from './base-tag';

export const customTags = {
	// Generic web component placeholder
	'web-component': createTagConfig({
		label: 'Web Component',
		category: TAG_CATEGORIES.CUSTOM,
		description: 'Generic web component element',
		contentTypeOptions: [CONTENT_TYPES.HTML, CONTENT_TYPES.TEXT, CONTENT_TYPES.BLOCKS, CONTENT_TYPES.EMPTY],
		defaultContentType: CONTENT_TYPES.HTML,
		selfClosing: false,
		commonAttrs: [...COMMON_ATTRS.GLOBAL],
		validation: {
			recommendations: {
				'always': [
					'Ensure the web component is registered before use',
					'Use semantic naming with hyphens (my-component)',
					'Consider providing fallback content'
				]
			},
			warnings: [
				'Custom elements must contain a hyphen in their name',
				'Ensure the component is defined before using it'
			]
		}
	}),

	// Common framework elements (for documentation purposes)
	'custom-element': createTagConfig({
		label: 'Custom Element',
		category: TAG_CATEGORIES.CUSTOM,
		description: 'User-defined custom element',
		contentTypeOptions: [CONTENT_TYPES.HTML, CONTENT_TYPES.TEXT, CONTENT_TYPES.BLOCKS, CONTENT_TYPES.EMPTY],
		defaultContentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		validation: {
			recommendations: {
				'naming': [
					'Use kebab-case with hyphens (my-custom-element)',
					'Start with your organization/project prefix'
				]
			},
			warnings: [
				'Custom element names must contain at least one hyphen',
				'Avoid names that conflict with existing HTML elements'
			]
		}
	}),

	// Iframe (technically standard HTML but often used for custom content)
	'iframe': createTagConfig({
		label: 'Iframe',
		category: TAG_CATEGORIES.CUSTOM,
		description: 'Embedded frame for external content',
		contentType: CONTENT_TYPES.TEXT, // Fallback content only
		selfClosing: false,
		commonAttrs: [
			...COMMON_ATTRS.GLOBAL,
			'src', 'srcdoc', 'width', 'height', 'loading', 'sandbox',
			'allow', 'allowfullscreen', 'referrerpolicy'
		],
		specialControls: ['IframeSettings'],
		validation: {
			recommendations: {
				'sandbox': ['Use sandbox attribute to restrict iframe capabilities'],
				'loading': ['Consider loading="lazy" for performance'],
				'title': ['Provide descriptive title for accessibility']
			},
			warnings: [
				'Iframes can impact page performance and security',
				'Ensure the source is trusted and uses HTTPS'
			]
		}
	}),

	// Script (for inline scripts or external resources)
	'script': createTagConfig({
		label: 'Script',
		category: TAG_CATEGORIES.CUSTOM,
		description: 'JavaScript code or reference to external script',
		contentTypeOptions: [CONTENT_TYPES.HTML, CONTENT_TYPES.EMPTY],
		defaultContentType: CONTENT_TYPES.HTML,
		selfClosing: false,
		commonAttrs: [
			...COMMON_ATTRS.GLOBAL,
			'src', 'type', 'async', 'defer', 'crossorigin', 'integrity',
			'nomodule', 'referrerpolicy'
		],
		validation: {
			recommendations: {
				'type': ['Specify type="module" for ES6 modules'],
				'defer': ['Use defer for non-critical scripts'],
				'async': ['Use async for independent scripts']
			},
			warnings: [
				'Inline scripts can impact security (CSP) and performance',
				'External scripts should use integrity attribute for security'
			]
		}
	}),

	// Style (for inline CSS)
	'style': createTagConfig({
		label: 'Style',
		category: TAG_CATEGORIES.CUSTOM,
		description: 'CSS styles for the document',
		contentType: CONTENT_TYPES.HTML,
		selfClosing: false,
		commonAttrs: [...COMMON_ATTRS.GLOBAL, 'type', 'media'],
		validation: {
			recommendations: {
				'media': ['Use media attribute for responsive styles'],
				'external': ['Consider using external stylesheets for better performance']
			},
			warnings: [
				'Inline styles can impact performance and maintainability',
				'Style blocks in body are not recommended'
			]
		}
	}),

	// NoScript (fallback for non-JavaScript users)
	'noscript': createTagConfig({
		label: 'NoScript',
		category: TAG_CATEGORIES.CUSTOM,
		description: 'Content shown when JavaScript is disabled',
		contentTypeOptions: [CONTENT_TYPES.HTML, CONTENT_TYPES.TEXT, CONTENT_TYPES.BLOCKS],
		defaultContentType: CONTENT_TYPES.HTML,
		selfClosing: false,
		validation: {
			recommendations: {
				'always': ['Provide meaningful fallback content for JavaScript functionality']
			}
		}
	}),

	// Wbr (word break opportunity)
	'wbr': createTagConfig({
		label: 'Word Break',
		category: TAG_CATEGORIES.CUSTOM,
		description: 'Word break opportunity for long words',
		contentType: null,
		selfClosing: true,
		inline: true,
		validation: {
			recommendations: {
				'usage': ['Use sparingly - CSS word-break property is often better']
			}
		}
	})
};