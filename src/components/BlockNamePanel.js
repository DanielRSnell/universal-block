import { __ } from '@wordpress/i18n';
import { TextControl, ToggleControl } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';

const ELEMENT_TYPE_NAMES = {
	text: __('Text', 'universal-block'),
	heading: __('Heading', 'universal-block'),
	link: __('Link', 'universal-block'),
	image: __('Image', 'universal-block'),
	rule: __('Rule', 'universal-block'),
	container: __('Container', 'universal-block')
};

export function BlockNamePanel({ blockName, elementType, setAttributes, tagName, globalAttrs }) {
	// Get the default name based on element type or tag name
	let defaultName;
	if (tagName === 'set' && globalAttrs?.variable) {
		defaultName = `Set - ${globalAttrs.variable}`;
	} else if (tagName === 'if' && globalAttrs?.source) {
		defaultName = `If - ${globalAttrs.source}`;
	} else if (tagName === 'loop' && (globalAttrs?.name || globalAttrs?.source)) {
		const displayName = globalAttrs.name || globalAttrs.source;
		defaultName = `Loop - ${displayName}`;
	} else {
		defaultName = ELEMENT_TYPE_NAMES[elementType] || __('Universal Element', 'universal-block');
	}

	const handleNameChange = (value) => {
		// If the value matches the default, clear it to use auto-generated name
		if (value === defaultName) {
			setAttributes({ blockName: '' });
		} else {
			setAttributes({ blockName: value });
		}
	};

	// Display name is either the custom name or the default based on element type
	const displayName = blockName || defaultName;

	return (
		<TextControl
			label={__('Block Name', 'universal-block')}
			value={displayName}
			onChange={handleNameChange}
			placeholder={defaultName}
			help={blockName
				? __('Custom name - clear to use auto-generated name', 'universal-block')
				: __('Auto-generated name - edit to customize', 'universal-block')
			}
		/>
	);
}