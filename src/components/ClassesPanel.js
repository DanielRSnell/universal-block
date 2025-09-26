import { __ } from '@wordpress/i18n';
import { TextareaControl, Button, Flex, FlexItem } from '@wordpress/components';
import { useState } from '@wordpress/element';

export function ClassesPanel({ className, setAttributes }) {
	const [inputValue, setInputValue] = useState(className || '');

	const handleApply = () => {
		// Clean up the input - remove extra spaces, normalize
		const cleanedClasses = inputValue
			.trim()
			.split(/\s+/)
			.filter(cls => cls.length > 0)
			.join(' ');

		setAttributes({ className: cleanedClasses });
	};

	const handleClear = () => {
		setInputValue('');
		setAttributes({ className: '' });
	};

	const handleInputChange = (value) => {
		setInputValue(value);
	};

	// Auto-apply on blur for better UX
	const handleBlur = () => {
		if (inputValue !== className) {
			handleApply();
		}
	};

	const hasChanges = inputValue !== (className || '');

	return (
		<>
			<TextareaControl
				label={__('CSS Classes', 'universal-block')}
				value={inputValue}
				onChange={handleInputChange}
				onBlur={handleBlur}
				placeholder={__('Enter CSS classes separated by spaces...', 'universal-block')}
				help={__('Add utility classes like: flex justify-center items-center p-4 bg-blue-500', 'universal-block')}
				rows={3}
			/>

			{hasChanges && (
				<Flex justify="space-between" style={{ marginTop: '8px' }}>
					<FlexItem>
						<Button
							variant="secondary"
							isSmall
							onClick={handleApply}
						>
							{__('Apply Changes', 'universal-block')}
						</Button>
					</FlexItem>
					<FlexItem>
						<Button
							variant="tertiary"
							isSmall
							isDestructive
							onClick={handleClear}
						>
							{__('Clear All', 'universal-block')}
						</Button>
					</FlexItem>
				</Flex>
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