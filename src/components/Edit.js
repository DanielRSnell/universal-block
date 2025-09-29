import React from 'react';
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	BlockControls,
	RichText,
	InnerBlocks,
	useBlockProps,
	useInnerBlocksProps
} from '@wordpress/block-editor';
import { rawHandler, createBlock } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import {
	PanelBody,
	ToolbarGroup,
	ToolbarDropdownMenu,
	Button
} from '@wordpress/components';
import { TagControls } from './TagControls';
import { AttributesPanel } from './AttributesPanel';
import { BlockNamePanel } from './BlockNamePanel';
import { ClassesPanel } from './ClassesPanel';
import { AceEditor } from './AceEditor';
import { ImagePanel } from './ImagePanel';
import { DynamicPreviewPanel, ContextDebugPanel, PreviewPerformancePanel } from './PreviewControls';
import { getTagConfig, getDefaultContentType } from '../config/tags';
import { parseHTMLToBlocks } from '../utils/htmlToBlocks';
import { parseBlocksToHTML } from '../utils/blocksToHtml';

// Global clipboard for copy/paste functionality
let universalBlockClipboard = {
	classes: '',
	attributes: {},
	styles: {}
};

// Content type mapping for backwards compatibility during migration
const LEGACY_ELEMENT_TYPE_MAPPING = {
	'text': { tagName: 'p', contentType: 'text' },
	'heading': { tagName: 'h2', contentType: 'text' },
	'link': { tagName: 'a', contentType: 'text' },
	'image': { tagName: 'img', contentType: 'empty' },
	'rule': { tagName: 'hr', contentType: 'empty' },
	'svg': { tagName: 'svg', contentType: 'html' },
	'container': { tagName: 'div', contentType: 'blocks' }
};

