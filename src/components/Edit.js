import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	RichText,
	InnerBlocks,
	useBlockProps,
	useInnerBlocksProps
} from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl
} from '@wordpress/components';
import { ElementTypeControls } from './ElementTypeControls';
import { AttributesPanel } from './AttributesPanel';
import { BlockNamePanel } from './BlockNamePanel';
import { ClassesPanel } from './ClassesPanel';

const ELEMENT_TYPES = [
	{ label: __('Text', 'universal-block'), value: 'text' },
	{ label: __('Heading', 'universal-block'), value: 'heading' },
	{ label: __('Link', 'universal-block'), value: 'link' },
	{ label: __('Image', 'universal-block'), value: 'image' },
	{ label: __('Rule', 'universal-block'), value: 'rule' },
	{ label: __('Container', 'universal-block'), value: 'container' }
];

export default function Edit({ attributes, setAttributes }) {
	const {
		blockName,
		elementType,
		tagName,
		content,
		href,
		target,
		rel,
		src,
		alt,
		selfClosing,
		globalAttrs,
		className
	} = attributes;

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
						style={{
							maxWidth: '100%',
							height: 'auto',
							border: '1px solid #ddd',
							borderRadius: '4px'
						}}
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

	// Use innerBlocksProps for containers, blockProps for others
	const wrapperProps = isContainer ? innerBlocksProps : blockProps;

	return (
		<div {...wrapperProps}>
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