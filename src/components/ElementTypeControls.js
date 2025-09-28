import { __ } from '@wordpress/i18n';
import {
	TextControl,
	TextareaControl,
	SelectControl,
	ToggleControl,
	Button,
	BaseControl
} from '@wordpress/components';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';

const TAG_OPTIONS = {
	text: [
		{ label: 'p', value: 'p' },
		{ label: 'span', value: 'span' },
		{ label: 'div', value: 'div' }
	],
	heading: [
		{ label: 'h1', value: 'h1' },
		{ label: 'h2', value: 'h2' },
		{ label: 'h3', value: 'h3' },
		{ label: 'h4', value: 'h4' },
		{ label: 'h5', value: 'h5' },
		{ label: 'h6', value: 'h6' }
	],
	link: [
		{ label: 'a', value: 'a' }
	],
	image: [
		{ label: 'img', value: 'img' }
	],
	rule: [
		{ label: 'hr', value: 'hr' }
	],
	svg: [
		{ label: 'svg', value: 'svg' }
	],
	container: [
		{ label: 'div', value: 'div' },
		{ label: 'section', value: 'section' },
		{ label: 'article', value: 'article' },
		{ label: 'main', value: 'main' },
		{ label: 'aside', value: 'aside' },
		{ label: 'header', value: 'header' },
		{ label: 'footer', value: 'footer' }
	]
};

