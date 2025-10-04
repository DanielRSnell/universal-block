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
	ToolbarButton,
	Button,
	TextControl
} from '@wordpress/components';
import { TagControls } from './TagControls';
import { AttributesPanel } from './AttributesPanel';
import { BlockNamePanel } from './BlockNamePanel';
import { BlockContextPanel } from './BlockContextPanel';
import { ClassesPanel } from './ClassesPanel';
import { AceEditor } from './AceEditor';
import { ImagePanel } from './ImagePanel';
import DynamicProcessingPanel from './DynamicProcessingPanel';
import { getTagConfig, getDefaultContentType, getTagOptions, getContentTypeOptions } from '../config/tags';
import { getCategoryOptions } from '../config/tags/categories';
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
		isDynamic,
		uiState,
		blockContext
	} = attributes;

	// Preview state
	const [dynamicProcessedContent, setDynamicProcessedContent] = useState(null);

	// Get block editor functions for conversion
	const { replaceBlocks } = useDispatch('core/block-editor');

	// Get selected block ID and raw block data for debugging
	const { selectedBlockId, rawBlockData, isSelected } = useSelect((select) => {
		const selectedId = select('core/block-editor').getSelectedBlockClientId();
		const blockData = selectedId ? select('core/block-editor').getBlock(selectedId) : null;

		return {
			selectedBlockId: selectedId,
			rawBlockData: blockData,
			isSelected: selectedId === clientId
		};
	}, [clientId]);

	// Debug logging when ANY block is selected
	useEffect(() => {
		if (selectedBlockId && rawBlockData) {
			console.group('🔍 Block Debug - RAW Block Object');
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
	}, [selectedBlockId, rawBlockData]);

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
	const currentTagCategory = uiState?.tagCategory || 'common';

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

	// Helper functions for toolbar controls
	const handleCategoryChange = (newCategory) => {
		setAttributes({
			uiState: {
				...uiState,
				tagCategory: newCategory
			}
		});
	};

	const handleTagChange = (newTag) => {
		const config = getTagConfig(newTag);
		const updates = { tagName: newTag };

		// For custom elements, provide flexible defaults
		if (currentTagCategory === 'custom') {
			if (!contentType) {
				updates.contentType = 'text';
			}
			updates.selfClosing = false;
		} else {
			// Standard tag configuration
			if (config) {
				if (config.contentType !== undefined) {
					updates.contentType = config.contentType === null ? 'empty' : config.contentType;
				} else if (config.defaultContentType) {
					updates.contentType = config.defaultContentType;
				}
				updates.selfClosing = config.selfClosing;
			} else {
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

		setAttributes(updates);
	};

	const handleContentTypeChange = (newContentType) => {
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
		}

		setAttributes(updates);
	};

	const blockProps = useBlockProps({
		style: {
			position: 'relative',
			minHeight: '50px'
		}
	});

	// Always call useInnerBlocksProps to avoid conditional hook calls
	const { children, ...innerBlocksProps } = useInnerBlocksProps(blockProps, {
		renderAppender: InnerBlocks.ButtonBlockAppender
	});

	// Extract only the essential data attributes from blockProps for editor functionality
	// This keeps block selection/editing working while removing visual wrapper classes
	const getEditorDataAttributes = () => {
		return {
			'data-block': blockProps['data-block'],
			'data-type': blockProps['data-type'],
			'data-title': blockProps['data-title'],
		};
	};

	// Create clean props with user's classes/attributes + WordPress block props
	const getCleanElementProps = () => {
		const props = {
			...blockProps, // Include all WordPress styling/spacing/etc
			className: className || undefined,
			style: globalAttrs?.style || undefined,
			...globalAttrs
		};

		// Remove style from globalAttrs if it was already added above to avoid duplication
		if (props.style && globalAttrs?.style) {
			const { style, ...restGlobalAttrs } = globalAttrs;
			Object.assign(props, restGlobalAttrs);
		}

		// Clean up undefined values
		Object.keys(props).forEach(key => {
			if (props[key] === undefined) {
				delete props[key];
			}
		});

		return props;
	};

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
						{...getCleanElementProps()}
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

				// For other empty elements, render nothing to avoid breaking preview
				return null;

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

	const copyHTML = () => {
		// Get the current block data including inner blocks
		if (!rawBlockData) {
			console.warn('No block data available');
			return;
		}

		try {
			// Convert the current block and all its inner blocks to HTML
			const htmlOutput = parseBlocksToHTML([rawBlockData]);

			if (htmlOutput) {
				// Copy to clipboard
				if (navigator.clipboard && navigator.clipboard.writeText) {
					navigator.clipboard.writeText(htmlOutput)
						.then(() => {
							console.log('HTML copied to clipboard');
							// Could add a toast notification here
						})
						.catch((err) => {
							console.error('Failed to copy HTML:', err);
						});
				} else {
					// Fallback for older browsers
					const textarea = document.createElement('textarea');
					textarea.value = htmlOutput;
					textarea.style.position = 'fixed';
					textarea.style.opacity = '0';
					document.body.appendChild(textarea);
					textarea.select();
					document.execCommand('copy');
					document.body.removeChild(textarea);
					console.log('HTML copied to clipboard (fallback)');
				}
			}
		} catch (error) {
			console.error('Failed to convert block to HTML:', error);
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
			title: __('Copy HTML', 'universal-block'),
			icon: 'editor-code',
			onClick: copyHTML,
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

		// If dynamic processing is enabled and we have processed content, render clean preview
		if (isDynamic && dynamicProcessedContent) {
			return (
				<>
					<BlockControls>
						<ToolbarGroup>
							<ToolbarDropdownMenu
								icon={<i className="ri-file-copy-line" style={{ fontSize: '16px' }} />}
								label={__('Copy/Paste Styles', 'universal-block')}
								controls={copyPasteControls}
							/>
						</ToolbarGroup>
						<ToolbarGroup>
							<ToolbarDropdownMenu
								icon={<i className="ri-folder-line" style={{ fontSize: '16px' }} />}
								label={__('Tag Category', 'universal-block')}
								controls={getCategoryOptions().map(category => ({
									title: category.label,
									icon: <i className="ri-folder-line" style={{ fontSize: '14px' }} />,
									isActive: currentTagCategory === category.value,
									onClick: () => handleCategoryChange(category.value)
								}))}
							/>
						</ToolbarGroup>
						<ToolbarGroup>
							<ToolbarDropdownMenu
								icon={<i className="ri-code-line" style={{ fontSize: '16px' }} />}
								label={__('HTML Tag', 'universal-block')}
								controls={getTagOptions(currentTagCategory).map(tag => ({
									title: typeof tag === 'object' ? tag.label : tag,
									icon: <i className="ri-code-line" style={{ fontSize: '14px' }} />,
									isActive: currentTagName === (typeof tag === 'object' ? tag.value : tag),
									onClick: () => handleTagChange(typeof tag === 'object' ? tag.value : tag)
								}))}
							/>
						</ToolbarGroup>
						<ToolbarGroup>
							<ToolbarDropdownMenu
								icon={<i className="ri-file-text-line" style={{ fontSize: '16px' }} />}
								label={__('Content Type', 'universal-block')}
								controls={getContentTypeOptions(currentTagName).map(type => ({
									title: type.charAt(0).toUpperCase() + type.slice(1),
									icon: <i className="ri-file-text-line" style={{ fontSize: '14px' }} />,
									isActive: currentContentType === type,
									onClick: () => handleContentTypeChange(type)
								}))}
							/>
						</ToolbarGroup>
						<ToolbarGroup>
							<ToolbarButton
								icon={<i className="ri-database-2-line" style={{ fontSize: '16px' }} />}
								label={__('Toggle Dynamic Preview', 'universal-block')}
								isPressed={isDynamic}
								onClick={() => setAttributes({ isDynamic: !isDynamic })}
							/>
						</ToolbarGroup>
					</BlockControls>

					<InspectorControls>
						<PanelBody title={__('Block Name', 'universal-block')} initialOpen={false}>
							<BlockNamePanel
								blockName={blockName}
								elementType={elementType}
								setAttributes={setAttributes}
								tagName={currentTagName}
								globalAttrs={globalAttrs}
							/>
						</PanelBody>

						<PanelBody title={__('CSS Classes', 'universal-block')} initialOpen={false}>
							<ClassesPanel
								className={className}
								setAttributes={setAttributes}
							/>
						</PanelBody>

						<PanelBody title={__('Tag Settings', 'universal-block')} initialOpen={false}>
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

						{/* Dynamic Processing Controls */}
						<DynamicProcessingPanel
							attributes={attributes}
							setAttributes={setAttributes}
							clientId={clientId}
							onProcessedContent={setDynamicProcessedContent}
						/>
					</InspectorControls>

					{/* Dynamic preview - wrapper with blockProps excluding className */}
					<div
						{...(() => {
							const { className, ...propsWithoutClass } = blockProps;
							return propsWithoutClass;
						})()}
						style={{
							...blockProps.style,
							position: 'relative'
						}}
						dangerouslySetInnerHTML={{
							__html: (() => {
								// Remove duplicate classes from processed HTML content
								const tempDiv = document.createElement('div');
								tempDiv.innerHTML = dynamicProcessedContent;
								const outerDiv = tempDiv.firstElementChild;

								if (outerDiv) {
									// Only remove WordPress-specific block classes that would be duplicated from wrapper
									const wpClassesToRemove = [
										'wp-block-universal-element',
										'wp-block',
										'block-editor-block-list__block'
									];
									wpClassesToRemove.forEach(cls => {
										outerDiv.classList.remove(cls);
									});

									return outerDiv.outerHTML;
								}

								return dynamicProcessedContent;
							})()
						}}
					/>
				</>
			);
		}

		// Normal blocks content rendering - use actual tag element
		const TagElement = currentTagName;

		// For blocks content type, we need innerBlocksProps on the element
		// Merge them with clean element props, with innerBlocksProps taking priority for editor functionality
		const elementProps = {
			...getCleanElementProps(),
			...innerBlocksProps,
		};

		return (
			<>
				<BlockControls>
					<ToolbarGroup>
						<ToolbarDropdownMenu
							icon={<i className="ri-file-copy-line" style={{ fontSize: '16px' }} />}
							label={__('Copy/Paste Styles', 'universal-block')}
							controls={copyPasteControls}
						/>
					</ToolbarGroup>
					<ToolbarGroup>
						<ToolbarDropdownMenu
							icon={<i className="ri-folder-line" style={{ fontSize: '16px' }} />}
							label={__('Tag Category', 'universal-block')}
							controls={getCategoryOptions().map(category => ({
								title: category.label,
								icon: <i className="ri-folder-line" style={{ fontSize: '14px' }} />,
								isActive: currentTagCategory === category.value,
								onClick: () => handleCategoryChange(category.value)
							}))}
						/>
					</ToolbarGroup>
					<ToolbarGroup>
						<ToolbarDropdownMenu
							icon={<i className="ri-code-line" style={{ fontSize: '16px' }} />}
							label={__('HTML Tag', 'universal-block')}
							controls={getTagOptions(currentTagCategory).map(tag => ({
								title: typeof tag === 'object' ? tag.label : tag,
								icon: <i className="ri-code-line" style={{ fontSize: '14px' }} />,
								isActive: currentTagName === (typeof tag === 'object' ? tag.value : tag),
								onClick: () => handleTagChange(typeof tag === 'object' ? tag.value : tag)
							}))}
						/>
					</ToolbarGroup>
					<ToolbarGroup>
						<ToolbarDropdownMenu
							icon={<i className="ri-file-text-line" style={{ fontSize: '16px' }} />}
							label={__('Content Type', 'universal-block')}
							controls={getContentTypeOptions(currentTagName).map(type => ({
								title: type.charAt(0).toUpperCase() + type.slice(1),
								icon: <i className="ri-file-text-line" style={{ fontSize: '14px' }} />,
								isActive: currentContentType === type,
								onClick: () => handleContentTypeChange(type)
							}))}
						/>
					</ToolbarGroup>
					<ToolbarGroup>
						<ToolbarButton
							icon={<i className="ri-database-2-line" style={{ fontSize: '16px' }} />}
							label={__('Toggle Dynamic Preview', 'universal-block')}
							isPressed={isDynamic}
							onClick={() => setAttributes({ isDynamic: !isDynamic })}
						/>
					</ToolbarGroup>
				</BlockControls>

				<InspectorControls>
					<PanelBody title={__('Block Name', 'universal-block')} initialOpen={false}>
						<BlockNamePanel
							blockName={blockName}
							elementType={elementType}
							setAttributes={setAttributes}
							tagName={currentTagName}
							globalAttrs={globalAttrs}
						/>
					</PanelBody>

					<PanelBody title={__('Block Context', 'universal-block')} initialOpen={false}>
						<BlockContextPanel
							blockContext={blockContext}
							setAttributes={setAttributes}
						/>
					</PanelBody>

					<PanelBody title={__('CSS Classes', 'universal-block')} initialOpen={false}>
						<ClassesPanel
							className={className}
							setAttributes={setAttributes}
						/>
					</PanelBody>

					<PanelBody title={__('Tag Settings', 'universal-block')} initialOpen={false}>
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

					{/* Dynamic Processing Controls */}
					<DynamicProcessingPanel
						attributes={attributes}
						setAttributes={setAttributes}
						clientId={clientId}
						onProcessedContent={setDynamicProcessedContent}
					/>
				</InspectorControls>

				<TagElement {...elementProps}>
					{children}
				</TagElement>
			</>
		);
	}

	// For HTML content, merge blockProps into the HTML element itself
	if (currentContentType === 'html' && content) {
		return (
			<>
				<BlockControls>
					<ToolbarGroup>
						<ToolbarDropdownMenu
							icon={<i className="ri-file-copy-line" style={{ fontSize: '16px' }} />}
							label={__('Copy/Paste Styles', 'universal-block')}
							controls={copyPasteControls}
						/>
					</ToolbarGroup>
					<ToolbarGroup>
						<ToolbarDropdownMenu
							icon={<i className="ri-code-s-slash-line" style={{ fontSize: '16px' }} />}
							label={__('Quick Tag Settings', 'universal-block')}
							controls={[
								{
									title: __('Tag Category', 'universal-block'),
									icon: <i className="ri-folder-line" style={{ fontSize: '14px' }} />,
									isDisabled: false,
									onClick: () => {
										// This will be a submenu - for now show current category
									}
								},
								{
									title: `${__('HTML Tag', 'universal-block')}: ${currentTagName}`,
									icon: <i className="ri-code-line" style={{ fontSize: '14px' }} />,
									isDisabled: false,
									onClick: () => {
										// This will be a submenu - for now show current tag
									}
								},
								{
									title: `${__('Content Type', 'universal-block')}: ${currentContentType}`,
									icon: <i className="ri-file-text-line" style={{ fontSize: '14px' }} />,
									isDisabled: false,
									onClick: () => {
										// This will be a submenu - for now show current content type
									}
								}
							]}
						/>
					</ToolbarGroup>
					<ToolbarGroup>
						<ToolbarButton
							icon={<i className="ri-database-2-line" style={{ fontSize: '16px' }} />}
							label={__('Toggle Dynamic Preview', 'universal-block')}
							isPressed={isDynamic}
							onClick={() => setAttributes({ isDynamic: !isDynamic })}
						/>
					</ToolbarGroup>
				</BlockControls>

				<InspectorControls>
					<PanelBody title={__('Block Name', 'universal-block')} initialOpen={false}>
						<BlockNamePanel
							blockName={blockName}
							elementType={elementType}
							setAttributes={setAttributes}
							tagName={currentTagName}
							globalAttrs={globalAttrs}
						/>
					</PanelBody>

					<PanelBody title={__('Block Context', 'universal-block')} initialOpen={false}>
						<BlockContextPanel
							blockContext={blockContext}
							setAttributes={setAttributes}
						/>
					</PanelBody>

					<PanelBody title={__('CSS Classes', 'universal-block')} initialOpen={false}>
						<ClassesPanel
							className={className}
							setAttributes={setAttributes}
						/>
					</PanelBody>

					<PanelBody title={__('Tag Settings', 'universal-block')} initialOpen={false}>
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

					<PanelBody title={__('HTML Content', 'universal-block')} initialOpen={false}>
						<div style={{ marginBottom: '8px' }}>
							<div style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								marginBottom: '4px'
							}}>
								<label style={{
									fontSize: '11px',
									fontWeight: '500',
									textTransform: 'uppercase',
									color: '#1e1e1e'
								}}>
									{__('HTML Content', 'universal-block')}
								</label>
								<button
									onClick={() => window.openUniversalBlockHtmlEditor && window.openUniversalBlockHtmlEditor()}
									style={{
										background: 'none',
										border: 'none',
										cursor: 'pointer',
										padding: '4px',
										display: 'flex',
										alignItems: 'center'
									}}
									title={__('Expand Editor', 'universal-block')}
								>
									<i className="ri-window-line" style={{ fontSize: '16px' }}></i>
								</button>
							</div>
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

					{/* Dynamic Processing Controls */}
					<DynamicProcessingPanel
						attributes={attributes}
						setAttributes={setAttributes}
						clientId={clientId}
						onProcessedContent={setDynamicProcessedContent}
					/>
				</InspectorControls>

				{React.createElement(currentTagName, {
					...getCleanElementProps(),
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
							icon={<i className="ri-file-copy-line" style={{ fontSize: '16px' }} />}
							label={__('Copy/Paste Styles', 'universal-block')}
							controls={copyPasteControls}
						/>
					</ToolbarGroup>
					<ToolbarGroup>
						<ToolbarDropdownMenu
							icon={<i className="ri-code-s-slash-line" style={{ fontSize: '16px' }} />}
							label={__('Quick Tag Settings', 'universal-block')}
							controls={[
								{
									title: __('Tag Category', 'universal-block'),
									icon: <i className="ri-folder-line" style={{ fontSize: '14px' }} />,
									isDisabled: false,
									onClick: () => {
										// This will be a submenu - for now show current category
									}
								},
								{
									title: `${__('HTML Tag', 'universal-block')}: ${currentTagName}`,
									icon: <i className="ri-code-line" style={{ fontSize: '14px' }} />,
									isDisabled: false,
									onClick: () => {
										// This will be a submenu - for now show current tag
									}
								},
								{
									title: `${__('Content Type', 'universal-block')}: ${currentContentType}`,
									icon: <i className="ri-file-text-line" style={{ fontSize: '14px' }} />,
									isDisabled: false,
									onClick: () => {
										// This will be a submenu - for now show current content type
									}
								}
							]}
						/>
					</ToolbarGroup>
					<ToolbarGroup>
						<ToolbarButton
							icon={<i className="ri-database-2-line" style={{ fontSize: '16px' }} />}
							label={__('Toggle Dynamic Preview', 'universal-block')}
							isPressed={isDynamic}
							onClick={() => setAttributes({ isDynamic: !isDynamic })}
						/>
					</ToolbarGroup>
				</BlockControls>

				<InspectorControls>
					<PanelBody title={__('Block Name', 'universal-block')} initialOpen={false}>
						<BlockNamePanel
							blockName={blockName}
							elementType={elementType}
							setAttributes={setAttributes}
							tagName={currentTagName}
							globalAttrs={globalAttrs}
						/>
					</PanelBody>

					<PanelBody title={__('Block Context', 'universal-block')} initialOpen={false}>
						<BlockContextPanel
							blockContext={blockContext}
							setAttributes={setAttributes}
						/>
					</PanelBody>

					<PanelBody title={__('CSS Classes', 'universal-block')} initialOpen={false}>
						<ClassesPanel
							className={className}
							setAttributes={setAttributes}
						/>
					</PanelBody>

					<PanelBody title={__('Tag Settings', 'universal-block')} initialOpen={false}>
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

					{/* Dynamic Processing Controls */}
					<DynamicProcessingPanel
						attributes={attributes}
						setAttributes={setAttributes}
						clientId={clientId}
						onProcessedContent={setDynamicProcessedContent}
					/>
				</InspectorControls>

				{src ? (
					<img
						{...getCleanElementProps()}
						src={src}
						alt={alt || ''}
					/>
				) : (
					<div
						{...getCleanElementProps()}
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
	// Hide set elements visually but keep them in DOM for serialization
	const finalBlockProps = currentTagName === 'set'
		? {
			...blockProps,
			style: {
				...blockProps.style,
				position: 'absolute',
				left: '-9999px',
				width: '1px',
				height: '1px',
				overflow: 'hidden'
			}
		}
		: blockProps;

	// For text content, render RichText directly with blockProps (no wrapper div)
	if (currentContentType === 'text') {
		return (
			<>
				<BlockControls>
					<ToolbarGroup>
						<ToolbarDropdownMenu
							icon={<i className="ri-file-copy-line" style={{ fontSize: '16px' }} />}
							label={__('Copy/Paste Styles', 'universal-block')}
							controls={copyPasteControls}
						/>
					</ToolbarGroup>
					<ToolbarGroup>
						<ToolbarDropdownMenu
							icon={<i className="ri-code-s-slash-line" style={{ fontSize: '16px' }} />}
							label={__('Quick Tag Settings', 'universal-block')}
							controls={[
								{
									title: __('Tag Category', 'universal-block'),
									icon: <i className="ri-folder-line" style={{ fontSize: '14px' }} />,
									isDisabled: false,
									onClick: () => {
										// This will be a submenu - for now show current category
									}
								},
								{
									title: `${__('HTML Tag', 'universal-block')}: ${currentTagName}`,
									icon: <i className="ri-code-line" style={{ fontSize: '14px' }} />,
									isDisabled: false,
									onClick: () => {
										// This will be a submenu - for now show current tag
									}
								},
								{
									title: `${__('Content Type', 'universal-block')}: ${currentContentType}`,
									icon: <i className="ri-file-text-line" style={{ fontSize: '14px' }} />,
									isDisabled: false,
									onClick: () => {
										// This will be a submenu - for now show current content type
									}
								}
							]}
						/>
					</ToolbarGroup>
				</BlockControls>

				<InspectorControls>
					<PanelBody title={__('Block Name', 'universal-block')} initialOpen={false}>
						<BlockNamePanel
							blockName={blockName}
							elementType={elementType}
							setAttributes={setAttributes}
							tagName={currentTagName}
							globalAttrs={globalAttrs}
						/>
					</PanelBody>

					<PanelBody title={__('Block Context', 'universal-block')} initialOpen={false}>
						<BlockContextPanel
							blockContext={blockContext}
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

					<PanelBody title={__('Text Content', 'universal-block')} initialOpen={false}>
						<TextControl
							label={__('Content', 'universal-block')}
							value={content || ''}
							onChange={(newValue) => setAttributes({ content: newValue })}
							placeholder={__('Enter text content...', 'universal-block')}
							help={__('Edit the text content. You can also edit directly in the block.', 'universal-block')}
						/>
					</PanelBody>

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

					<DynamicProcessingPanel
						attributes={attributes}
						setAttributes={setAttributes}
						clientId={clientId}
					/>
				</InspectorControls>

				<RichText
					tagName={currentTagName}
					value={content}
					onChange={(value) => setAttributes({ content: value })}
					placeholder={__('Enter your text...', 'universal-block')}
					{...getCleanElementProps()}
				/>
			</>
		);
	}

	// For other content types (empty, html without content)
	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarDropdownMenu
						icon={<i className="ri-file-copy-line" style={{ fontSize: '16px' }} />}
						label={__('Copy/Paste Styles', 'universal-block')}
						controls={copyPasteControls}
					/>
				</ToolbarGroup>
				<ToolbarGroup>
					<ToolbarDropdownMenu
						icon={<i className="ri-code-s-slash-line" style={{ fontSize: '16px' }} />}
						label={__('Quick Tag Settings', 'universal-block')}
						controls={[
							{
								title: __('Tag Category', 'universal-block'),
								icon: <i className="ri-folder-line" style={{ fontSize: '14px' }} />,
								isDisabled: false,
								onClick: () => {
									// This will be a submenu - for now show current category
								}
							},
							{
								title: `${__('HTML Tag', 'universal-block')}: ${currentTagName}`,
								icon: <i className="ri-code-line" style={{ fontSize: '14px' }} />,
								isDisabled: false,
								onClick: () => {
									// This will be a submenu - for now show current tag
								}
							},
							{
								title: `${__('Content Type', 'universal-block')}: ${currentContentType}`,
								icon: <i className="ri-file-text-line" style={{ fontSize: '14px' }} />,
								isDisabled: false,
								onClick: () => {
									// This will be a submenu - for now show current content type
								}
							}
						]}
					/>
				</ToolbarGroup>
			</BlockControls>

			<InspectorControls>
				<PanelBody title={__('Block Name', 'universal-block')} initialOpen={false}>
					<BlockNamePanel
						blockName={blockName}
						elementType={elementType}
						setAttributes={setAttributes}
					/>
				</PanelBody>

				<PanelBody title={__('Block Context', 'universal-block')} initialOpen={false}>
					<BlockContextPanel
						blockContext={blockContext}
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

				{/* Text Content Panel - only show for text content type */}
				{currentContentType === 'text' && (
					<PanelBody title={__('Text Content', 'universal-block')} initialOpen={false}>
						<TextControl
							label={__('Content', 'universal-block')}
							value={content || ''}
							onChange={(newValue) => setAttributes({ content: newValue })}
							placeholder={__('Enter text content...', 'universal-block')}
							help={__('Edit the text content. You can also edit directly in the block.', 'universal-block')}
						/>
					</PanelBody>
				)}

				{/* HTML Content Panel - only show for HTML content type */}
				{currentContentType === 'html' && (
					<PanelBody title={__('HTML Content', 'universal-block')} initialOpen={false}>
						<div style={{ marginBottom: '8px' }}>
							<div style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								marginBottom: '4px'
							}}>
								<label style={{
									fontSize: '11px',
									fontWeight: '500',
									textTransform: 'uppercase',
									color: '#1e1e1e'
								}}>
									{__('HTML Content', 'universal-block')}
								</label>
								<button
									onClick={() => window.openUniversalBlockHtmlEditor && window.openUniversalBlockHtmlEditor()}
									style={{
										background: 'none',
										border: 'none',
										cursor: 'pointer',
										padding: '4px',
										display: 'flex',
										alignItems: 'center'
									}}
									title={__('Expand Editor', 'universal-block')}
								>
									<i className="ri-window-line" style={{ fontSize: '16px' }}></i>
								</button>
							</div>
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

				{/* Dynamic Processing Controls */}
				<DynamicProcessingPanel
					attributes={attributes}
					setAttributes={setAttributes}
					clientId={clientId}
				/>

			</InspectorControls>

			{/* For empty elements like hr, render the actual tag */}
			{(currentContentType === 'empty' && ['hr', 'br'].includes(currentTagName)) ? (
				React.createElement(currentTagName, getCleanElementProps())
			) : (
				/* For other fallback cases (empty HTML placeholder, set tags), wrap in div */
				<div {...getCleanElementProps()}>
					{renderContentByType()}
				</div>
			)}
		</>
	);
}

// Expose parsers on window for external use
if (typeof window !== 'undefined') {
	window.UniversalBlockParsers = {
		parseHTMLToBlocks,
		parseBlocksToHTML
	};
}