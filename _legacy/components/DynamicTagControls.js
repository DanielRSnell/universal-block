/**
 * Dynamic Tag Controls Component
 *
 * Provides specialized controls for dynamic tags (loop, if, set) with ACE Editor
 * for Twig syntax input and tag-specific attribute management.
 */

import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	Panel,
	PanelBody,
	TextControl,
	Notice,
	Button,
	Flex,
	FlexItem
} from '@wordpress/components';

import { AceEditor } from './AceEditor';
import './DynamicTagControls.css';

// Dynamic tag configurations with their specific attributes
const DYNAMIC_TAG_CONFIGS = {
	loop: {
		label: __('Loop Configuration', 'universal-block'),
		description: __('Configure the loop data source and behavior', 'universal-block'),
		attributes: [
			{
				key: 'source',
				label: __('Data Source (Twig)', 'universal-block'),
				description: __('Raw Twig expression for the data to loop through', 'universal-block'),
				placeholder: 'post.meta(\'team_members\')',
				type: 'twig',
				required: true
			}
		],
		examples: [
			{
				label: __('ACF Repeater Field', 'universal-block'),
				value: 'post.meta(\'team_members\')'
			},
			{
				label: __('WordPress Posts Query', 'universal-block'),
				value: 'posts({post_type: \'product\', posts_per_page: 6})'
			},
			{
				label: __('Menu Items', 'universal-block'),
				value: 'site.menu(\'primary\').items'
			},
			{
				label: __('Categories', 'universal-block'),
				value: 'get_categories({hide_empty: true})'
			}
		]
	},
	if: {
		label: __('Conditional Configuration', 'universal-block'),
		description: __('Configure the condition for displaying content', 'universal-block'),
		attributes: [
			{
				key: 'source',
				label: __('Condition (Twig)', 'universal-block'),
				description: __('Raw Twig expression that evaluates to true/false', 'universal-block'),
				placeholder: 'user.ID > 0',
				type: 'twig',
				required: true
			}
		],
		examples: [
			{
				label: __('User Authentication', 'universal-block'),
				value: 'user.ID > 0'
			},
			{
				label: __('First Loop Item', 'universal-block'),
				value: 'loop.index == 0'
			},
			{
				label: __('Featured Content', 'universal-block'),
				value: 'post.meta(\'featured\')'
			},
			{
				label: __('User Capabilities', 'universal-block'),
				value: 'user.ID > 0 and user.has_cap(\'edit_posts\')'
			},
			{
				label: __('Post Has Thumbnail', 'universal-block'),
				value: 'post.thumbnail'
			}
		]
	},
	set: {
		label: __('Variable Configuration', 'universal-block'),
		description: __('Configure the variable name and value assignment', 'universal-block'),
		attributes: [
			{
				key: 'variable',
				label: __('Variable Name', 'universal-block'),
				description: __('Name of the variable to create', 'universal-block'),
				placeholder: 'my_variable',
				type: 'text',
				required: true
			},
			{
				key: 'value',
				label: __('Value (Twig)', 'universal-block'),
				description: __('Raw Twig expression for the variable value', 'universal-block'),
				placeholder: 'post.meta(\'custom_field\')',
				type: 'twig',
				required: true
			}
		],
		examples: [
			{
				label: __('User Count', 'universal-block'),
				variable: 'user_count',
				value: 'users|length'
			},
			{
				label: __('Featured Status', 'universal-block'),
				variable: 'is_featured',
				value: 'post.meta(\'featured\')'
			},
			{
				label: __('Current Date', 'universal-block'),
				variable: 'today',
				value: '\'now\'|date(\'Y-m-d\')'
			},
			{
				label: __('Greeting Message', 'universal-block'),
				variable: 'greeting',
				value: 'user.ID > 0 ? \'Hello \' ~ user.display_name : \'Welcome Guest\''
			}
		]
	}
};