export function ElementTypeControls({ elementType, attributes, setAttributes }) {
	const { tagName, globalAttrs, selfClosing } = attributes;

	// Function to parse complete SVG and extract attributes
	const parseSvgAndUpdate = (svgString) => {
		try {
			const parser = new DOMParser();
			const doc = parser.parseFromString(svgString, 'image/svg+xml');
			const svgElement = doc.querySelector('svg');

			if (!svgElement) {
				alert(__('Invalid SVG format. Please check your SVG code.', 'universal-block'));
				return;
			}

			// Extract all attributes from the SVG element
			const extractedAttrs = {};
			Array.from(svgElement.attributes).forEach(attr => {
				extractedAttrs[attr.name] = attr.value;
			});

			// Get the inner content (everything between <svg> and </svg>)
			const innerContent = svgElement.innerHTML;

			// Update both globalAttrs and content (for SVG inner HTML)
			const newGlobalAttrs = { ...globalAttrs, ...extractedAttrs };
			setAttributes({
				globalAttrs: newGlobalAttrs,
				content: innerContent
			});

		} catch (error) {
			console.error('Error parsing SVG:', error);
			alert(__('Error parsing SVG. Please check the format and try again.', 'universal-block'));
		}
	};

	// Helper function to update globalAttrs
	const updateGlobalAttr = (attrName, value) => {
		const newGlobalAttrs = { ...globalAttrs };
		// Only delete if explicitly clearing (null/undefined), allow empty strings
		if (value === null || value === undefined) {
			delete newGlobalAttrs[attrName];
		} else {
			newGlobalAttrs[attrName] = value;
		}
		setAttributes({ globalAttrs: newGlobalAttrs });
	};

	// Helper to clear attribute (for remove buttons)
	const clearGlobalAttr = (attrName) => {
		const newGlobalAttrs = { ...globalAttrs };
		delete newGlobalAttrs[attrName];
		setAttributes({ globalAttrs: newGlobalAttrs });
	};

	// Get values from globalAttrs
	const href = globalAttrs.href || '';
	const target = globalAttrs.target || '';
	const rel = globalAttrs.rel || '';
	const src = globalAttrs.src || '';
	const alt = globalAttrs.alt || '';
	const mediaId = globalAttrs.mediaId;

	const tagOptions = TAG_OPTIONS[elementType] || TAG_OPTIONS.text;

	return (
		<>
			<SelectControl
				label={__('HTML Tag', 'universal-block')}
				value={tagName}
				options={tagOptions}
				onChange={(value) => setAttributes({ tagName: value })}
			/>

			{elementType === 'link' && (
				<>
					<TextControl
						label={__('URL', 'universal-block')}
						value={href}
						onChange={(value) => updateGlobalAttr('href', value)}
						placeholder="https://example.com"
					/>
					<SelectControl
						label={__('Target', 'universal-block')}
						value={target}
						options={[
							{ label: __('Same window', 'universal-block'), value: '' },
							{ label: __('New window', 'universal-block'), value: '_blank' },
							{ label: __('Parent frame', 'universal-block'), value: '_parent' },
							{ label: __('Top frame', 'universal-block'), value: '_top' }
						]}
						onChange={(value) => updateGlobalAttr('target', value)}
					/>
					<TextControl
						label={__('Rel', 'universal-block')}
						value={rel}
						onChange={(value) => updateGlobalAttr('rel', value)}
						placeholder="noopener noreferrer"
					/>
				</>
			)}

			{elementType === 'image' && (
				<>
					<BaseControl label={__('Image', 'universal-block')}>
						<MediaUploadCheck>
							<MediaUpload
								onSelect={(media) => {
									// Update all image attributes at once to avoid overwriting
									const newGlobalAttrs = {
										...globalAttrs,
										mediaId: media.id,
										src: media.url,
										alt: media.alt || ''
									};
									setAttributes({ globalAttrs: newGlobalAttrs });
								}}
								allowedTypes={['image']}
								value={mediaId}
								render={({ open }) => (
									<>
										{!src && (
											<Button
												onClick={open}
												variant="secondary"
											>
												{__('Select Image', 'universal-block')}
											</Button>
										)}
										{src && (
											<>
												<div style={{ marginBottom: '10px' }}>
													<img
														src={src}
														alt={alt || ''}
														style={{
															maxWidth: '100%',
															height: 'auto',
															maxHeight: '150px'
														}}
													/>
												</div>
												<Button
													onClick={open}
													variant="secondary"
													style={{ marginRight: '8px' }}
												>
													{__('Replace Image', 'universal-block')}
												</Button>
												<Button
													onClick={() => {
														// Clear all image attributes at once
														const newGlobalAttrs = { ...globalAttrs };
														delete newGlobalAttrs.mediaId;
														delete newGlobalAttrs.src;
														delete newGlobalAttrs.alt;
														setAttributes({ globalAttrs: newGlobalAttrs });
													}}
													variant="link"
													isDestructive
												>
													{__('Remove', 'universal-block')}
												</Button>
											</>
										)}
									</>
								)}
							/>
						</MediaUploadCheck>
					</BaseControl>

					<TextControl
						label={__('Alt Text', 'universal-block')}
						value={alt || ''}
						onChange={(value) => updateGlobalAttr('alt', value)}
						placeholder={__('Describe the image...', 'universal-block')}
						help={__('Important for accessibility and SEO', 'universal-block')}
					/>

					<TextControl
						label={__('Image URL', 'universal-block')}
						value={src || ''}
						onChange={(value) => updateGlobalAttr('src', value)}
						placeholder="https://example.com/image.jpg"
						help={__('Or enter image URL manually', 'universal-block')}
					/>
				</>
			)}

			{elementType === 'svg' && (
				<>
					<TextareaControl
						label={__('SVG Content', 'universal-block')}
						value={(elementType === 'svg' ? attributes.content : svgContent) || ''}
						onChange={(value) => {
							// Check if user pasted a complete SVG element
							if (value.trim().startsWith('<svg') && value.trim().includes('>')) {
								parseSvgAndUpdate(value);
							} else {
								console.log('Setting content (SVG) to:', value);
								// Store SVG inner content in the 'content' attribute instead of 'svgContent'
								setAttributes({ content: value });
							}
						}}
						placeholder={__('Enter SVG inner content (paths, circles, etc.) or paste complete <svg> element to auto-parse...', 'universal-block')}
						help={__('Paste a complete SVG to automatically extract attributes, or enter just the inner content manually.', 'universal-block')}
						rows={8}
						style={{ fontFamily: 'monospace', fontSize: '12px' }}
					/>

					<div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
						<Button
							variant="secondary"
							size="small"
							onClick={() => {
								const input = prompt(__('Paste your complete SVG here:', 'universal-block'));
								if (input && input.trim()) {
									parseSvgAndUpdate(input.trim());
								}
							}}
						>
							{__('Parse Full SVG', 'universal-block')}
						</Button>

						<Button
							variant="link"
							isDestructive
							onClick={() => setAttributes({ content: '' })}
							disabled={!attributes.content}
							size="small"
						>
							{__('Clear', 'universal-block')}
						</Button>
					</div>

					{attributes.content && (
						<BaseControl label={__('Preview', 'universal-block')}>
							<div style={{
								padding: '16px',
								border: '1px solid #e0e0e0',
								borderRadius: '4px',
								backgroundColor: '#f8f9fa',
								textAlign: 'center'
							}}>
								<div
									dangerouslySetInnerHTML={{
										__html: `<svg ${Object.entries(globalAttrs || {})
											.map(([key, value]) => `${key}="${value}"`)
											.join(' ')}>${attributes.content}</svg>`
									}}
								/>
							</div>
						</BaseControl>
					)}
				</>
			)}

			{(elementType === 'rule' || elementType === 'image') && (
				<ToggleControl
					label={__('Self-closing tag', 'universal-block')}
					checked={selfClosing}
					onChange={(value) => setAttributes({ selfClosing: value })}
				/>
			)}
		</>
	);
}