export default function Edit({ attributes, setAttributes, clientId }) {
	const {
		blockName,
		elementType, // Legacy - will be migrated
		tagName,
		contentType,
		content,
		selfClosing,
		globalAttrs,
		className,
		uiState
	} = attributes;

	// Preview state
	const [isLivePreview, setIsLivePreview] = useState(false);
	const [previewHtml, setPreviewHtml] = useState('');

	// Get block editor functions for conversion
	const { replaceBlocks } = useDispatch('core/block-editor');

	// Get selected block ID and raw block data for debugging
	const { selectedBlockId, rawBlockData } = useSelect((select) => {
		const selectedId = select('core/block-editor').getSelectedBlockClientId();
		const blockData = selectedId ? select('core/block-editor').getBlock(selectedId) : null;

		return {
			selectedBlockId: selectedId,
			rawBlockData: blockData
		};
	}, []);

	// Debug logging when this block is selected
	useEffect(() => {
		if (selectedBlockId === clientId && rawBlockData) {
			console.group('🔍 Universal Block Debug - RAW Block Object');
			console.log('📦 Client ID:', rawBlockData.clientId);
			console.log('🔷 Block Name:', rawBlockData.name);
			console.log('🆔 Is Valid:', rawBlockData.isValid);
			console.log('📋 RAW ATTRIBUTES OBJECT:', rawBlockData.attributes);
			console.log('🧱 Inner Blocks Count:', rawBlockData.innerBlocks?.length || 0);
			if (rawBlockData.innerBlocks?.length > 0) {
				console.log('🧱 Inner Blocks:', rawBlockData.innerBlocks);
			}
			console.log('🔍 COMPLETE RAW BLOCK OBJECT:', rawBlockData);
			console.groupEnd();
		}
	}, [selectedBlockId, clientId, rawBlockData]);

	// Convert HTML to inner blocks
	const convertToInnerBlocks = () => {
		if (!content || currentContentType !== 'html') return;

		try {
			const parsedBlocks = parseHTMLToBlocks(content);

			if (parsedBlocks.length > 0) {
				// Change current block to blocks content type and add the parsed blocks as inner blocks
				setAttributes({
					contentType: 'blocks',
					content: '' // Clear HTML content since we're converting to blocks
				});

				// Replace this block with a blocks-type version containing the parsed blocks
				const newBlock = createBlock('universal/element', {
					...attributes,
					contentType: 'blocks',
					content: ''
				}, parsedBlocks);

				replaceBlocks(clientId, newBlock);
			}
		} catch (error) {
			console.error('Failed to convert HTML to blocks:', error);
		}
	};

	// Convert inner blocks to HTML
	const convertToHTML = () => {
		if (currentContentType !== 'blocks') return;

		// Use the rawBlockData we already have from the existing useSelect
		if (!rawBlockData || !rawBlockData.innerBlocks || rawBlockData.innerBlocks.length === 0) {
			return;
		}

		try {
			// Convert inner blocks to HTML
			const htmlContent = parseBlocksToHTML(rawBlockData.innerBlocks);

			if (htmlContent) {
				// Change to HTML content type and set the generated HTML
				setAttributes({
					contentType: 'html',
					content: htmlContent
				});
			}
		} catch (error) {
			console.error('Failed to convert blocks to HTML:', error);
		}
	};

	// Simple migration: only migrate once when needed, don't break existing blocks
	const currentTagName = tagName || 'div';
	const currentContentType = contentType || getDefaultContentType(currentTagName);
	const currentSelfClosing = selfClosing || false;

	// Debug the contentType issue
	console.log('🔍 ContentType Debug:', {
		rawContentType: contentType,
		currentContentType: currentContentType,
		defaultWouldBe: getDefaultContentType(currentTagName),
		tagName: currentTagName
	});

	// Only migrate if we have legacy elementType but no contentType (one-time migration)
	if (elementType && !contentType) {
		const mapping = LEGACY_ELEMENT_TYPE_MAPPING[elementType];
		if (mapping) {
			// Do migration asynchronously to avoid render conflicts
			setTimeout(() => {
				setAttributes({
					tagName: tagName || mapping.tagName,
					contentType: mapping.contentType,
					selfClosing: elementType === 'image' || elementType === 'rule',
					elementType: undefined // Remove legacy attribute
				});
			}, 0);
		}
	}

	// Get element-specific attributes from globalAttrs
	const src = globalAttrs?.src || '';
	const alt = globalAttrs?.alt || '';

	const blockProps = useBlockProps();

	// Always call useInnerBlocksProps to avoid conditional hook calls
	const { children, ...innerBlocksProps } = useInnerBlocksProps(blockProps, {
		renderAppender: InnerBlocks.DefaultBlockAppender
	});

	// Determine if we should use blocks content
	const isBlocksContent = currentContentType === 'blocks';

	const renderContentByType = () => {
		switch (currentContentType) {
			case 'text':
				return (
					<RichText
						tagName={currentTagName}
						value={content}
						onChange={(value) => setAttributes({ content: value })}
						placeholder={__('Enter your text...', 'universal-block')}
					/>
				);

			case 'blocks':
				return children;

			case 'html':
				// Empty HTML content placeholder (HTML with content is handled in main return)
				return (
					<div
						style={{
							background: '#f0f0f0',
							border: '1px dashed #ccc',
							borderRadius: '4px',
							padding: '40px 20px',
							textAlign: 'center',
							color: '#666',
							minHeight: '120px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							flexDirection: 'column'
						}}
					>
						<div style={{ fontSize: '16px', marginBottom: '8px' }}>📝</div>
						<div>{__('No HTML content', 'universal-block')}</div>
						<div style={{ fontSize: '12px', marginTop: '4px' }}>
							{__('Add HTML content in the sidebar', 'universal-block')}
						</div>
					</div>
				);

			case 'empty':
				// For images, show preview or placeholder
				if (currentTagName === 'img') {
					if (!src) {
						return (
							<div
								style={{
									background: '#f0f0f0',
									border: '1px dashed #ccc',
									borderRadius: '4px',
									padding: '40px 20px',
									textAlign: 'center',
									color: '#666',
									minHeight: '120px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									flexDirection: 'column'
								}}
							>
								<div style={{ fontSize: '16px', marginBottom: '8px' }}>📷</div>
								<div>{__('No image selected', 'universal-block')}</div>
								<div style={{ fontSize: '12px', marginTop: '4px' }}>
									{__('Configure image in the sidebar', 'universal-block')}
								</div>
							</div>
						);
					}

					return (
						<img
							src={src}
							alt={alt || ''}
						/>
					);
				}

				// For hr and other void elements, show visual representation
				if (currentTagName === 'hr') {
					return <hr />;
				}

				// Generic empty element placeholder
				return (
					<div
						style={{
							background: '#f8f9fa',
							border: '1px dashed #ddd',
							borderRadius: '4px',
							padding: '20px',
							textAlign: 'center',
							color: '#888',
							fontSize: '14px'
						}}
					>
						{__('Empty element', 'universal-block')} ({currentTagName})
					</div>
				);

			default:
				return (
					<div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
						{__('Unknown content type:', 'universal-block')} {currentContentType}
					</div>
				);
		}
	};

	// Copy/Paste functionality
	const copyClasses = () => {
		universalBlockClipboard.classes = className || '';
		// Could add a toast notification here
		console.log('Copied classes:', universalBlockClipboard.classes);
	};

	const copyAttributes = () => {
		universalBlockClipboard.attributes = { ...globalAttrs };
		console.log('Copied attributes:', universalBlockClipboard.attributes);
	};

	const copyClassesAndAttributes = () => {
		universalBlockClipboard.classes = className || '';
		universalBlockClipboard.attributes = { ...globalAttrs };
		console.log('Copied classes and attributes');
	};

	const pasteClasses = () => {
		if (universalBlockClipboard.classes !== undefined) {
			setAttributes({ className: universalBlockClipboard.classes });
			console.log('Pasted classes:', universalBlockClipboard.classes);
		}
	};

	const pasteAttributes = () => {
		if (Object.keys(universalBlockClipboard.attributes).length > 0) {
			setAttributes({ globalAttrs: { ...universalBlockClipboard.attributes } });
			console.log('Pasted attributes:', universalBlockClipboard.attributes);
		}
	};

	const pasteClassesAndAttributes = () => {
		const updates = {};
		if (universalBlockClipboard.classes !== undefined) {
			updates.className = universalBlockClipboard.classes;
		}
		if (Object.keys(universalBlockClipboard.attributes).length > 0) {
			updates.globalAttrs = { ...universalBlockClipboard.attributes };
		}
		if (Object.keys(updates).length > 0) {
			setAttributes(updates);
			console.log('Pasted classes and attributes');
		}
	};

	// Toolbar dropdown controls
	const copyPasteControls = [
		{
			title: __('Copy Classes', 'universal-block'),
			icon: 'admin-page',
			onClick: copyClasses,
		},
		{
			title: __('Copy Attributes', 'universal-block'),
			icon: 'admin-settings',
			onClick: copyAttributes,
		},
		{
			title: __('Copy Classes & Attributes', 'universal-block'),
			icon: 'admin-tools',
			onClick: copyClassesAndAttributes,
		},
		{
			title: __('Paste Classes', 'universal-block'),
			icon: 'clipboard',
			onClick: pasteClasses,
			isDisabled: !universalBlockClipboard.classes,
		},
		{
			title: __('Paste Attributes', 'universal-block'),
			icon: 'clipboard',
			onClick: pasteAttributes,
			isDisabled: Object.keys(universalBlockClipboard.attributes).length === 0,
		},
		{
			title: __('Paste Classes & Attributes', 'universal-block'),
			icon: 'clipboard',
			onClick: pasteClassesAndAttributes,
			isDisabled: !universalBlockClipboard.classes && Object.keys(universalBlockClipboard.attributes).length === 0,
		},
	];

	// For blocks content, use innerBlocksProps directly
	if (isBlocksContent) {
		return (
			<div {...innerBlocksProps}>
				<BlockControls>
					<ToolbarGroup>
						<ToolbarDropdownMenu
							icon="admin-tools"
							label={__('Copy/Paste Styles', 'universal-block')}
							controls={copyPasteControls}
						/>
					</ToolbarGroup>
				</BlockControls>

				<InspectorControls>
					<PanelBody title={__('Block Name', 'universal-block')} initialOpen={true}>
						<BlockNamePanel
							blockName={blockName}
							elementType={elementType}
							setAttributes={setAttributes}
						/>
					</PanelBody>

					<PanelBody title={__('CSS Classes', 'universal-block')} initialOpen={false}>
						<ClassesPanel
							className={className}
							setAttributes={setAttributes}
						/>
					</PanelBody>

					<PanelBody title={__('Tag Settings', 'universal-block')}>
						<TagControls
							attributes={{
								tagName: currentTagName,
								contentType: currentContentType,
								selfClosing: currentSelfClosing,
								...attributes
							}}
							setAttributes={setAttributes}
						/>
					</PanelBody>

					{/* Blocks Conversion Panel - only show for blocks content type */}
					{currentContentType === 'blocks' && (
						<PanelBody title={__('Blocks Conversion', 'universal-block')} initialOpen={false}>
							{rawBlockData && rawBlockData.innerBlocks && rawBlockData.innerBlocks.length > 0 && (
								<div style={{ marginBottom: '12px' }}>
									<Button
										variant="secondary"
										size="small"
										onClick={convertToHTML}
										style={{
											width: '100%',
											justifyContent: 'center'
										}}
									>
										{__('🔄 Convert to HTML', 'universal-block')}
									</Button>
								</div>
							)}

							<div style={{ fontSize: '12px', color: '#757575', fontStyle: 'italic' }}>
								{__('Convert inner blocks back to HTML content for further editing.', 'universal-block')}
							</div>
						</PanelBody>
					)}

					{/* Image Settings Panel - only show for img tags */}
					{currentTagName === 'img' && (
						<ImagePanel
							globalAttrs={globalAttrs}
							setAttributes={setAttributes}
						/>
					)}

					<AttributesPanel
						globalAttrs={globalAttrs}
						setAttributes={setAttributes}
					/>
				</InspectorControls>

				{children}
			</div>
		);
	}

	// For HTML content, merge blockProps into the HTML element itself
	if (currentContentType === 'html' && content) {
		return (
			<>
				<BlockControls>
					<ToolbarGroup>
						<ToolbarDropdownMenu
							icon="admin-tools"
							label={__('Copy/Paste Styles', 'universal-block')}
							controls={copyPasteControls}
						/>
					</ToolbarGroup>
				</BlockControls>

				<InspectorControls>
					<PanelBody title={__('Block Name', 'universal-block')} initialOpen={true}>
						<BlockNamePanel
							blockName={blockName}
							elementType={elementType}
							setAttributes={setAttributes}
						/>
					</PanelBody>

					<PanelBody title={__('CSS Classes', 'universal-block')} initialOpen={false}>
						<ClassesPanel
							className={className}
							setAttributes={setAttributes}
						/>
					</PanelBody>

					<PanelBody title={__('Tag Settings', 'universal-block')}>
						<TagControls
							attributes={{
								tagName: currentTagName,
								contentType: currentContentType,
								selfClosing: currentSelfClosing,
								...attributes
							}}
							setAttributes={setAttributes}
						/>
					</PanelBody>

					<PanelBody title={__('HTML Content', 'universal-block')} initialOpen={true}>
						<div style={{ marginBottom: '8px' }}>
							<label style={{
								display: 'block',
								marginBottom: '4px',
								fontSize: '11px',
								fontWeight: '500',
								textTransform: 'uppercase',
								color: '#1e1e1e'
							}}>
								{__('HTML Content', 'universal-block')}
							</label>
							<AceEditor
								value={content || ''}
								onChange={(newValue) => setAttributes({ content: newValue })}
								placeholder={__('Enter HTML content...', 'universal-block')}
								rows={8}
							/>
						</div>

						{/* Conversion button */}
						{content && (
							<div style={{ marginBottom: '12px' }}>
								<Button
									variant="secondary"
									size="small"
									onClick={convertToInnerBlocks}
									style={{
										width: '100%',
										justifyContent: 'center'
									}}
								>
									{__('🔄 Convert to Inner Blocks', 'universal-block')}
								</Button>
							</div>
						)}

						<div style={{ fontSize: '12px', color: '#757575', fontStyle: 'italic' }}>
							{__('Enter raw HTML content with Emmet support. Use the convert button to turn HTML into editable blocks.', 'universal-block')}
						</div>
					</PanelBody>

					{/* Image Settings Panel - only show for img tags */}
					{currentTagName === 'img' && (
						<ImagePanel
							globalAttrs={globalAttrs}
							setAttributes={setAttributes}
						/>
					)}

					<AttributesPanel
						globalAttrs={globalAttrs}
						setAttributes={setAttributes}
					/>
				</InspectorControls>

				{React.createElement(currentTagName, {
					...blockProps,
					dangerouslySetInnerHTML: { __html: content }
				})}
			</>
		);
	}

	// For image tags, merge blockProps into the image element itself
	if (currentTagName === 'img' && currentContentType === 'empty') {
		return (
			<>
				<BlockControls>
					<ToolbarGroup>
						<ToolbarDropdownMenu
							icon="admin-tools"
							label={__('Copy/Paste Styles', 'universal-block')}
							controls={copyPasteControls}
						/>
					</ToolbarGroup>
				</BlockControls>

				<InspectorControls>
					<PanelBody title={__('Block Name', 'universal-block')} initialOpen={true}>
						<BlockNamePanel
							blockName={blockName}
							elementType={elementType}
							setAttributes={setAttributes}
						/>
					</PanelBody>

					<PanelBody title={__('CSS Classes', 'universal-block')} initialOpen={false}>
						<ClassesPanel
							className={className}
							setAttributes={setAttributes}
						/>
					</PanelBody>

					<PanelBody title={__('Tag Settings', 'universal-block')}>
						<TagControls
							attributes={{
								tagName: currentTagName,
								contentType: currentContentType,
								selfClosing: currentSelfClosing,
								...attributes
							}}
							setAttributes={setAttributes}
						/>
					</PanelBody>

					{/* Image Settings Panel - only show for img tags */}
					{currentTagName === 'img' && (
						<ImagePanel
							globalAttrs={globalAttrs}
							setAttributes={setAttributes}
						/>
					)}

					<AttributesPanel
						globalAttrs={globalAttrs}
						setAttributes={setAttributes}
					/>
				</InspectorControls>

				{src ? (
					<img
						{...blockProps}
						src={src}
						alt={alt || ''}
					/>
				) : (
					<div
						{...blockProps}
						style={{
							background: '#f0f0f0',
							border: '1px dashed #ccc',
							borderRadius: '4px',
							padding: '40px 20px',
							textAlign: 'center',
							color: '#666',
							minHeight: '120px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							flexDirection: 'column'
						}}
					>
						<div style={{ fontSize: '16px', marginBottom: '8px' }}>📷</div>
						<div>{__('No image selected', 'universal-block')}</div>
						<div style={{ fontSize: '12px', marginTop: '4px' }}>
							{__('Configure image in the sidebar', 'universal-block')}
						</div>
					</div>
				)}
			</>
		);
	}

	// For non-blocks content types, use blockProps
	return (
		<div {...blockProps}>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarDropdownMenu
						icon="admin-tools"
						label={__('Copy/Paste Styles', 'universal-block')}
						controls={copyPasteControls}
					/>
				</ToolbarGroup>
			</BlockControls>

			<InspectorControls>
				<PanelBody title={__('Block Name', 'universal-block')} initialOpen={true}>
					<BlockNamePanel
						blockName={blockName}
						elementType={elementType}
						setAttributes={setAttributes}
					/>
				</PanelBody>

				<PanelBody title={__('CSS Classes', 'universal-block')} initialOpen={false}>
					<ClassesPanel
						className={className}
						setAttributes={setAttributes}
					/>
				</PanelBody>

				<PanelBody title={__('Tag Settings', 'universal-block')}>
					<TagControls
						attributes={{
							tagName: currentTagName,
							contentType: currentContentType,
							selfClosing: currentSelfClosing,
							...attributes
						}}
						setAttributes={setAttributes}
					/>
				</PanelBody>

				{/* HTML Content Panel - only show for HTML content type */}
				{currentContentType === 'html' && (
					<PanelBody title={__('HTML Content', 'universal-block')} initialOpen={true}>
						<div style={{ marginBottom: '8px' }}>
							<label style={{
								display: 'block',
								marginBottom: '4px',
								fontSize: '11px',
								fontWeight: '500',
								textTransform: 'uppercase',
								color: '#1e1e1e'
							}}>
								{__('HTML Content', 'universal-block')}
							</label>
							<AceEditor
								value={content || ''}
								onChange={(newValue) => setAttributes({ content: newValue })}
								placeholder={__('Enter HTML content...', 'universal-block')}
								rows={8}
							/>
						</div>

						{/* Conversion button */}
						{content && (
							<div style={{ marginBottom: '12px' }}>
								<Button
									variant="secondary"
									size="small"
									onClick={convertToInnerBlocks}
									style={{
										width: '100%',
										justifyContent: 'center'
									}}
								>
									{__('🔄 Convert to Inner Blocks', 'universal-block')}
								</Button>
							</div>
						)}

						<div style={{ fontSize: '12px', color: '#757575', fontStyle: 'italic' }}>
							{__('Enter raw HTML content with Emmet support. Use the convert button to turn HTML into editable blocks.', 'universal-block')}
						</div>
					</PanelBody>
				)}

				{/* Image Settings Panel - only show for img tags */}
				{currentTagName === 'img' && (
					<ImagePanel
						globalAttrs={globalAttrs}
						setAttributes={setAttributes}
					/>
				)}

				<AttributesPanel
					globalAttrs={globalAttrs}
					setAttributes={setAttributes}
				/>

				{/* Dynamic Preview Controls */}
				<DynamicPreviewPanel
					blockId={clientId}
					isEnabled={isLivePreview}
					onToggle={setIsLivePreview}
					onPreviewUpdate={setPreviewHtml}
				/>

				{/* Debug Panels */}
				<ContextDebugPanel />
				<PreviewPerformancePanel />
			</InspectorControls>

			{renderContentByType()}
		</div>
	);
}

// Expose parsers on window for external use
if (typeof window !== 'undefined') {
	window.UniversalBlockParsers = {
		parseHTMLToBlocks,
		parseBlocksToHTML
	};
}