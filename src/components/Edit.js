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
	SelectControl,
	ToolbarGroup,
	ToolbarDropdownMenu
} from '@wordpress/components';
import { ElementTypeControls } from './ElementTypeControls';
import { AttributesPanel } from './AttributesPanel';
import { BlockNamePanel } from './BlockNamePanel';
import { ClassesPanel } from './ClassesPanel';

// Global clipboard for copy/paste functionality
let universalBlockClipboard = {
	classes: '',
	attributes: {},
	styles: {}
};

const ELEMENT_TYPES = [
	{ label: __('Text', 'universal-block'), value: 'text' },
	{ label: __('Heading', 'universal-block'), value: 'heading' },
	{ label: __('Link', 'universal-block'), value: 'link' },
	{ label: __('Image', 'universal-block'), value: 'image' },
	{ label: __('Rule', 'universal-block'), value: 'rule' },
	{ label: __('SVG', 'universal-block'), value: 'svg' },
	{ label: __('Container', 'universal-block'), value: 'container' }
];

export default function Edit({ attributes, setAttributes }) {
	const {
		blockName,
		elementType,
		tagName,
		content,
		selfClosing,
		globalAttrs,
		className
	} = attributes;

	// Get element-specific attributes from globalAttrs
	const src = globalAttrs?.src || '';
	const alt = globalAttrs?.alt || '';

	const blockProps = useBlockProps();

	// For container elements, use useInnerBlocksProps to eliminate extra wrapper
	const isContainer = elementType === 'container';
	const { children, ...innerBlocksProps } = isContainer
		? useInnerBlocksProps(blockProps, {
			renderAppender: InnerBlocks.DefaultBlockAppender
		})
		: { children: null };

	const renderElementTypeContent = () => {
		switch (elementType) {
			case 'text':
			case 'heading':
				return (
					<RichText
						tagName={tagName}
						value={content}
						onChange={(value) => setAttributes({ content: value })}
						placeholder={__('Enter your text...', 'universal-block')}
					/>
				);

			case 'link':
				return (
					<RichText
						tagName="a"
						value={content}
						onChange={(value) => setAttributes({ content: value })}
						placeholder={__('Enter link text...', 'universal-block')}
					/>
				);

			case 'image':
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
								{__('Enter image URL in the sidebar', 'universal-block')}
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

			case 'svg':
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
							<div style={{ fontSize: '16px', marginBottom: '8px' }}>🖼️</div>
							<div>{__('No SVG content', 'universal-block')}</div>
							<div style={{ fontSize: '12px', marginTop: '4px' }}>
								{__('Add SVG content in the sidebar', 'universal-block')}
							</div>
						</div>
					);
				}

				// Combine globalAttrs to create the SVG element attributes
				const svgAttrs = Object.entries(globalAttrs || {})
					.map(([key, value]) => `${key}="${value}"`)
					.join(' ');

				const fullSvgContent = `<svg ${svgAttrs}>${content}</svg>`;

				return (
					<div
						dangerouslySetInnerHTML={{ __html: fullSvgContent }}
					/>
				);

			case 'rule':
				return <hr />;

			case 'container':
				return children;

			default:
				return (
					<RichText
						tagName={tagName}
						value={content}
						onChange={(value) => setAttributes({ content: value })}
						placeholder={__('Enter your text...', 'universal-block')}
					/>
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

	// Use innerBlocksProps for containers, blockProps for others
	const wrapperProps = isContainer ? innerBlocksProps : blockProps;

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

				<PanelBody title={__('Element Settings', 'universal-block')}>
					<SelectControl
						label={__('Element Type', 'universal-block')}
						value={elementType}
						options={ELEMENT_TYPES}
						onChange={(value) => {
							const updates = { elementType: value };

							// Set appropriate defaults when switching element types
							switch (value) {
								case 'text':
									updates.tagName = 'p';
									updates.selfClosing = false;
									break;
								case 'heading':
									updates.tagName = 'h2';
									updates.selfClosing = false;
									break;
								case 'link':
									updates.tagName = 'a';
									updates.selfClosing = false;
									break;
								case 'image':
									updates.tagName = 'img';
									updates.selfClosing = true;
									break;
								case 'svg':
									updates.tagName = 'svg';
									updates.selfClosing = false;
									break;
								case 'rule':
									updates.tagName = 'hr';
									updates.selfClosing = true;
									break;
								case 'container':
									updates.tagName = 'div';
									updates.selfClosing = false;
									break;
							}

							setAttributes(updates);
						}}
					/>

					<ElementTypeControls
						elementType={elementType}
						attributes={attributes}
						setAttributes={setAttributes}
					/>
				</PanelBody>

				<AttributesPanel
					globalAttrs={globalAttrs}
					setAttributes={setAttributes}
				/>
			</InspectorControls>

			{renderElementTypeContent()}
		</div>
	);
}