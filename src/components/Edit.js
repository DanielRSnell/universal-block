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
	TextareaControl,
	Button,
	ButtonGroup,
	ToggleControl,
	ToolbarGroup
} from '@wordpress/components';
import ImageSettingsPanel from './ImageSettingsPanel';
import LinkSettingsPanel from './LinkSettingsPanel';
import TagNameToolbar from './TagNameToolbar';
import PlainClassesManager from './PlainClassesManager';
import TwigControlsPanel from './TwigControlsPanel';

export default function Edit({ attributes, setAttributes, clientId }) {
	const {
		tagName = 'div',
		contentType = 'blocks',
		content = '',
		globalAttrs = {},
		isSelfClosing = false,
		blockName = '',
		dynamicPreview = false
	} = attributes;

	// Check if this block is currently selected and get full block data
	const { isSelected, block } = useSelect(
		(select) => {
			const selectedBlockId = select('core/block-editor').getSelectedBlockClientId();
			return {
				isSelected: selectedBlockId === clientId,
				block: select('core/block-editor').getBlock(clientId)
			};
		},
		[clientId]
	);

	// Debug: Log block when selected
	useEffect(() => {
		if (isSelected && block) {
			console.log(block);
		}
	}, [isSelected]);

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

	// Update block label based on blockName, tagName, and Twig controls
	useEffect(() => {
		const {
			loopSource,
			conditionalVisibility,
			setVariable
		} = attributes;

		// Determine dynamic type
		let dynamicType = '';
		if (setVariable) {
			dynamicType = 'Set';
		} else if (loopSource) {
			dynamicType = 'Loop';
		} else if (conditionalVisibility) {
			dynamicType = 'If';
		}

		// Build label: "TagName | Dynamic" or just "TagName" or custom blockName
		let label = blockName || tagName || 'Element';
		if (dynamicType) {
			label = `${tagName} | ${dynamicType}`;
		}

		// Update the block's metadata to show custom label
		updateBlockAttributes(clientId, {
			metadata: {
				name: label
			}
		});
	}, [blockName, tagName, attributes.loopSource, attributes.conditionalVisibility, attributes.setVariable, clientId, updateBlockAttributes]);

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
			<ToolbarGroup>
				<Button
					icon={
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
							<path d="M12 3C7.58 3 4 4.79 4 7v10c0 2.21 3.59 4 8 4s8-1.79 8-4V7c0-2.21-3.58-4-8-4zm6 14c0 .55-2.69 2-6 2s-6-1.45-6-2v-2.23c1.61.78 3.72 1.23 6 1.23s4.39-.45 6-1.23V17zm0-4.55c-1.3.95-3.58 1.55-6 1.55s-4.7-.6-6-1.55V9.64c1.47.83 3.61 1.36 6 1.36s4.53-.53 6-1.36v2.81zM12 9C8.69 9 6 7.55 6 7s2.69-2 6-2 6 1.45 6 2-2.69 2-6 2z" />
						</svg>
					}
					label={__('Toggle Dynamic Preview', 'universal-block')}
					isPressed={dynamicPreview}
					onClick={() => setAttributes({ dynamicPreview: !dynamicPreview })}
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


					{contentType === 'text' && (
						<TextareaControl
							label={__('Text Content', 'universal-block')}
							value={content}
							onChange={(value) => setAttributes({ content: value })}
							rows={4}
							help={__('Enter plain text content for this element', 'universal-block')}
							style={{ marginTop: '12px' }}
						/>
					)}
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

				{/* Twig Controls Panel - available on all blocks */}
				<TwigControlsPanel
					attributes={attributes}
					setAttributes={setAttributes}
				/>
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