export function DynamicTagControls({ tagName, attributes, setAttributes }) {
	const [showExamples, setShowExamples] = useState(false);

	// Get the configuration for the current dynamic tag
	const config = DYNAMIC_TAG_CONFIGS[tagName];

	if (!config) {
		return null; // Not a dynamic tag
	}

	// Get current attribute values
	const getCurrentValue = (attrKey) => {
		return attributes.globalAttrs?.[attrKey] || '';
	};

	// Update attribute value
	const updateAttribute = (attrKey, value) => {
		const newGlobalAttrs = {
			...attributes.globalAttrs,
			[attrKey]: value
		};

		setAttributes({ globalAttrs: newGlobalAttrs });
	};

	// Apply example values
	const applyExample = (example) => {
		const newGlobalAttrs = { ...attributes.globalAttrs };

		config.attributes.forEach(attr => {
			if (example[attr.key]) {
				newGlobalAttrs[attr.key] = example[attr.key];
			}
		});

		setAttributes({ globalAttrs: newGlobalAttrs });
		setShowExamples(false);
	};

	return (
		<Panel className="dynamic-tag-controls">
			<PanelBody title={config.label} initialOpen={true}>
				<div className="dynamic-tag-description">
					<p>{config.description}</p>
				</div>

				{/* Render each attribute input */}
				{config.attributes.map((attr) => (
					<div key={attr.key} className="dynamic-attribute-control">
						{attr.type === 'twig' ? (
							<div className="twig-input-container">
								<label className="twig-input-label">
									<strong>{attr.label}</strong>
									{attr.required && <span className="required"> *</span>}
								</label>
								<p className="twig-input-description">{attr.description}</p>
								<AceEditor
									value={getCurrentValue(attr.key)}
									onChange={(value) => updateAttribute(attr.key, value)}
									placeholder={attr.placeholder}
									rows={6}
									mode="twig"
									theme="monokai"
									className="dynamic-twig-editor"
								/>
							</div>
						) : (
							<TextControl
								label={attr.label}
								value={getCurrentValue(attr.key)}
								onChange={(value) => updateAttribute(attr.key, value)}
								placeholder={attr.placeholder}
								help={attr.description}
								required={attr.required}
							/>
						)}
					</div>
				))}

				{/* Examples Section */}
				{config.examples && config.examples.length > 0 && (
					<div className="dynamic-examples-section">
						<Flex justify="space-between" align="center">
							<FlexItem>
								<h4 className="examples-title">{__('Examples', 'universal-block')}</h4>
							</FlexItem>
							<FlexItem>
								<Button
									variant="tertiary"
									size="small"
									onClick={() => setShowExamples(!showExamples)}
								>
									{showExamples ? __('Hide', 'universal-block') : __('Show', 'universal-block')}
								</Button>
							</FlexItem>
						</Flex>

						{showExamples && (
							<div className="examples-list">
								{config.examples.map((example, index) => (
									<div key={index} className="example-item">
										<div className="example-header">
											<span className="example-label">{example.label}</span>
											<Button
												variant="secondary"
												size="small"
												onClick={() => applyExample(example)}
											>
												{__('Use This', 'universal-block')}
											</Button>
										</div>
										<div className="example-code">
											{tagName === 'set' ? (
												<>
													<code>variable: {example.variable}</code><br />
													<code>value: {example.value}</code>
												</>
											) : (
												<code>source: {example.value}</code>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{/* Validation Notice */}
				{tagName === 'loop' && !getCurrentValue('source') && (
					<Notice status="warning" isDismissible={false}>
						{__('Loop requires a data source to function properly.', 'universal-block')}
					</Notice>
				)}

				{tagName === 'if' && !getCurrentValue('source') && (
					<Notice status="warning" isDismissible={false}>
						{__('Conditional statements require a condition to evaluate.', 'universal-block')}
					</Notice>
				)}

				{tagName === 'set' && (!getCurrentValue('variable') || !getCurrentValue('value')) && (
					<Notice status="warning" isDismissible={false}>
						{__('Variable assignment requires both a variable name and value.', 'universal-block')}
					</Notice>
				)}
			</PanelBody>

			{/* Usage Information */}
			<PanelBody title={__('Usage Information', 'universal-block')} initialOpen={false}>
				<div className="usage-info">
					{tagName === 'loop' && (
						<>
							<h4>{__('Loop Context Variables', 'universal-block')}</h4>
							<ul>
								<li><code>item</code> - {__('Current item in the loop', 'universal-block')}</li>
								<li><code>loop.index</code> - {__('Current iteration index (0-based)', 'universal-block')}</li>
								<li><code>loop.first</code> - {__('True if first iteration', 'universal-block')}</li>
								<li><code>loop.last</code> - {__('True if last iteration', 'universal-block')}</li>
								<li><code>loop.length</code> - {__('Total number of items', 'universal-block')}</li>
							</ul>
						</>
					)}

					{tagName === 'if' && (
						<>
							<h4>{__('Conditional Operators', 'universal-block')}</h4>
							<ul>
								<li><code>==</code> - {__('Equals', 'universal-block')}</li>
								<li><code>!=</code> - {__('Not equals', 'universal-block')}</li>
								<li><code>&gt;</code> - {__('Greater than', 'universal-block')}</li>
								<li><code>&lt;</code> - {__('Less than', 'universal-block')}</li>
								<li><code>and</code> - {__('Logical AND', 'universal-block')}</li>
								<li><code>or</code> - {__('Logical OR', 'universal-block')}</li>
								<li><code>not</code> - {__('Logical NOT', 'universal-block')}</li>
							</ul>
						</>
					)}

					{tagName === 'set' && (
						<>
							<h4>{__('Variable Usage', 'universal-block')}</h4>
							<p>{__('After setting a variable, use it anywhere in your template:', 'universal-block')}</p>
							<code>{'{{ ' + (getCurrentValue('variable') || 'my_variable') + ' }}'}</code>
						</>
					)}
				</div>
			</PanelBody>
		</Panel>
	);
}