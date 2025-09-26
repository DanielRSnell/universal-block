import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	TextControl,
	Button,
	Flex,
	FlexItem
} from '@wordpress/components';
import { useState } from '@wordpress/element';

export function AttributesPanel({ globalAttrs, setAttributes }) {
	const [newAttrName, setNewAttrName] = useState('');
	const [newAttrValue, setNewAttrValue] = useState('');

	const addAttribute = () => {
		if (newAttrName.trim() && newAttrValue.trim()) {
			const updatedAttrs = {
				...globalAttrs,
				[newAttrName.trim()]: newAttrValue.trim()
			};
			setAttributes({ globalAttrs: updatedAttrs });
			setNewAttrName('');
			setNewAttrValue('');
		}
	};

	const removeAttribute = (attrName) => {
		const updatedAttrs = { ...globalAttrs };
		delete updatedAttrs[attrName];
		setAttributes({ globalAttrs: updatedAttrs });
	};

	const updateAttribute = (attrName, newValue) => {
		const updatedAttrs = {
			...globalAttrs,
			[attrName]: newValue
		};
		setAttributes({ globalAttrs: updatedAttrs });
	};

	return (
		<PanelBody title={__('Global Attributes', 'universal-block')} initialOpen={false}>
			{Object.entries(globalAttrs).map(([name, value]) => (
				<Flex key={name} justify="space-between" align="flex-end">
					<FlexItem isBlock>
						<TextControl
							label={name}
							value={value}
							onChange={(newValue) => updateAttribute(name, newValue)}
						/>
					</FlexItem>
					<FlexItem>
						<Button
							isDestructive
							isSmall
							onClick={() => removeAttribute(name)}
						>
							{__('Remove', 'universal-block')}
						</Button>
					</FlexItem>
				</Flex>
			))}

			<hr />

			<TextControl
				label={__('Attribute Name', 'universal-block')}
				value={newAttrName}
				onChange={setNewAttrName}
				placeholder="id, class, data-*, aria-*, role..."
			/>

			<TextControl
				label={__('Attribute Value', 'universal-block')}
				value={newAttrValue}
				onChange={setNewAttrValue}
				placeholder="Enter value..."
			/>

			<Button
				isPrimary
				isSmall
				onClick={addAttribute}
				disabled={!newAttrName.trim() || !newAttrValue.trim()}
			>
				{__('Add Attribute', 'universal-block')}
			</Button>
		</PanelBody>
	);
}