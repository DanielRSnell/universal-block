/**
 * Tag Controls Component
 *
 * Replaces ElementTypeControls with a flexible tag-based system.
 * Provides tag selection, content type configuration, and smart defaults.
 */

import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	SelectControl,
	TextControl,
	ToggleControl,
	Notice,
	Flex,
	FlexItem,
	Button,
	__experimentalHStack as HStack
} from '@wordpress/components';

import {
	getTagConfig,
	getTagOptions,
	shouldShowContentTypeSelector,
	getContentTypeOptions,
	getDefaultContentType,
	validateTagContentType
} from '../config/tags';

import { getCategoryOptions } from '../config/tags/categories';

// Content type labels for UI
const CONTENT_TYPE_LABELS = {
	text: __('Text', 'universal-block'),
	blocks: __('Blocks', 'universal-block'),
	html: __('HTML', 'universal-block'),
	empty: __('Empty', 'universal-block')
};

export function TagControls({ attributes, setAttributes }) {
	const { tagName, contentType, selfClosing } = attributes;
	const [tagFilter, setTagFilter] = useState('all');
	const [customTag, setCustomTag] = useState('');
	const [showCustomInput, setShowCustomInput] = useState(false);

	// Get current tag configuration
	const tagConfig = getTagConfig(tagName);
	const validation = validateTagContentType(tagName, contentType);

	// Handle tag selection
	const handleTagChange = (newTag) => {
		if (newTag === 'custom') {
			setShowCustomInput(true);
			return;
		}

		const config = getTagConfig(newTag);
		const updates = { tagName: newTag };

		// Auto-configure based on tag configuration
		if (config) {
			// Set content type
			if (config.contentType) {
				updates.contentType = config.contentType;
			} else if (config.defaultContentType) {
				updates.contentType = config.defaultContentType;
			} else {
				updates.contentType = getDefaultContentType(newTag);
			}

			// Set self-closing
			updates.selfClosing = config.selfClosing;

			console.log(`🏷️ Selected tag: ${newTag}`, { config, updates });
		} else {
			// Fallback for unknown tags
			updates.contentType = getDefaultContentType(newTag);
			updates.selfClosing = false;
		}

		setAttributes(updates);
		setShowCustomInput(false);
	};

	// Handle custom tag input
	const handleCustomTagSubmit = () => {
		if (customTag.trim()) {
			handleTagChange(customTag.toLowerCase().trim());
			setCustomTag('');
		}
	};

	// Handle content type change
	const handleContentTypeChange = (newContentType) => {
		setAttributes({ contentType: newContentType });
	};

	// Get tag options based on current filter
	const tagOptions = getTagOptions(tagFilter);

	// Add custom option
	const allTagOptions = [
		...tagOptions,
		{ label: __('Custom tag...', 'universal-block'), value: 'custom' }
	];

	// Get content type options for current tag
	const contentTypeOptions = getContentTypeOptions(tagName).map(type => ({
		label: CONTENT_TYPE_LABELS[type] || type,
		value: type
	}));

	return (
		<div className=\"tag-controls\">
			{/* Tag Filter */}
			<SelectControl
				label={__('Filter Tags', 'universal-block')}
				value={tagFilter}
				options={getCategoryOptions()}
				onChange={setTagFilter}
				help={__('Filter available tags by category (does not affect block structure)', 'universal-block')}
			/>

			{/* Tag Selection */}
			{!showCustomInput ? (
				<SelectControl
					label={__('HTML Tag', 'universal-block')}
					value={tagName}
					options={allTagOptions}
					onChange={handleTagChange}
					help={tagConfig?.description || __('Select an HTML tag for this element', 'universal-block')}
				/>
			) : (
				<Flex>
					<FlexItem>
						<TextControl
							label={__('Custom Tag', 'universal-block')}
							value={customTag}
							onChange={setCustomTag}
							placeholder={__('Enter tag name (e.g., my-component)', 'universal-block')}
							help={__('Custom elements must contain a hyphen', 'universal-block')}
						/>
					</FlexItem>
					<FlexItem>
						<HStack style={{ marginTop: '28px' }}>
							<Button
								variant=\"primary\"
								size=\"small\"
								onClick={handleCustomTagSubmit}
								disabled={!customTag.trim()}
							>
								{__('Apply', 'universal-block')}
							</Button>
							<Button
								variant=\"secondary\"
								size=\"small\"
								onClick={() => {
									setShowCustomInput(false);
									setCustomTag('');
								}}
							>
								{__('Cancel', 'universal-block')}
							</Button>
						</HStack>
					</FlexItem>
				</Flex>
			)}

			{/* Content Type Selection (if applicable) */}
			{shouldShowContentTypeSelector(tagName) && (
				<SelectControl
					label={__('Content Type', 'universal-block')}
					value={contentType}
					options={contentTypeOptions}
					onChange={handleContentTypeChange}
					help={__('Choose what type of content this element should contain', 'universal-block')}
				/>
			)}

			{/* Self-closing toggle (for advanced users) */}
			{tagConfig && !tagConfig.contentType && (
				<ToggleControl
					label={__('Self-closing tag', 'universal-block')}
					checked={selfClosing}
					onChange={(value) => setAttributes({ selfClosing: value })}
					help={__('Whether this element is self-closing (void element)', 'universal-block')}
				/>
			)}

			{/* Validation Messages */}
			{!validation.valid && validation.errors.length > 0 && (
				<Notice status=\"error\" isDismissible={false}>
					<ul style={{ margin: 0, paddingLeft: '20px' }}>
						{validation.errors.map((error, index) => (
							<li key={index}>{error}</li>
						))}
					</ul>
				</Notice>
			)}

			{validation.warnings.length > 0 && (
				<Notice status=\"warning\" isDismissible={false}>
					<ul style={{ margin: 0, paddingLeft: '20px' }}>
						{validation.warnings.map((warning, index) => (
							<li key={index}>{warning}</li>
						))}
					</ul>
				</Notice>
			)}

			{/* Tag Information */}
			{tagConfig && tagConfig.validation?.recommendations && (
				<Notice status=\"info\" isDismissible={false}>
					<strong>{__('Recommendations:', 'universal-block')}</strong>
					<ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
						{Object.entries(tagConfig.validation.recommendations).map(([context, recommendations]) => (
							recommendations.map((rec, index) => (
								<li key={`${context}-${index}`}>{rec}</li>
							))
						))}
					</ul>
				</Notice>
			)}
		</div>
	);
}