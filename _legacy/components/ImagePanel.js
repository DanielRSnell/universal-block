/**
 * Image Panel Component
 *
 * Provides WordPress media library integration for image tags
 */

import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	Button,
	TextControl,
	BaseControl
} from '@wordpress/components';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';

export function ImagePanel({ globalAttrs, setAttributes }) {
	const [showAdvanced, setShowAdvanced] = useState(false);

	const src = globalAttrs?.src || '';
	const alt = globalAttrs?.alt || '';
	const title = globalAttrs?.title || '';
	const width = globalAttrs?.width || '';
	const height = globalAttrs?.height || '';

	const updateImageAttribute = (attributeName, value) => {
		const updatedAttrs = { ...globalAttrs, [attributeName]: value };
		setAttributes({ globalAttrs: updatedAttrs });
	};

	const onSelectImage = (media) => {
		const updatedAttrs = {
			...globalAttrs,
			src: media.url,
			alt: media.alt || '',
			title: media.title || '',
			width: media.width ? String(media.width) : '',
			height: media.height ? String(media.height) : ''
		};
		setAttributes({ globalAttrs: updatedAttrs });
	};

	const onRemoveImage = () => {
		const updatedAttrs = { ...globalAttrs };
		delete updatedAttrs.src;
		delete updatedAttrs.alt;
		delete updatedAttrs.title;
		delete updatedAttrs.width;
		delete updatedAttrs.height;
		setAttributes({ globalAttrs: updatedAttrs });
	};

	return (
		<PanelBody title={__('Image Settings', 'universal-block')} initialOpen={true}>
			<MediaUploadCheck>
				<MediaUpload
					onSelect={onSelectImage}
					allowedTypes={['image']}
					value={src}
					render={({ open }) => (
						<div style={{ marginBottom: '16px' }}>
							{src ? (
								<div>
									<img
										src={src}
										alt={alt}
										style={{
											width: '100%',
											height: 'auto',
											marginBottom: '12px',
											border: '1px solid #ddd',
											borderRadius: '4px'
										}}
									/>
									<div style={{
										display: 'flex',
										gap: '8px',
										flexWrap: 'wrap'
									}}>
										<Button
											variant="secondary"
											size="small"
											onClick={open}
										>
											{__('Replace Image', 'universal-block')}
										</Button>
										<Button
											variant="link"
											isDestructive
											size="small"
											onClick={onRemoveImage}
										>
											{__('Remove Image', 'universal-block')}
										</Button>
									</div>
								</div>
							) : (
								<div
									style={{
										border: '1px dashed #ddd',
										borderRadius: '4px',
										padding: '40px 20px',
										textAlign: 'center',
										cursor: 'pointer',
										backgroundColor: '#f9f9f9'
									}}
									onClick={open}
								>
									<div style={{ fontSize: '48px', marginBottom: '8px' }}>📷</div>
									<div style={{ marginBottom: '8px', fontWeight: '500' }}>
										{__('Choose Image', 'universal-block')}
									</div>
									<div style={{ fontSize: '12px', color: '#666' }}>
										{__('Click to select from media library', 'universal-block')}
									</div>
								</div>
							)}
						</div>
					)}
				/>
			</MediaUploadCheck>

			{/* Basic image attributes */}
			<div style={{ marginBottom: '16px' }}>
				<TextControl
					label={__('Alt Text', 'universal-block')}
					value={alt}
					onChange={(value) => updateImageAttribute('alt', value)}
					placeholder={__('Describe the image...', 'universal-block')}
					help={__('Important for accessibility and SEO', 'universal-block')}
					__nextHasNoMarginBottom
				/>
			</div>

			{/* Advanced settings toggle */}
			<Button
				variant="tertiary"
				onClick={() => setShowAdvanced(!showAdvanced)}
				style={{
					marginBottom: showAdvanced ? '16px' : '0',
					fontSize: '12px'
				}}
			>
				{showAdvanced ? __('Hide Advanced', 'universal-block') : __('Show Advanced', 'universal-block')}
			</Button>

			{/* Advanced image attributes */}
			{showAdvanced && (
				<div>
					<div style={{ marginBottom: '12px' }}>
						<TextControl
							label={__('Title', 'universal-block')}
							value={title}
							onChange={(value) => updateImageAttribute('title', value)}
							placeholder={__('Image title...', 'universal-block')}
							__nextHasNoMarginBottom
						/>
					</div>

					<div style={{
						display: 'flex',
						gap: '12px',
						marginBottom: '12px'
					}}>
						<div style={{ flex: 1 }}>
							<TextControl
								label={__('Width', 'universal-block')}
								value={width}
								onChange={(value) => updateImageAttribute('width', value)}
								placeholder="auto"
								__nextHasNoMarginBottom
							/>
						</div>
						<div style={{ flex: 1 }}>
							<TextControl
								label={__('Height', 'universal-block')}
								value={height}
								onChange={(value) => updateImageAttribute('height', value)}
								placeholder="auto"
								__nextHasNoMarginBottom
							/>
						</div>
					</div>

					<div style={{ marginBottom: '12px' }}>
						<TextControl
							label={__('Image URL', 'universal-block')}
							value={src}
							onChange={(value) => updateImageAttribute('src', value)}
							placeholder={__('https://...', 'universal-block')}
							help={__('Direct URL to image file', 'universal-block')}
							__nextHasNoMarginBottom
						/>
					</div>
				</div>
			)}
		</PanelBody>
	);
}