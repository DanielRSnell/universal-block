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

export function BlockNamePanel({ blockName, elementType, setAttributes }) {
	const [useCustomName, setUseCustomName] = useState(!!blockName);

	// Get the default name based on element type
	const defaultName = ELEMENT_TYPE_NAMES[elementType] || __('Universal Element', 'universal-block');

	// Update block name when element type changes (only if not using custom name)
	useEffect(() => {
		if (!useCustomName) {
			setAttributes({ blockName: '' });
		}
	}, [elementType, useCustomName, setAttributes]);

	const handleToggleChange = (checked) => {
		setUseCustomName(checked);
		if (!checked) {
			// Reset to default (empty string means use element type)
			setAttributes({ blockName: '' });
		} else if (!blockName) {
			// Set current default as starting point for custom name
			setAttributes({ blockName: defaultName });
		}
	};

	const handleNameChange = (value) => {
		setAttributes({ blockName: value });
	};

	// Display name is either the custom name or the default based on element type
	const displayName = blockName || defaultName;

	return (
		<>
			<div style={{
				padding: '12px 0',
				borderBottom: '1px solid #e0e0e0',
				marginBottom: '12px',
				fontSize: '14px',
				fontWeight: '500'
			}}>
				{__('Block Name:', 'universal-block')} {displayName}
			</div>

			<ToggleControl
				label={__('Use custom block name', 'universal-block')}
				checked={useCustomName}
				onChange={handleToggleChange}
				help={useCustomName
					? __('Enter a custom name for this block', 'universal-block')
					: __('Block name will match the element type', 'universal-block')
				}
			/>

			{useCustomName && (
				<TextControl
					label={__('Custom Block Name', 'universal-block')}
					value={blockName}
					onChange={handleNameChange}
					placeholder={defaultName}
				/>
			)}
		</>
	);
}