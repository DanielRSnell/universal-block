import { __ } from '@wordpress/i18n';
import { TextControl } from '@wordpress/components';

export function BlockContextPanel({ blockContext, setAttributes }) {
	return (
		<>
			<TextControl
				label={__('Block Context', 'universal-block')}
				value={blockContext || ''}
				onChange={(value) => setAttributes({ blockContext: value })}
				help={__(
					'Optional context name for custom Timber data. Use filters like "universal_block/context/product_gallery" to add specific data only when needed.',
					'universal-block'
				)}
				placeholder={__('e.g., product_gallery', 'universal-block')}
			/>
		</>
	);
}
