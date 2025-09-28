/**
 * Tag Controls Component
 *
 * Replaces ElementTypeControls with a flexible tag-based system.
 * Provides tag selection, content type configuration, and smart defaults.
 */

import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
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
	const { tagName, contentType, selfClosing, uiState } = attributes;
	const tagFilter = uiState?.tagCategory || 'common';

	// Initialize uiState if missing or incorrect - but don't override user selections
	useEffect(() => {
		// Only initialize if uiState is completely missing
		if (!uiState) {
			console.log('🔧 Initializing uiState for block');
			// Determine correct category based on current tag
			let correctCategory = 'common';

			if (tagName === 'custom-element' || !getTagConfig(tagName)) {
				correctCategory = 'custom';
			} else {
				const config = getTagConfig(tagName);
				if (config?.category) {
					correctCategory = config.category;
				}
			}

			const newUiState = {
				tagCategory: correctCategory,
				selectedTagName: tagName,
				selectedContentType: contentType
			};
			console.log('🔧 Setting initial uiState:', newUiState);

			setAttributes({
				uiState: newUiState
			});
		}
	}, [tagName, contentType, uiState, setAttributes]);

	// Update tag filter and save to attributes
	const setTagFilter = (newCategory) => {
		setAttributes({
			uiState: {
				...uiState,
				tagCategory: newCategory
			}
		});
	};

	// Get current tag configuration
	const tagConfig = getTagConfig(tagName);

	// Simplified tag change handler
	const handleTagChange = (newTag) => {
		const config = getTagConfig(newTag);
		const updates = { tagName: newTag };

		// For custom elements, provide flexible defaults
		if (tagFilter === 'custom') {
			// Don't auto-set content type for custom elements, let user choose
			// Only set default if there's no existing content type
			if (!contentType) {
				updates.contentType = 'text'; // Default to text, but user can change
			}
			// Don't override existing content type for custom elements
			updates.selfClosing = false; // Default to not self-closing for custom elements
		} else {
			// Standard tag configuration
			if (config) {
				if (config.contentType !== undefined) {
					// Handle null contentType for void elements
					updates.contentType = config.contentType === null ? 'empty' : config.contentType;
				} else if (config.defaultContentType) {
					updates.contentType = config.defaultContentType;
				}
				updates.selfClosing = config.selfClosing;
			} else {
				// Safe defaults for unknown tags
				updates.contentType = 'text';
				updates.selfClosing = false;
			}
		}

		// Update uiState to remember selections
		updates.uiState = {
			...uiState,
			selectedTagName: newTag,
			selectedContentType: updates.contentType || contentType
		};

		console.log(`🏷️ Switching to tag: ${newTag}`, updates);
		setAttributes(updates);
	};

	// Handle content type change
	const handleContentTypeChange = (newContentType) => {
		console.log(`📝 Content type changing from "${contentType}" to "${newContentType}"`);
		const updates = {
			contentType: newContentType,
			uiState: {
				...uiState,
				selectedContentType: newContentType
			}
		};

		// Clear content when switching to blocks type to prevent conflicts
		if (newContentType === 'blocks') {
			updates.content = '';
			console.log('🧹 Clearing content attribute for blocks content type');
		}

		console.log('📝 Content type updates:', updates);
		setAttributes(updates);
	};

	// Get tag options based on current filter
	const tagOptions = getTagOptions(tagFilter);

	// Get content type options for current tag (simplified)
	const contentTypeOptions = getContentTypeOptions(tagName).map(type => ({
		label: CONTENT_TYPE_LABELS[type] || type,
		value: type
	}));

	return (
		<div className="tag-controls">
			{/* Tag Filter */}
			<SelectControl
				label={__('Tag Category', 'universal-block')}
				value={tagFilter}
				options={getCategoryOptions()}
				onChange={setTagFilter}
				help={__('Filter tags by category', 'universal-block')}
			/>

			{/* Tag Selection - show text input for custom, select for others */}
			{tagFilter === 'custom' ? (
				<TextControl
					label={__('HTML Tag Name', 'universal-block')}
					value={tagName}
					onChange={handleTagChange}
					placeholder={__('Enter tag name (e.g., span, custom-element)', 'universal-block')}
					help={__('Enter any valid HTML tag name', 'universal-block')}
				/>
			) : (
				<SelectControl
					label={__('HTML Tag', 'universal-block')}
					value={tagName}
					options={tagOptions}
					onChange={handleTagChange}
					help={tagConfig?.description || __('Select an HTML tag', 'universal-block')}
				/>
			)}

			{/* Content Type Selection - always show for custom elements, conditionally for others */}
			{(tagFilter === 'custom' || shouldShowContentTypeSelector(tagName)) && (
				<SelectControl
					label={__('Content Type', 'universal-block')}
					value={contentType}
					options={tagFilter === 'custom' ? [
						{ label: __('Text', 'universal-block'), value: 'text' },
						{ label: __('Blocks', 'universal-block'), value: 'blocks' },
						{ label: __('HTML', 'universal-block'), value: 'html' },
						{ label: __('Empty', 'universal-block'), value: 'empty' }
					] : contentTypeOptions}
					onChange={handleContentTypeChange}
					help={__('What type of content goes inside this element', 'universal-block')}
				/>
			)}

			{/* Self-Closing Toggle - show for debugging and advanced users */}
			<ToggleControl
				label={__('Self-Closing Tag', 'universal-block')}
				checked={selfClosing}
				onChange={(value) => setAttributes({ selfClosing: value })}
				help={__('Whether this tag is self-closing (e.g., <img />, <hr />)', 'universal-block')}
			/>
		</div>
	);
}