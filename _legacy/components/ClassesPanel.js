import { __ } from '@wordpress/i18n';
import { TextareaControl, Button } from '@wordpress/components';
import { useEffect } from '@wordpress/element';

export function ClassesPanel({ className, setAttributes }) {
	// Always sync with the current className from the block
	useEffect(() => {
		// No local state needed - always use the className prop directly
	}, [className]);

	const handleInputChange = (value) => {
		// Clean up the input - remove extra spaces, normalize
		const cleanedClasses = value
			.trim()
			.split(/\s+/)
			.filter(cls => cls.length > 0)
			.join(' ');

		// Auto-update the className immediately as user types
		setAttributes({ className: cleanedClasses || '' });
	};

	const handleClear = () => {
		setAttributes({ className: '' });
	};

	return (
		<>
			<TextareaControl
				value={className || ''}
				onChange={handleInputChange}
				placeholder={__('Enter CSS classes separated by spaces...', 'universal-block')}
				help={__('Add utility classes like: flex justify-center items-center p-4 bg-blue-500', 'universal-block')}
				rows={3}
			/>

			{className && (
				<div style={{ marginTop: '8px' }}>
					<Button
						variant="tertiary"
						isSmall
						isDestructive
						onClick={handleClear}
					>
						{__('Clear All Classes', 'universal-block')}
					</Button>
				</div>
			)}

			{className && (
				<div style={{
					marginTop: '12px',
					padding: '8px',
					backgroundColor: '#f8f9fa',
					border: '1px solid #e1e4e8',
					borderRadius: '4px',
					fontSize: '12px',
					fontFamily: 'monospace'
				}}>
					<div style={{ marginBottom: '4px', fontWeight: '500', fontSize: '11px', textTransform: 'uppercase', color: '#6b7280' }}>
						{__('Current Classes:', 'universal-block')}
					</div>
					<div style={{ wordBreak: 'break-all', lineHeight: '1.4' }}>
						{className.split(' ').map((cls, index) => (
							<span key={index} style={{
								display: 'inline-block',
								backgroundColor: '#e5e7eb',
								color: '#374151',
								padding: '2px 6px',
								margin: '2px',
								borderRadius: '3px',
								fontSize: '11px'
							}}>
								{cls}
							</span>
						))}
					</div>
				</div>
			)}
		</>
	);
}