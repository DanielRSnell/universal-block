import { __ } from '@wordpress/i18n';
import {
	TextControl,
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
	const { tagName, href, target, rel, src, alt, selfClosing } = attributes;

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
						onChange={(value) => setAttributes({ href: value })}
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
						onChange={(value) => setAttributes({ target: value })}
					/>
					<TextControl
						label={__('Rel', 'universal-block')}
						value={rel}
						onChange={(value) => setAttributes({ rel: value })}
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
									setAttributes({
										src: media.url,
										alt: media.alt || ''
									});
								}}
								allowedTypes={['image']}
								value={src}
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
															maxHeight: '150px',
															border: '1px solid #ddd',
															borderRadius: '4px'
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
													onClick={() => setAttributes({ src: '', alt: '' })}
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
						onChange={(value) => setAttributes({ alt: value })}
						placeholder={__('Describe the image...', 'universal-block')}
						help={__('Important for accessibility and SEO', 'universal-block')}
					/>

					<TextControl
						label={__('Image URL', 'universal-block')}
						value={src || ''}
						onChange={(value) => setAttributes({ src: value })}
						placeholder="https://example.com/image.jpg"
						help={__('Or enter image URL manually', 'universal-block')}
					/>
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