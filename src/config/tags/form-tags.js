/**
 * Form Tags Configuration
 *
 * Defines form-related HTML elements and controls.
 */

import { createTagConfig, createVoidTag, TAG_CATEGORIES, CONTENT_TYPES, COMMON_ATTRS } from './base-tag';

export const formTags = {
	// Form container
	'form': createTagConfig({
		label: 'Form',
		category: TAG_CATEGORIES.FORM,
		description: 'Interactive form for user input',
		contentTypeOptions: [CONTENT_TYPES.BLOCKS, CONTENT_TYPES.HTML],
		defaultContentType: CONTENT_TYPES.BLOCKS,
		selfClosing: false,
		commonAttrs: [
			...COMMON_ATTRS.GLOBAL,
			'action', 'method', 'enctype', 'target', 'autocomplete', 'novalidate'
		],
		validation: {
			recommendations: {
				'method': ['Specify method attribute (GET or POST)'],
				'action': ['Specify action attribute for form submission']
			}
		}
	}),

	// Input types
	'input': createVoidTag('input', 'Input', TAG_CATEGORIES.FORM, {
		description: 'Interactive form input control',
		commonAttrs: [
			...COMMON_ATTRS.GLOBAL,
			...COMMON_ATTRS.FORM,
			'type', 'placeholder', 'readonly', 'multiple', 'accept',
			'min', 'max', 'step', 'pattern', 'autocomplete'
		],
		specialControls: ['InputTypeSelector', 'InputValidation'],
		validation: {
			recommendations: {
				'type': ['Always specify input type for better user experience'],
				'label': ['Associate with a label element for accessibility']
			}
		}
	}),

	// Text areas
	'textarea': createTagConfig({
		label: 'Textarea',
		category: TAG_CATEGORIES.FORM,
		description: 'Multi-line text input control',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		commonAttrs: [
			...COMMON_ATTRS.GLOBAL,
			...COMMON_ATTRS.FORM,
			'rows', 'cols', 'wrap', 'placeholder', 'readonly', 'resize'
		],
		validation: {
			recommendations: {
				'label': ['Associate with a label element for accessibility'],
				'rows': ['Specify rows attribute for consistent height']
			}
		}
	}),

	// Select and options
	'select': createTagConfig({
		label: 'Select',
		category: TAG_CATEGORIES.FORM,
		description: 'Dropdown selection control',
		contentTypeOptions: [CONTENT_TYPES.HTML], // Should contain option/optgroup elements
		defaultContentType: CONTENT_TYPES.HTML,
		selfClosing: false,
		commonAttrs: [
			...COMMON_ATTRS.GLOBAL,
			...COMMON_ATTRS.FORM,
			'multiple', 'size', 'autocomplete'
		],
		specialControls: ['OptionBuilder'],
		validation: {
			recommendations: {
				'always': ['Should contain option or optgroup elements'],
				'label': ['Associate with a label element for accessibility']
			}
		}
	}),

	'option': createTagConfig({
		label: 'Option',
		category: TAG_CATEGORIES.FORM,
		description: 'Option in a select dropdown',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		commonAttrs: [...COMMON_ATTRS.GLOBAL, 'value', 'selected', 'disabled', 'label'],
		validation: {
			warnings: ['Option elements should only be used inside select or datalist elements']
		}
	}),

	'optgroup': createTagConfig({
		label: 'Option Group',
		category: TAG_CATEGORIES.FORM,
		description: 'Group of options in a select dropdown',
		contentTypeOptions: [CONTENT_TYPES.HTML], // Should contain option elements
		defaultContentType: CONTENT_TYPES.HTML,
		selfClosing: false,
		commonAttrs: [...COMMON_ATTRS.GLOBAL, 'label', 'disabled'],
		validation: {
			recommendations: {
				'always': ['Should contain option elements'],
				'label': ['Use label attribute to describe the option group']
			},
			warnings: ['Optgroup elements should only be used inside select elements']
		}
	}),

	// Labels and fieldsets
	'label': createTagConfig({
		label: 'Label',
		category: TAG_CATEGORIES.FORM,
		description: 'Label for a form control',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		commonAttrs: [...COMMON_ATTRS.GLOBAL, 'for'],
		validation: {
			recommendations: {
				'for': ['Use for attribute to associate with a form control, or wrap the control']
			}
		}
	}),

	'fieldset': createTagConfig({
		label: 'Fieldset',
		category: TAG_CATEGORIES.FORM,
		description: 'Group of related form controls',
		contentTypeOptions: [CONTENT_TYPES.BLOCKS, CONTENT_TYPES.HTML],
		defaultContentType: CONTENT_TYPES.BLOCKS,
		selfClosing: false,
		commonAttrs: [...COMMON_ATTRS.GLOBAL, 'disabled'],
		validation: {
			recommendations: {
				'always': ['Include a legend element as the first child for group description']
			}
		}
	}),

	'legend': createTagConfig({
		label: 'Legend',
		category: TAG_CATEGORIES.FORM,
		description: 'Caption for a fieldset group',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		validation: {
			warnings: ['Legend elements should only be used as the first child of fieldset elements']
		}
	}),

	// Other form elements
	'datalist': createTagConfig({
		label: 'Datalist',
		category: TAG_CATEGORIES.FORM,
		description: 'List of predefined options for input elements',
		contentTypeOptions: [CONTENT_TYPES.HTML], // Should contain option elements
		defaultContentType: CONTENT_TYPES.HTML,
		selfClosing: false,
		commonAttrs: [...COMMON_ATTRS.GLOBAL],
		validation: {
			recommendations: {
				'always': ['Should contain option elements with value attributes']
			}
		}
	}),

	'output': createTagConfig({
		label: 'Output',
		category: TAG_CATEGORIES.FORM,
		description: 'Result of a calculation or user action',
		contentType: CONTENT_TYPES.TEXT,
		selfClosing: false,
		commonAttrs: [...COMMON_ATTRS.GLOBAL, 'for', 'form', 'name']
	}),

	'progress': createTagConfig({
		label: 'Progress',
		category: TAG_CATEGORIES.FORM,
		description: 'Progress indicator',
		contentType: CONTENT_TYPES.TEXT, // Fallback content for unsupported browsers
		selfClosing: false,
		commonAttrs: [...COMMON_ATTRS.GLOBAL, 'value', 'max'],
		validation: {
			recommendations: {
				'max': ['Specify max attribute to define the completion value'],
				'aria-label': ['Provide accessible label for screen readers']
			}
		}
	}),

	'meter': createTagConfig({
		label: 'Meter',
		category: TAG_CATEGORIES.FORM,
		description: 'Scalar measurement within a known range (gauge)',
		contentType: CONTENT_TYPES.TEXT, // Fallback content for unsupported browsers
		selfClosing: false,
		commonAttrs: [...COMMON_ATTRS.GLOBAL, 'value', 'min', 'max', 'low', 'high', 'optimum'],
		validation: {
			recommendations: {
				'value': ['Value attribute is required'],
				'min-max': ['Define min and max for proper range display']
			}
		}
	})
};