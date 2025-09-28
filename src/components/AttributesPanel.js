import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	TextControl,
	Button,
	Flex,
	FlexItem,
	Icon,
	BaseControl
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { trash, chevronLeft } from '@wordpress/icons';

export function AttributesPanel({ globalAttrs, setAttributes }) {
	const [newAttrName, setNewAttrName] = useState('');
	const [newAttrValue, setNewAttrValue] = useState('');
	const [selectedAttr, setSelectedAttr] = useState(null);
	const [showAddForm, setShowAddForm] = useState(false);

	const updateAttribute = (attrName, attrValue) => {
		const updatedAttrs = { ...globalAttrs, [attrName]: attrValue };
		setAttributes({ globalAttrs: updatedAttrs });
	};

	const removeAttribute = (attrName) => {
		const updatedAttrs = { ...globalAttrs };
		delete updatedAttrs[attrName];
		setAttributes({ globalAttrs: updatedAttrs });
		setSelectedAttr(null);
	};

	const addNewAttribute = () => {
		if (newAttrName.trim() && newAttrValue.trim()) {
			const updatedAttrs = { ...globalAttrs, [newAttrName.trim()]: newAttrValue.trim() };
			setAttributes({ globalAttrs: updatedAttrs });
			setNewAttrName('');
			setNewAttrValue('');
			setShowAddForm(false);
		}
	};

	const attributeEntries = Object.entries(globalAttrs);

	return (
		<PanelBody title={__('Global Attributes', 'universal-block')} initialOpen={false}>
			{!selectedAttr ? (
				<>
					{!showAddForm ? (
						<Button
							variant="tertiary"
							onClick={() => setShowAddForm(true)}
							style={{
								display: 'block',
								width: '100%',
								textAlign: 'left',
								justifyContent: 'flex-start',
								marginBottom: '8px',
								padding: '12px 16px',
								border: '1px solid #949494',
								borderRadius: '0',
								backgroundColor: '#fff'
							}}
						>
							<div style={{
								fontSize: '11px',
								fontWeight: '500',
								textTransform: 'uppercase',
								color: '#1e1e1e',
								fontFamily: 'monospace'
							}}>
								{__('Add New Attribute', 'universal-block')}
							</div>
						</Button>
					) : (
						<div style={{ marginBottom: '16px', padding: '16px', border: '1px solid #949494', backgroundColor: '#fff' }}>
							<div style={{ marginBottom: '16px' }}>
								<Button
									variant="link"
									onClick={() => setShowAddForm(false)}
									icon={chevronLeft}
									style={{
										padding: '0',
										minHeight: '0',
										height: 'auto',
										fontSize: '13px',
										color: '#007cba'
									}}
								>
									{__('Back', 'universal-block')}
								</Button>
							</div>

							<div style={{ marginBottom: '8px' }}>
								<TextControl
									label={__('Attribute Name', 'universal-block')}
									value={newAttrName}
									onChange={setNewAttrName}
									placeholder="id, class, data-*, aria-*, role..."
									__nextHasNoMarginBottom
								/>
							</div>
							<div style={{ marginBottom: '8px' }}>
								<TextControl
									label={__('Attribute Value', 'universal-block')}
									value={newAttrValue}
									onChange={setNewAttrValue}
									placeholder="Enter value..."
									__nextHasNoMarginBottom
								/>
							</div>
							<Button
								variant="primary"
								size="small"
								onClick={addNewAttribute}
								disabled={!newAttrName.trim() || !newAttrValue.trim()}
							>
								{__('Add Attribute', 'universal-block')}
							</Button>
						</div>
					)}

					{attributeEntries.length > 0 && (
						<BaseControl
							id="current-attributes"
							label={`${__('Current Attributes', 'universal-block')} (${attributeEntries.length})`}
						>
							{attributeEntries.map(([attrName, attrValue]) => (
								<Button
									key={attrName}
									variant="tertiary"
									onClick={() => setSelectedAttr(attrName)}
									style={{
										display: 'block',
										width: '100%',
										textAlign: 'left',
										justifyContent: 'flex-start',
										marginBottom: '8px',
										padding: '12px 16px',
										border: '1px solid #949494',
										borderRadius: '0',
										backgroundColor: '#fff'
									}}
								>
									<div style={{
										fontSize: '11px',
										fontWeight: '500',
										textTransform: 'uppercase',
										color: '#1e1e1e',
										fontFamily: 'monospace'
									}}>
										{attrName}
									</div>
								</Button>
							))}
						</BaseControl>
					)}

					{attributeEntries.length === 0 && (
						<div style={{
							color: '#757575',
							fontSize: '13px',
							fontStyle: 'italic',
							padding: '16px 0'
						}}>
							{__('No attributes added yet', 'universal-block')}
						</div>
					)}
				</>
			) : (
				<>
					<div style={{ marginBottom: '16px' }}>
						<Button
							variant="link"
							onClick={() => setSelectedAttr(null)}
							icon={chevronLeft}
							style={{
								padding: '0',
								minHeight: '0',
								height: 'auto',
								fontSize: '13px',
								color: '#007cba'
							}}
						>
							{__('Back to attributes', 'universal-block')}
						</Button>
					</div>

					<BaseControl
						id={`edit-${selectedAttr}`}
						label={selectedAttr.toUpperCase()}
						style={{ marginBottom: '16px' }}
					>
						<TextControl
							value={globalAttrs[selectedAttr] || ''}
							onChange={(value) => updateAttribute(selectedAttr, value)}
							__nextHasNoMarginBottom
						/>
					</BaseControl>

					<Button
						variant="link"
						isDestructive
						icon={trash}
						onClick={() => removeAttribute(selectedAttr)}
						style={{
							minHeight: '0',
							height: 'auto',
							padding: '4px 0',
							fontSize: '12px'
						}}
					>
						{__('Remove', 'universal-block')}
					</Button>
				</>
			)}
		</PanelBody>
	);
}