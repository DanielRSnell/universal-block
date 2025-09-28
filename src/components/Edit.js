import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	BlockControls,
	RichText,
	InnerBlocks,
	useBlockProps,
	useInnerBlocksProps
} from '@wordpress/block-editor';
import {
	PanelBody,
	ToolbarGroup,
	ToolbarDropdownMenu
} from '@wordpress/components';
import { TagControls } from './TagControls';
import { AttributesPanel } from './AttributesPanel';
import { BlockNamePanel } from './BlockNamePanel';
import { ClassesPanel } from './ClassesPanel';
import { getTagConfig, getDefaultContentType } from '../config/tags';

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

export default function Edit({ attributes, setAttributes }) {
	const {
		blockName,
		elementType, // Legacy - will be migrated
		tagName,
		contentType,
		content,
		selfClosing,
		globalAttrs,
		className
	} = attributes;

	// Migration: Convert legacy elementType to new tag-based system
	const migratedAttributes = (() => {
		if (elementType && !contentType) {
			const mapping = LEGACY_ELEMENT_TYPE_MAPPING[elementType];
			if (mapping) {
				console.log(`🔄 Migrating legacy elementType "${elementType}" to tag-based system`);
				return {
					tagName: tagName || mapping.tagName,
					contentType: mapping.contentType,
					selfClosing: elementType === 'image' || elementType === 'rule'
				};
			}
		}
		return {
			tagName: tagName || 'div',
			contentType: contentType || getDefaultContentType(tagName || 'div'),
			selfClosing: selfClosing || false
		};
	})();

	// Apply migration if needed
	if (elementType && !contentType) {
		setAttributes({
			...migratedAttributes,
			elementType: undefined // Remove legacy attribute
		});
	}

	const currentTagName = migratedAttributes.tagName;
	const currentContentType = migratedAttributes.contentType;
	const currentSelfClosing = migratedAttributes.selfClosing;

	// Get element-specific attributes from globalAttrs
	const src = globalAttrs?.src || '';
	const alt = globalAttrs?.alt || '';

	const blockProps = useBlockProps();

	// For blocks content type, use useInnerBlocksProps to eliminate extra wrapper
	const isBlocksContent = currentContentType === 'blocks';
	const { children, ...innerBlocksProps } = isBlocksContent
		? useInnerBlocksProps(blockProps, {
			renderAppender: InnerBlocks.DefaultBlockAppender
		})
		: { children: null };

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
				if (!content) {
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
				}

				// For SVG tags, combine globalAttrs to create proper SVG
				if (currentTagName === 'svg') {
					const svgAttrs = Object.entries(globalAttrs || {})
						.map(([key, value]) => `${key}="${value}"`)
						.join(' ');
					const fullSvgContent = `<svg ${svgAttrs}>${content}</svg>`;
					return (
						<div
							dangerouslySetInnerHTML={{ __html: fullSvgContent }}
						/>
					);
				}

				return (
					<div
						dangerouslySetInnerHTML={{ __html: content }}
					/>
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

	// Use innerBlocksProps for blocks content, blockProps for others
	const wrapperProps = isBlocksContent ? innerBlocksProps : blockProps;

	return (
		<div {...wrapperProps}>
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

				<AttributesPanel
					globalAttrs={globalAttrs}
					setAttributes={setAttributes}
				/>
			</InspectorControls>

			{renderContentByType()}
		</div>
	);
}