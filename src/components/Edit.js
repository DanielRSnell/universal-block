import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	BlockControls,
	RichText,
	InnerBlocks,
	useBlockProps,
	useInnerBlocksProps
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import {
	PanelBody,
	SelectControl,
	TextControl,
	Button,
	ButtonGroup,
	ToggleControl,
	ToolbarGroup
} from '@wordpress/components';
import ImageSettingsPanel from './ImageSettingsPanel';
import LinkSettingsPanel from './LinkSettingsPanel';
import TagNameToolbar from './TagNameToolbar';
import DynamicTagSettings from './DynamicTagSettings';
import PlainClassesManager from './PlainClassesManager';

export default function Edit({ attributes, setAttributes, clientId }) {
	const {
		tagName = 'div',
		contentType = 'blocks',
		content = '',
		globalAttrs = {},
		isSelfClosing = false,
		blockName = '',
		blockContext = ''
	} = attributes;

	// Get className from attributes (WordPress-managed)
	const className = attributes.className || '';

	// Filter out 'class' from globalAttrs - we use className instead (WordPress official way)
	const filteredGlobalAttrs = Object.keys(globalAttrs).reduce((acc, key) => {
		if (key !== 'class') {
			acc[key] = globalAttrs[key];
		}
		return acc;
	}, {});

	// Add block ID if not already set
	if (!filteredGlobalAttrs.id) {
		filteredGlobalAttrs.id = `block-${clientId}`;
	}

	// For blocks content type, apply blockProps directly to the element (no wrapper)
	const blockProps = useBlockProps({
		className: className,
		...filteredGlobalAttrs
	});

	// For blocks content type, use innerBlocksProps merged with our element props
	const innerBlocksProps = useInnerBlocksProps(blockProps, {
		renderAppender: InnerBlocks.ButtonBlockAppender
	});

	const contentTypeOptions = [
		{ label: 'Blocks (Container)', value: 'blocks' },
		{ label: 'Text', value: 'text' },
		{ label: 'HTML', value: 'html' },
		{ label: 'Empty', value: 'empty' }
	];

	const { replaceBlocks, updateBlockAttributes } = useDispatch('core/block-editor');

	// Update block label based on blockName or tagName
	useEffect(() => {
		const label = blockName || tagName || 'Element';
		// Update the block's metadata to show custom label
		updateBlockAttributes(clientId, {
			metadata: {
				name: label
			}
		});
	}, [blockName, tagName, clientId, updateBlockAttributes]);

	// Open HTML editor popup
	const openHtmlEditor = () => {
		if (typeof window.openUniversalBlockHtmlEditor === 'function') {
			window.openUniversalBlockHtmlEditor();
		} else {
			console.error('HTML Editor not available. Make sure editor tweaks are loaded.');
		}
	};

	// Open Attributes editor popup
	const openAttributesEditor = () => {
		if (typeof window.openUniversalBlockAttributesEditor === 'function') {
			window.openUniversalBlockAttributesEditor();
		} else {
			console.error('Attributes Editor not available. Make sure editor tweaks are loaded.');
		}
	};

	// Convert HTML to blocks
	const convertToBlocks = () => {
		if (!content) {
			alert('No HTML content to convert');
			return;
		}

		// Check if parser is available
		if (typeof window.universal === 'undefined' || typeof window.universal.html2blocks !== 'function') {
			console.error('HTML to blocks parser not loaded');
			alert('HTML parser not available. Please refresh the page.');
			return;
		}

		// Parse HTML to block data using custom parser
		const blockData = window.universal.html2blocks(content);

		if (!blockData || blockData.length === 0) {
			alert('Could not convert HTML to blocks');
			return;
		}

		// Recursively convert block data to WordPress blocks
		const convertBlockData = (data) => {
			const innerBlocks = data.innerBlocks && data.innerBlocks.length > 0
				? data.innerBlocks.map(convertBlockData)
				: [];
			return createBlock(data.name, data.attributes, innerBlocks);
		};

		const innerBlocks = blockData.map(convertBlockData);

		// Convert current block to blocks contentType with the parsed content as innerBlocks
		setAttributes({
			contentType: 'blocks',
			content: ''
		});

		// Use replaceInnerBlocks to add the parsed blocks as children
		const { replaceInnerBlocks } = wp.data.dispatch('core/block-editor');
		replaceInnerBlocks(clientId, innerBlocks);
	};

	// Convert blocks to HTML
	const convertToHtml = () => {
		const { getBlock } = wp.data.select('core/block-editor');
		const block = getBlock(clientId);

		if (!block || !block.innerBlocks || block.innerBlocks.length === 0) {
			alert('No blocks to convert');
			return;
		}

		// Check if serializer is available
		if (typeof window.universal === 'undefined' || typeof window.universal.blocks2html !== 'function') {
			console.error('Blocks to HTML serializer not loaded');
			alert('Serializer not available. Please refresh the page.');
			return;
		}

		// Serialize innerBlocks to HTML using blocks2html from lib/blocks2html.js
		const html = window.universal.blocks2html(block.innerBlocks);

		if (!html) {
			alert('Could not convert blocks to HTML');
			return;
		}

		// Convert current block to HTML contentType with the serialized content
		setAttributes({
			contentType: 'html',
			content: html
		});

		// Clear innerBlocks
		const { replaceInnerBlocks } = wp.data.dispatch('core/block-editor');
		replaceInnerBlocks(clientId, []);
	};

	const TagElement = tagName;

	// Build element props for non-blocks content types
	const elementProps = {
		...blockProps,
	};

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<TagNameToolbar
						tagName={tagName}
						onChange={(value) => setAttributes({ tagName: value })}
					/>
				</ToolbarGroup>
			</BlockControls>

			<InspectorControls>
				{/* Plain Classes Manager - Always visible at top */}
				<div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
					<PlainClassesManager
						className={attributes.className || ''}
						onChange={(newClassName) => setAttributes({ className: newClassName })}
					/>
				</div>

				<PanelBody title={__('Element Settings', 'universal-block')}>
					<TextControl
						label={__('Block Name', 'universal-block')}
						value={blockName}
						onChange={(value) => setAttributes({ blockName: value })}
						placeholder={tagName}
						help={__('Optional: Override the block label (defaults to tag name)', 'universal-block')}
					/>

					<TextControl
						label={__('HTML Tag', 'universal-block')}
						value={tagName}
						onChange={(value) => setAttributes({ tagName: value })}
						help={__('Enter any HTML tag name (e.g., div, section, custom-element)', 'universal-block')}
					/>

					<SelectControl
						label={__('Content Type', 'universal-block')}
						value={contentType}
						options={contentTypeOptions}
						onChange={(value) => setAttributes({ contentType: value })}
					/>

					<ToggleControl
						label={__('Self Closing', 'universal-block')}
						checked={isSelfClosing}
						onChange={(value) => setAttributes({ isSelfClosing: value })}
						help={__('Render as self-closing tag (e.g., <img />)', 'universal-block')}
					/>

					<Button
						variant="secondary"
						onClick={openAttributesEditor}
						style={{ marginTop: '8px', width: '100%' }}
					>
						<i className="ri-braces-line" style={{ marginRight: '6px' }}></i>
						{__('Edit Attributes', 'universal-block')}
					</Button>

					{contentType === 'blocks' && (
						<Button
							variant="secondary"
							onClick={convertToHtml}
							style={{ marginTop: '8px', width: '100%' }}
						>
							<i className="ri-code-line" style={{ marginRight: '6px' }}></i>
							{__('To HTML', 'universal-block')}
						</Button>
					)}

					{contentType === 'html' && (
						<ButtonGroup style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
							<Button
								variant="secondary"
								onClick={openHtmlEditor}
								style={{ flex: 1 }}
							>
								<i className="ri-code-line" style={{ marginRight: '6px' }}></i>
								{__('Edit HTML', 'universal-block')}
							</Button>
							{content && (
								<Button
									variant="secondary"
									onClick={convertToBlocks}
									style={{ flex: 1 }}
								>
									<i className="ri-stack-line" style={{ marginRight: '6px' }}></i>
									{__('To Blocks', 'universal-block')}
								</Button>
							)}
						</ButtonGroup>
					)}
				</PanelBody>

				{/* Block Context Panel */}
				<PanelBody title={__('Block Context', 'universal-block')} initialOpen={false}>
					{/* Dynamic Tag Settings - for loop, if, set tags */}
					<DynamicTagSettings
						tagName={tagName}
						globalAttrs={globalAttrs}
						setAttributes={setAttributes}
					/>

					{/* Show context name input only if NOT a dynamic tag (loop, if, set handle their own context) */}
					{!['loop', 'if', 'set'].includes(tagName) && (
						<>
							<TextControl
								label={__('Context Name', 'universal-block')}
								value={blockContext}
								onChange={(value) => setAttributes({ blockContext: value })}
								placeholder="e.g., product_gallery, related_posts"
								help={__('Optional: Set a custom context name to add specific Timber/Twig data to this block. Use lowercase with underscores.', 'universal-block')}
							/>
							{blockContext && (
								<div style={{
									marginTop: '12px',
									padding: '12px',
									background: '#f0f0f0',
									borderRadius: '4px',
									fontSize: '12px',
									fontFamily: 'Monaco, Menlo, monospace'
								}}>
									<strong>Filter Hook:</strong><br/>
									<code style={{ display: 'block', marginTop: '4px', wordBreak: 'break-all' }}>
										universal_block/context/{blockContext}
									</code>
								</div>
							)}
						</>
					)}
				</PanelBody>

				{/* Image Settings Panel - only show for img tags */}
				{tagName === 'img' && (
					<ImageSettingsPanel
						globalAttrs={globalAttrs}
						setAttributes={setAttributes}
					/>
				)}

				{/* Link Settings Panel - only show for a tags */}
				{tagName === 'a' && (
					<LinkSettingsPanel
						globalAttrs={globalAttrs}
						setAttributes={setAttributes}
					/>
				)}
			</InspectorControls>

			{/* Render based on content type */}
			{contentType === 'blocks' && (
				<TagElement {...innerBlocksProps}>
					{innerBlocksProps.children}
				</TagElement>
			)}

			{contentType === 'text' && (
				<RichText
					tagName={tagName}
					value={content}
					onChange={(value) => setAttributes({ content: value })}
					placeholder={__('Enter text...', 'universal-block')}
					{...elementProps}
				/>
			)}

			{contentType === 'html' && (
				<TagElement
					{...elementProps}
					dangerouslySetInnerHTML={{ __html: content || '<p style="color: #999; padding: 20px; text-align: center;">No HTML content. Use the sidebar to open the HTML editor.</p>' }}
				/>
			)}

			{contentType === 'empty' && (
				<TagElement {...elementProps} />
			)}
		</>
	);
}
